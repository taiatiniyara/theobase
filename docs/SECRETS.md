# GitHub Secrets Reference

Required for CI/CD pipelines (`.github/workflows/ci.yml`, `deploy.yml`).

## Required for all deploys: Cloudflare

These are needed to deploy the API Worker, Durable Object, and Pages PWA.

| Secret                  | How to get it                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template. Needs Account:Workers Scripts:Edit and Account:Workers KV:Edit permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Workers & Pages → Overview. Copy the Account ID from the right sidebar.                                                                                  |

```bash
# Set via gh CLI (preferred):
gh secret set CLOUDFLARE_API_TOKEN --body "your-token-here"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id-here"
```

## SMTP Relay VPS

The SMTP relay is deployed manually via Docker Compose. See `docs/DEPLOYMENT.md`.

Secrets set directly on the VPS, not in GitHub:

- `SMTP_PASS` — Hostinger SMTP password
- `RELAY_TOKEN` — Pre-shared auth token for the HTTPS endpoint

## Auto-provided

| Secret         | Provided by                                                        |
| -------------- | ------------------------------------------------------------------ |
| `GITHUB_TOKEN` | GitHub Actions automatically                                       |
| `JWT_SECRET`   | Set in Cloudflare Workers environment, not needed as GitHub secret |

## Verification

After setting secrets, push a commit to `main` to trigger CI or run manually:

```bash
gh workflow run ci.yml
gh workflow run deploy.yml
```
