# Theobase

A global church utility platform for local Seventh-day Adventist congregations — a digital filing cabinet that automates weekly operations without acting as a bank or payment system.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | SvelteKit (PWA) → Cloudflare Pages |
| Backend | Hono → Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Real-time | Cloudflare Durable Objects (WebSocket) |
| Storage | Cloudflare R2 |
| Email | Node.js SMTP relay (VPS) → Hostinger SMTP |
| Tests | Vitest + Miniflare 3 |

## Getting Started

```bash
pnpm install
```

### Local Development

```bash
# Start API Worker + D1 (Miniflare)
cd apps/api && npx wrangler dev

# Start PWA
cd apps/web && npx vite dev

# Run D1 migration locally
npx wrangler d1 migrations apply theobase-spd --config apps/api/wrangler.jsonc
```

### Run Tests

```bash
npx vitest run                                  # All tests
npx vitest run --config packages/shared/vitest.config.ts  # CRDT + timing
```

### Deploy

```bash
# API
npx wrangler deploy --config apps/api/wrangler.jsonc

# PWA
cd apps/web && npx vite build
npx wrangler pages deploy apps/web/.svelte-kit/cloudflare --project-name theobase-web
```

## Project Structure

```
apps/
  api/      Hono Worker — 40+ REST endpoints
  do/       CongregationDO (Durable Object stub)
  web/      SvelteKit PWA
  relay/    SMTP relay (Node.js, deploys to VPS)
packages/
  auth/     JWT + magic link + middleware
  db/       39 Drizzle tables
  email/    Email sender (relay transport)
  shared/   Zod schemas, CRDTs, sabbath timing
docs/
  PROPOSAL.md     Platform proposal (24 use cases)
  PRD.md          Product requirements
  CONTEXT.md      Domain glossary (47 terms)
  adr/            Architecture decisions (9 ADRs)
  issues/         23 tracer-bullet issues
```

## Domains

| URL | Routes to |
|-----|-----------|
| `theobase.app` | PWA (Cloudflare Pages) |
| `api.theobase.net` | API (Cloudflare Workers) |
| `relay.theobase.net` | SMTP relay (VPS via Cloudflare Tunnel) |
