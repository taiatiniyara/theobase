# Environment Variables

## Cloudflare Workers (set via `wrangler secret put`)

| Variable | App | Required | Description |
|----------|-----|----------|-------------|
| `JWT_SECRET` | api | Yes | Random string for signing JWTs. Generate: `openssl rand -hex 32` |
| `SMTP_RELAY_URL` | api | Yes | URL of SMTP relay, e.g. `https://relay.theobase.net` |
| `SMTP_RELAY_TOKEN` | api | Yes | Pre-shared token matching `RELAY_TOKEN` on the relay VPS |
| `APP_URL` | api | No | PWA URL, defaults to `https://theobase.app` |

```bash
cd apps/api
npx wrangler secret put JWT_SECRET
npx wrangler secret put SMTP_RELAY_URL
npx wrangler secret put SMTP_RELAY_TOKEN
```

## SMTP Relay VPS (set in `.env` or docker-compose)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Listen port, default `3113` |
| `RELAY_TOKEN` | Yes | Pre-shared token for authenticating Workers requests |
| `SMTP_HOST` | Yes | SMTP server, e.g. `smtp.hostinger.com` |
| `SMTP_PORT` | No | SMTP port, default `465` |
| `SMTP_USER` | Yes | SMTP username, e.g. `messenger@theobase.net` |
| `SMTP_PASS` | Yes | SMTP password |

## GitHub Actions Secrets

| Secret | Used by | Required |
|--------|---------|----------|
| `CLOUDFLARE_API_TOKEN` | deploy.yml | Yes — wrangler deploy |
| `CLOUDFLARE_ACCOUNT_ID` | deploy.yml | Yes — wrangler deploy |
| `VPS_SSH_KEY` | deploy-relay.yml | Only if using VPS relay |
| `GITHUB_TOKEN` | deploy-relay.yml | Auto-provided by GitHub |
