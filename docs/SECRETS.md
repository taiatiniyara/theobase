# GitHub Secrets Reference

Required for CI/CD pipelines (`.github/workflows/ci.yml`, `deploy.yml`, `deploy-relay.yml`).

## Required for all deploys: Cloudflare

These are needed to deploy the API Worker, Durable Object, and Pages PWA.

| Secret | How to get it |
|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template. Needs Account:Workers Scripts:Edit and Account:Workers KV:Edit permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → Workers & Pages → Overview. Copy the Account ID from the right sidebar. |

```bash
# Set via gh CLI (preferred):
gh secret set CLOUDFLARE_API_TOKEN --body "your-token-here"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id-here"
```

## Optional: SMTP Relay VPS

Only needed if you want automated Docker deployment to your relay VPS. The deploy-relay workflow skips the deploy step if `RELAY_HOST` is not set.

### Secrets
| Secret | How to get it |
|--------|---------------|
| `VPS_SSH_KEY` | SSH private key for relay VPS. Generate: `ssh-keygen -t ed25519 -f ~/.ssh/theobase-relay`. Add the `.pub` to `~/.ssh/authorized_keys` on the VPS. |

```bash
gh secret set VPS_SSH_KEY --body "$(cat ~/.ssh/theobase-relay)"
```

### Variables
| Variable | Example | Description |
|----------|---------|-------------|
| `RELAY_HOST` | `203.0.113.1` | VPS IPv4 address or hostname |
| `RELAY_USER` | `root` | SSH username (defaults to `root`) |
| `CONTAINER_REGISTRY` | `ghcr.io` | Container registry (defaults to `ghcr.io`) |

```bash
gh variable set RELAY_HOST --body "your-vps-ip"
# RELAY_USER and CONTAINER_REGISTRY are optional (have defaults)
```

## Auto-provided

| Secret | Provided by |
|--------|-------------|
| `GITHUB_TOKEN` | GitHub Actions automatically (used for GHCR login) |
| `SMTP_PASS` | Set in VPS environment, not needed as GitHub secret |
| `JWT_SECRET` | Set in Cloudflare Workers environment, not needed as GitHub secret |

## Verification

After setting secrets, push a commit to `main` to trigger CI or run manually:
```bash
gh workflow run ci.yml
gh workflow run deploy.yml
```
