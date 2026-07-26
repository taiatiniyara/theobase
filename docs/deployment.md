# Deployment Guide

This guide covers deploying Theobase to production on Cloudflare Workers.

## Prerequisites

- Cloudflare account (Workers Paid plan recommended for production; D1 and Durable Objects available on Free plan for development)
- Node.js 22+
- Domain configured in Cloudflare DNS (e.g., `theobase.app`)
- Wrangler CLI (`npm install` in the project installs it as a dev dependency)

## 1. Custom domain

In the Cloudflare dashboard, add your custom domain to Workers Routes or use a Worker custom domain. The frontend SPA will connect to the Worker at this domain.

## 2. D1 database

```bash
npx wrangler d1 create theobase
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

Apply all migrations:

```bash
npx wrangler d1 migrations apply theobase
```

To run a single migration file instead:

```bash
npx wrangler d1 execute theobase --file=migrations/0001_initial.sql
```

## 3. Cloudflare secrets

Set production secrets via Wrangler:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put ALLOWED_ORIGINS
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
npx wrangler deploy
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
npx wrangler d1 migrations apply theobase-staging --env staging
```

### Set staging secrets

```bash
npx wrangler secret put JWT_SECRET --env staging
npx wrangler secret put ALLOWED_ORIGINS --env staging
```

### Deploy to staging

```bash
npx wrangler deploy --env staging
```

Staging is deployed automatically by CI on push to `main`. For manual deploy, run the command above.

## 9. Production deployment

Production deployment uses the `production` environment defined in `wrangler.jsonc`.

```bash
npx wrangler deploy --env production
```

CI/CD (`.github/workflows/ci.yml`) automates: lint, typecheck, test, coverage, e2e, staging deploy, then production deploy on push to `main`.

## 10. Production checklist

### Automated (verified by CI)

- [x] Tests pass (132/132 across 15 test files)
- [x] TypeScript compiles cleanly (tsc --noEmit)
- [x] Lint passes (0 errors)
- [x] Pre-commit hooks active (Husky + lint-staged: Prettier + ESLint)
- [x] Frontend builds (`npm run build` produces dist/)
- [x] npm audit clean (0 vulnerabilities)
- [x] CI/CD pipeline runs on push/PR to main
- [x] Production environment configured in wrangler.jsonc

### Manual setup (one-time)

- [ ] Custom domain configured and serving traffic
- [ ] D1 database created for production: `npx wrangler d1 create theobase-production`
- [ ] D1 database created for staging: `npx wrangler d1 create theobase-staging`
- [ ] Update `wrangler.jsonc` with real D1 database IDs (replace placeholder `"theobase-production"` and `"theobase-staging"`)
- [ ] Run migrations on production: `npx wrangler d1 migrations apply theobase-production --env production`
- [ ] Run migrations on staging: `npx wrangler d1 migrations apply theobase-staging --env staging`

### Secrets (one-time per environment)

- [ ] `JWT_SECRET` set: `npx wrangler secret put JWT_SECRET --env production` (use `openssl rand -hex 64`)
- [ ] `JWT_SECRET` set: `npx wrangler secret put JWT_SECRET --env staging`
- [ ] `ALLOWED_ORIGINS` set: `npx wrangler secret put ALLOWED_ORIGINS --env production` (e.g. `https://theobase.app`)
- [ ] `ALLOWED_ORIGINS` set: `npx wrangler secret put ALLOWED_ORIGINS --env staging`
- [ ] `SENTRY_DSN` set for error monitoring: `npx wrangler secret put SENTRY_DSN --env production`
- [ ] `STRIPE_SECRET_KEY` set: `npx wrangler secret put STRIPE_SECRET_KEY --env production`
- [ ] `STRIPE_WEBHOOK_SECRET` set: `npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production`

### Infrastructure verification

- [ ] Worker deployed: `npx wrangler deploy --env production`
- [ ] Health endpoint returns 200: `curl https://<your-domain>/api/health`
- [ ] Frontend built and deployed (Cloudflare Pages or Worker ASSETS binding)
- [ ] Durable Object migration tagged and deployed (tag `v1` in wrangler.jsonc)
- [ ] Analytics Engine dataset created and binding configured
- [ ] Email binding configured and SPF/DKIM/DMARC records applied

### Pre-launch verification

- [ ] Staging verified: sign up, create Conference, check provisioning
- [ ] Smoke test: sign up, verify email, log in, create a church, record attendance
- [ ] Observability dashboard checked (Cloudflare Workers + Sentry + Analytics)
- [ ] Rate limiting verified (no 429s under normal use)
- [ ] CSP headers verified (Content-Security-Policy-Report-Only present on all responses)
- [ ] CORS restricted to ALLOWED_ORIGINS (test with external origin)
- [ ] Stripe checkout flow tested end-to-end
- [ ] DR restore procedure tested (tabletop exercise complete)

## Rollback

```bash
npx wrangler rollback
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
