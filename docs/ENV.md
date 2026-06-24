# Environment Variables

## Cloudflare Workers (set via `wrangler secret put`)

| Variable         | App     | Required | Description                                                      |
| ---------------- | ------- | -------- | ---------------------------------------------------------------- |
| `JWT_SECRET`     | api, do | Yes      | Random string for signing JWTs. Generate: `openssl rand -hex 32` |
| `SMTP_RELAY_URL` | api, do | Yes      | URL of the SMTP relay server                                     |
| `SMTP_RELAY_PIN` | api, do | Yes      | Shared PIN matching the relay server                             |
| `SMTP_HOST`      | api, do | Yes      | SMTP server hostname, e.g. `smtp.hostinger.com`                  |
| `SMTP_PORT`      | api, do | No       | SMTP port, defaults to `465`                                     |
| `SMTP_USER`      | api, do | Yes      | SMTP auth username, e.g. `messenger@theobase.net`                |
| `SMTP_PASS`      | api, do | Yes      | SMTP auth password                                               |
| `SMTP_FROM`      | api, do | Yes      | From email address, e.g. `messenger@theobase.net`                |
| `APP_URL`        | api     | No       | PWA URL, defaults to `https://theobase.app`                      |

```bash
cd apps/api
npx wrangler secret put JWT_SECRET
npx wrangler secret put SMTP_RELAY_URL
npx wrangler secret put SMTP_RELAY_PIN
npx wrangler secret put SMTP_HOST
npx wrangler secret put SMTP_PORT
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
npx wrangler secret put SMTP_FROM

cd ../do
npx wrangler secret put SMTP_RELAY_URL
npx wrangler secret put SMTP_RELAY_PIN
npx wrangler secret put SMTP_HOST
npx wrangler secret put SMTP_PORT
npx wrangler secret put SMTP_USER
npx wrangler secret put SMTP_PASS
npx wrangler secret put SMTP_FROM
npx wrangler secret put JWT_SECRET
```

## GitHub Actions Secrets

| Secret                  | Used by    | Required                |
| ----------------------- | ---------- | ----------------------- |
| `CLOUDFLARE_API_TOKEN`  | deploy.yml | Yes — wrangler deploy   |
| `CLOUDFLARE_ACCOUNT_ID` | deploy.yml | Yes — wrangler deploy   |
| `GITHUB_TOKEN`          | backup.yml | Auto-provided by GitHub |
