# Deployment Guide

## Components

| Component         | Target                     | URL                  | Config                    |
| ----------------- | -------------------------- | -------------------- | ------------------------- |
| PWA (SvelteKit)   | Cloudflare Pages           | `theobase.app`       | `apps/web/vite.config.ts` |
| API (Hono Worker) | Cloudflare Workers         | `api.theobase.net`   | `apps/api/wrangler.jsonc` |
| Durable Objects   | Cloudflare Workers         | (internal)           | `apps/do/wrangler.jsonc`  |
| D1 Database       | Cloudflare D1              | (internal)           | `apps/api/wrangler.jsonc` |
| R2 Storage        | Cloudflare R2              | (internal)           | `apps/api/wrangler.jsonc` |
| SMTP Relay        | `@taiatiniyara/smtp-relay` | `relay.theobase.net` | —                         |

## CI/CD

GitHub Actions handles all deployments:

| Workflow     | Trigger                           | Action                                                        |
| ------------ | --------------------------------- | ------------------------------------------------------------- |
| `ci.yml`     | Push to `main`, PR                | Typecheck → Lint → Test (8 suites)                            |
| `deploy.yml` | Push to `main` (api/do/web paths) | Typecheck → Lint → Test → Deploy DO → Deploy Web → Deploy API |
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
- Environment: `SMTP_RELAY_URL`, `SMTP_RELAY_PIN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `JWT_SECRET`
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

## SMTP Relay

The Workers use `@taiatiniyara/smtp-relay-client` to forward email requests to
a stateless SMTP relay server. SMTP credentials are sent with each request; the
relay itself is credential-free. See [@taiatiniyara/smtp-relay](https://github.com/taiatiniyara/smtp-relay).

## Environment Variables

### API Worker (`apps/api`)

| Variable         | Description                | Default                |
| ---------------- | -------------------------- | ---------------------- |
| `APP_URL`        | PWA origin for magic links | `https://theobase.app` |
| `SMTP_RELAY_URL` | SMTP relay endpoint        | (secret)               |
| `SMTP_RELAY_PIN` | Relay shared PIN           | (secret)               |
| `SMTP_HOST`      | SMTP server hostname       | (secret)               |
| `SMTP_PORT`      | SMTP server port           | `465`                  |
| `SMTP_USER`      | SMTP auth username         | (secret)               |
| `SMTP_PASS`      | SMTP auth password         | (secret)               |
| `SMTP_FROM`      | From address for emails    | (secret)               |

### DO Worker (`apps/do`)

| Variable         | Description             |
| ---------------- | ----------------------- |
| `SMTP_RELAY_URL` | SMTP relay endpoint     |
| `SMTP_RELAY_PIN` | Relay shared PIN        |
| `SMTP_HOST`      | SMTP server hostname    |
| `SMTP_PORT`      | SMTP server port        |
| `SMTP_USER`      | SMTP auth username      |
| `SMTP_PASS`      | SMTP auth password      |
| `SMTP_FROM`      | From address for emails |
| `JWT_SECRET`     | JWT signing secret      |

## Data Survivability

- **D1**: Cloudflare-managed backups + daily SQL dump workflow (90-day retention)
- **R2**: Receipt images are stored with no single-point-of-failure (Cloudflare R2)
- **DO State**: In-memory only; hydrated from D1 on wake. No persistent DO storage.

## Rollback

```bash
# API Worker
npx wrangler rollback --config apps/api/wrangler.jsonc

# Durable Object
npx wrangler rollback --config apps/do/wrangler.jsonc

# PWA
npx wrangler pages deployment list --project-name theobase-web
npx wrangler pages deployment rollback --project-name theobase-web
```
