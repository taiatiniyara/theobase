# Theobase Deployment Guide

A step-by-step guide to deploying theobase to Cloudflare Workers.

## 1. Prerequisites

| Tool | Required Version | Check With |
|------|-----------------|------------|
| Node.js | >=22 | `node --version` |
| pnpm | >=9 | `pnpm --version` |
| wrangler | latest | `npx wrangler --version` |
| git | any | `git --version` |

**Accounts required:**

- **Cloudflare account** — for Workers, Durable Objects, D1, R2, Queues, KV, Email Routing, Pages
- **Stripe account** — for Conference subscription billing via Checkout

Authenticate wrangler:

```sh
npx wrangler login
```

## 2. First-Time Setup

```sh
git clone https://github.com/your-org/theobase.git
cd theobase
pnpm install
pnpm --filter @theobase/shared build
```

Verify the build:

```sh
pnpm typecheck
pnpm test
```

## 3. Cloudflare Provisioning

All commands run from the repo root.

### 3a. KV Namespace

```sh
npx wrangler kv:namespace create theobase-auth
```

Output includes an `id` field. Save it — you'll paste it into `wrangler.jsonc` below.

### 3b. D1 Database

```sh
npx wrangler d1 create theobase
```

Save the `database_id` from the output.

### 3c. R2 Bucket

```sh
npx wrangler r2 bucket create theobase-errors
```

No output ID needed for R2 — the binding matches by bucket name.

### 3d. Queue

```sh
npx wrangler queues create error-queue
```

### 3e. Update wrangler.jsonc

Open `packages/worker/wrangler.jsonc` and add the KV and D1 bindings with the provisioned IDs:

```jsonc
"kv_namespaces": [
  {
    "binding": "AUTH_KV",
    "id": "<kv-namespace-id-from-3a>"
  }
],
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "theobase",
    "database_id": "<d1-database-id-from-3b>"
  }
]
```

## 4. Apply D1 Migrations

```sh
pnpm db:migrate
```

This runs `drizzle-kit generate` then applies the migrations to the remote D1 database. The generated SQL files live in `packages/worker/drizzle/`.

## 5. Email Routing

Magic link authentication uses Cloudflare Email Routing. Configure this in the Cloudflare dashboard:

1. Go to **Email > Email Routing** for your domain (`theobase.app`).
2. Ensure your domain has the required MX records (Cloudflare configures these automatically when you enable Email Routing).
3. Under **Routes**, create a catch-all rule or a specific address that forwards to the Worker. The binding name must match what's in `wrangler.jsonc`:

   ```jsonc
   "send_email": [
     { "name": "AUTH_EMAIL" }
   ]
   ```

4. Verify DNS records have propagated: `dig mx theobase.app`

Without Email Routing, magic link emails will not be delivered to users.

## 6. Environment Variables

In `packages/worker/wrangler.jsonc`, set `APP_URL` to the deployed frontend URL. This is used for generating magic link URLs in emails and for CORS configuration:

```jsonc
"vars": {
  "APP_URL": "https://theobase.app"   // production frontend URL
}
```

If you're deploying the frontend to Cloudflare Pages separately, this must match the Pages domain (e.g. `https://theobase.pages.dev`, `https://staging.theobase.app`, or `https://theobase.app` with a custom domain).

## 7. Deploy

The root `deploy` script builds the shared library, builds the web PWA, and deploys the Worker:

```sh
pnpm deploy
```

This runs:

1. `pnpm --filter @theobase/shared build` — compile the shared Drizzle schema and Zod validators
2. `pnpm --filter @theobase/web build` — build the PWA for production
3. `pnpm --filter @theobase/worker deploy` — `wrangler deploy` the Worker

After deployment, wrangler prints the Worker URL (e.g. `https://theobase-worker.YOURSUBDOMAIN.workers.dev`). Note this for the next step.

## 8. Seed Demo Data

The demo seed provisions "Suva Central SDA Church" under Fiji Mission with 120 synthetic members, 6 months of giving records (24 committed weekly batches), 2 active demo batches, and 6 demo user accounts across key roles.

```sh
curl -X POST https://theobase-worker.YOURSUBDOMAIN.workers.dev/church/seed-demo
```

This hits the `POST /church/seed-demo` endpoint on the Worker. Re-running it destroys and recreates the demo DO — no production data is affected.

Demo accounts (all use magic link login):

