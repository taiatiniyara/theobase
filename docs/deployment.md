# Deployment Guide

This guide covers deploying Theobase to production on Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers plan (paid, for D1 and Durable Objects)
- Node.js 22+
- Domain configured in Cloudflare DNS (e.g., `theobase.app`)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)

## 1. Custom domain

In the Cloudflare dashboard, add your custom domain to Workers Routes or use a Worker custom domain. The frontend SPA will connect to the Worker at this domain.

## 2. D1 database

```bash
wrangler d1 create theobase
```

Note the database ID and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "theobase",
    "database_id": "<your-database-id>",
    "migrations_dir": "migrations"
  }
]
```

Run migrations:

```bash
wrangler d1 execute theobase --file=migrations/0001_initial.sql
wrangler d1 execute theobase --file=migrations/0002_auth_reset.sql
wrangler d1 execute theobase --file=migrations/0003_reconciliation.sql
wrangler d1 execute theobase --file=migrations/0004_finance_and_transfer_enhancements.sql
wrangler d1 execute theobase --file=migrations/0005_attendance.sql
wrangler d1 execute theobase --file=migrations/0006_rate_limits.sql
wrangler d1 execute theobase --file=migrations/0007_user_management.sql
wrangler d1 execute theobase --file=migrations/0008_member_self_service.sql
wrangler d1 execute theobase --file=migrations/0009_transfer_lifecycle.sql
wrangler d1 execute theobase --file=migrations/0010_email_verification.sql
```

## 3. Cloudflare secrets

Set production secrets via Wrangler:

```bash
wrangler secret put JWT_SECRET
wrangler secret put ALLOWED_ORIGINS
```

- `JWT_SECRET`: a long random string (use `openssl rand -hex 64`). This is the signing key for all JWT tokens.
- `ALLOWED_ORIGINS`: comma-separated list of allowed CORS origins (e.g., `https://theobase.app,https://www.theobase.app`).

Secrets are encrypted at rest and never appear in source code or build output.

## 4. Durable Object migration

The worker uses Durable Objects for church sync and conference data. If this is a new deployment, the migration tag in `wrangler.jsonc` must match:

```jsonc
"migrations": [
  {
    "tag": "v1",
    "new_classes": ["ChurchSyncDO", "ConferenceDO"]
  }
]
```

No changes needed for existing deployments unless new DO classes are added.

## 5. Email binding

The platform sends password-reset and email-verification emails via Cloudflare Email Workers.

Configure the email binding in `wrangler.jsonc`:

```jsonc
"send_email": [{ "name": "EMAIL" }]
```

In the Cloudflare dashboard, navigate to **Workers & Pages** > **Email** > **Email Routing** and configure your domain with the necessary SPF/DKIM/DMARC records.

## 6. Deploy

```bash
wrangler deploy
```

Verify the deployment:

```bash
curl https://<your-domain>/api/health
# {"status":"ok","database":"connected"}
```

## 7. Frontend build

The frontend is a Vite SPA. Build and deploy to Cloudflare Pages or serve from the Worker's asset binding.

```bash
npm run build
```

Deploy the `dist/` directory to Cloudflare Pages, or configure the Worker's `ASSETS` binding to serve it.

## 8. Staging environment

Theobase supports a staging environment for pre-production verification.

### Create staging D1

```bash
wrangler d1 create theobase-staging
```

Note the database ID and replace `"theobase-staging"` in `wrangler.jsonc` under `env.staging.d1_databases[0].database_id`.

### Run staging migrations

```bash
for f in migrations/*.sql; do
  wrangler d1 execute theobase-staging --env staging --file="$f"
done
```

### Set staging secrets

```bash
wrangler secret put JWT_SECRET --env staging
wrangler secret put ALLOWED_ORIGINS --env staging
```

### Deploy to staging

```bash
wrangler deploy --env staging
```

Staging deploys automatically from CI on push to `main`. Verify at `https://staging.theobase.app`.

## 9. Production deploy pipeline

Production deploys are gated behind manual approval via GitHub Environments.

### Setup

1. In your GitHub repo, go to **Settings** > **Environments**.
2. Create an environment named `production`.
3. Add required reviewers (your team).
4. Optionally add a wait timer or deployment branch restriction.

### Flow

1. Merge PR to `main`.
2. CI runs checks, tests, coverage, E2E.
3. CI deploys to staging automatically.
4. CI creates a production deployment — reviewers are notified.
5. A reviewer approves the deployment.
6. CI runs `wrangler deploy --env production`.

### Manual production deploy

To deploy directly (bypassing CI):

```bash
wrangler deploy --env production
```

## 10. Production checklist

- [ ] Custom domain configured and serving traffic
- [ ] D1 database created and all migrations run
- [ ] Staging D1 created and migrations run
- [ ] `JWT_SECRET` set via `wrangler secret put` (production and staging)
- [ ] `ALLOWED_ORIGINS` set to production domain(s)
- [ ] `SENTRY_DSN` set for error monitoring
- [ ] Analytics Engine dataset created and binding configured
- [ ] Email binding configured and SPF/DKIM/DMARC records applied
- [ ] Durable Object migration tagged and deployed
- [ ] Worker deployed (`wrangler deploy`)
- [ ] Health endpoint returns 200
- [ ] Frontend built and deployed
- [ ] Staging verified: sign up, create Conference, check provisioning
- [ ] Production GitHub Environment configured with required reviewers
- [ ] Smoke test: sign up, verify email, log in, create a church, record attendance
- [ ] Observability dashboard checked (Cloudflare Workers + Sentry + Analytics)
- [ ] Rate limiting verified (no 429s under normal use)
- [ ] DR restore procedure tested (tabletop exercise complete)

## Rollback

```bash
wrangler rollback
```

Or use the Cloudflare dashboard to roll back to a previous deployment.

## Environment variables reference

| Variable          | Purpose                      | Required                                  |
| ----------------- | ---------------------------- | ----------------------------------------- |
| `JWT_SECRET`      | Signing key for JWT tokens   | Yes                                       |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | Yes                                       |
| `EMAIL`           | Cloudflare Email binding     | No (password reset won't work without it) |

## Troubleshooting

**"table users has no column..."** — run the missing migration.

**401 on all API calls** — check `JWT_SECRET` matches between deployments; tokens signed with one secret won't verify with another.

**CORS errors in browser** — verify `ALLOWED_ORIGINS` includes the frontend's origin, including protocol and port.

**Email not sending** — check the Email binding in `wrangler.jsonc` and DNS records (SPF/DKIM/DMARC).
