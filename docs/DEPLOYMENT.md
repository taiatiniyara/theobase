# Deployment Guide

## Components

| Component         | Target             | URL                  | Config                    |
| ----------------- | ------------------ | -------------------- | ------------------------- |
| PWA (SvelteKit)   | Cloudflare Pages   | `theobase.app`       | `apps/web/vite.config.ts` |
| API (Hono Worker) | Cloudflare Workers | `api.theobase.net`   | `apps/api/wrangler.jsonc` |
| Durable Objects   | Cloudflare Workers | (internal)           | `apps/do/wrangler.jsonc`  |
| D1 Database       | Cloudflare D1      | (internal)           | `apps/api/wrangler.jsonc` |
| R2 Storage        | Cloudflare R2      | (internal)           | `apps/api/wrangler.jsonc` |
| SMTP Relay        | Docker on VPS      | `relay.theobase.net` | `docker-compose.yml`      |

## CI/CD

GitHub Actions handles all deployments:

| Workflow     | Trigger                           | Action                                                        |
| ------------ | --------------------------------- | ------------------------------------------------------------- |
| `ci.yml`     | Push to `main`, PR                | Typecheck → Lint → Test (all 7 suites)                        |
| `deploy.yml` | Push to `main` (api/do/web paths) | Typecheck → Lint → Test → Deploy API → Deploy DO → Deploy Web |
| `backup.yml` | Daily 4am UTC, manual             | D1 backup → SQL dump → Artifact (90-day retention)            |

### Required Secrets

| Secret                  | Used by                                   |
| ----------------------- | ----------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | deploy-api, deploy-do, deploy-web, backup |
| `CLOUDFLARE_ACCOUNT_ID` | deploy-api, deploy-do, deploy-web, backup |

## Cloudflare Deployment

### API Worker

```bash
cd apps/api
npx wrangler deploy
```

Requires:

- D1 database `theobase-spd` with binding `DB`
- R2 bucket `theobase-receipts` with binding `STORAGE`
- DO bindings: `CONGREGATION_DO`, `NOMINATING_DO`
- Email binding: `THEOBASE_EMAIL`
- Observability: enabled

### Durable Objects

```bash
cd apps/do
npx wrangler deploy
```

Requires:

- DO class `CongregationDO` (migration tag `v1`)
- DO class `NominatingDO` (migration tag `v2`)
- Environment: `SMTP_RELAY_URL`, `SMTP_RELAY_TOKEN`, `JWT_SECRET`
- Observability: enabled

### PWA (Cloudflare Pages)

```bash
cd apps/web
npx vite build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name theobase-web
```

### D1 Migrations

```bash
# Apply migrations
npx wrangler d1 migrations apply theobase-spd --config apps/api/wrangler.jsonc

# List migrations
npx wrangler d1 migrations list theobase-spd --config apps/api/wrangler.jsonc
```

## SMTP Relay (VPS)

The relay is a stateless Node.js HTTP server that proxies email requests from
Cloudflare Workers to Hostinger SMTP. It runs in Docker, behind Nginx, exposed
via Cloudflare Tunnel.

### Quick start (dev)

```bash
docker compose up relay
```

Access on `http://localhost:3113/health` → `{"status":"ok"}`.

### Production

```bash
# First-time SSL certificate
docker compose --profile prod run --rm certbot

# Full stack (relay + nginx + SSL)
SMTP_PASS=your_hostinger_password \
RELAY_TOKEN=your_shared_token \
docker compose --profile prod up -d
```

### Verify

```bash
# Health check (no auth required)
curl https://relay.theobase.net/health
# → {"status":"ok"}

# Send test email (requires token)
curl -X POST https://relay.theobase.net/send \
  -H "Authorization: Bearer $RELAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Hello</p>"}'
# → {"ok":true}
```

## Environment Variables

### SMTP Relay (`apps/relay`)

| Variable      | Description           | Default                           |
| ------------- | --------------------- | --------------------------------- |
| `PORT`        | Listen port           | `3113`                            |
| `RELAY_TOKEN` | Pre-shared auth token | (dev: `theobase-relay-dev-token`) |
| `SMTP_HOST`   | Hostinger SMTP host   | `smtp.hostinger.com`              |
| `SMTP_PORT`   | SMTP port             | `465`                             |
| `SMTP_USER`   | From address          | `messenger@theobase.net`          |
| `SMTP_PASS`   | SMTP password         | (required)                        |

### API Worker (`apps/api`)

| Variable  | Description                |
| --------- | -------------------------- | ---------------------- |
| `APP_URL` | PWA origin for magic links | `https://theobase.app` |

### DO Worker (`apps/do`)

| Variable           | Description        |
| ------------------ | ------------------ | ---------------------------- |
| `SMTP_RELAY_URL`   | Relay endpoint     | `https://relay.theobase.net` |
| `SMTP_RELAY_TOKEN` | Relay auth token   | (secret)                     |
| `JWT_SECRET`       | JWT signing secret | (secret)                     |

## Data Survivability

- **D1**: Cloudflare-managed backups + daily SQL dump workflow (90-day retention)
- **R2**: Receipt images are stored with no single-point-of-failure (Cloudflare R2)
- **DO State**: In-memory only; hydrated from D1 on wake. No persistent DO storage.
- **Relay**: Stateless. Deploy a replacement image to a new VPS if the current host fails.

## Rollback

```bash
# API Worker
npx wrangler rollback --config apps/api/wrangler.jsonc

# Durable Object
npx wrangler rollback --config apps/do/wrangler.jsonc

# PWA
npx wrangler pages deployment list --project-name theobase-web
npx wrangler pages deployment rollback --project-name theobase-web

# Relay (via Docker)
git checkout <last-stable-tag>
docker compose up -d relay
```