| Email | Role |
|-------|------|
| `clerk@suva.sda` | Church Clerk |
| `treasurer@suva.sda` | Church Treasurer |
| `counter1@suva.sda` | Counter |
| `counter2@suva.sda` | Counter |
| `pastor@suva.sda` | District Pastor |
| `member@suva.sda` | Member |

## 9. Stripe Checkout

Conference billing uses Stripe Checkout. Set Stripe keys as secrets on the Worker:

```sh
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your Stripe secret key (sk_live_... or sk_test_...)

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste your Stripe webhook signing secret
```

To create a Checkout session for Conference billing:

```sh
curl -X POST https://theobase-worker.YOURSUBDOMAIN.workers.dev/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "conferenceId": "<conference-id>",
    "churchCount": 5,
    "plan": "monthly"
  }'
```

The Worker returns a Stripe Checkout URL. The Conference admin completes payment via that URL. On success, Stripe fires a webhook; the Worker handler activates the subscription.

For local testing against Stripe test mode, use `sk_test_...` keys and Stripe's test card `4242 4242 4242 4242`.

## 10. Monitor

### Worker Logs

View real-time logs in the Cloudflare dashboard (**Workers & Pages > theobase-worker > Logs**) or via wrangler:

```sh
npx wrangler tail
```

Streams live request logs, errors, and console output from the deployed Worker.

### D1 Error Tables

The observability pipeline writes errors to D1 tables. Query them via wrangler:

```sh
npx wrangler d1 execute theobase --remote --command "SELECT * FROM errors ORDER BY created_at DESC LIMIT 20"
npx wrangler d1 execute theobase --remote --command "SELECT * FROM sync_health ORDER BY checked_at DESC LIMIT 10"
```

### Restore Drill

A Worker Cron trigger (`0 0 1 * *` — first day of each month at midnight UTC) runs the restore drill: it picks a random church, replays its event log into a fresh DO, and verifies the state hash matches. A mismatch triggers a P1 alert.

### R2 Error Storage

Raw error payloads are stored in the `theobase-errors` R2 bucket. Browse via the Cloudflare dashboard (**R2 > theobase-errors**).

## 11. Troubleshooting

### Magic link emails not sending

1. Verify Email Routing is enabled on your domain in the Cloudflare dashboard.
2. Check the MX records have propagated: `dig mx theobase.app`. If the domain uses Cloudflare DNS, these are auto-configured.
3. Ensure the `send_email` binding in `wrangler.jsonc` matches the route name in Email Routing (**AUTH_EMAIL**).
4. Check Worker logs for email send errors: `npx wrangler tail`.
5. Magic link tokens expire after 10 minutes and are single-use. Requesting a new link invalidates any previous unclaimed token.

### DO state loss (Church Durable Object not responding)

1. Confirm the D1 migration was applied: `npx wrangler d1 execute theobase --remote --command "SELECT name FROM sqlite_master WHERE type='table'"`. If tables are missing, re-run `pnpm db:migrate`.
2. Check the DO migration tag in `wrangler.jsonc` is correct and that `"new_classes": ["ChurchDO"]` matches the deployed code.
3. Inspect Worker logs for DO errors: `npx wrangler tail`.
4. Verify the `durable_objects.bindings` section in `wrangler.jsonc` matches the exported DO class name (`ChurchDO`).

### CORS errors

1. Verify `APP_URL` in `wrangler.jsonc` matches the deployed frontend URL exactly — protocol (`https://`), domain, and path. No trailing slash.
2. If the frontend is on Cloudflare Pages with a preview deployment (e.g. `<pr>.theobase.pages.dev`), the production APP_URL won't match. Use staging `APP_URL` or add the preview origin to the CORS allow list.
3. Check the Worker is not returning a CORS error response: `npx wrangler tail` and look for rejected origins.

### Queued messages not processing

1. Verify the queue exists: `npx wrangler queues list`.
2. Ensure the queue binding name in `wrangler.jsonc` (**ERROR_QUEUE**) matches the code.
3. Check for queue consumer errors in Worker logs.

### Deployment fails

1. Run `pnpm typecheck` and `pnpm test` locally first. Fix any failures.
2. Verify wrangler is authenticated: `npx wrangler whoami`.
3. Check that the account ID in `wrangler.jsonc` (if set) matches your Cloudflare account.
4. Ensure all bindings (KV, D1, R2, Queue, DO) are provisioned and their IDs are correct in `wrangler.jsonc`.
