# Theobase

A global church utility platform for local Seventh-day Adventist congregations — a digital filing cabinet that automates weekly operations without acting as a bank or payment system.

## Stack

| Layer     | Technology                                |
| --------- | ----------------------------------------- |
| Frontend  | SvelteKit (PWA) → Cloudflare Pages        |
| Backend   | Hono → Cloudflare Workers                 |
| Database  | Cloudflare D1 (SQLite) + Drizzle ORM      |
| Real-time | Cloudflare Durable Objects (WebSocket)    |
| Storage   | Cloudflare R2                             |
| Email     | Node.js SMTP relay (VPS) → Hostinger SMTP |
| Tests     | Vitest + Miniflare 3                      |

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
pnpm test                                      # 59 tests, 8 files (API + shared)
pnpm test:do                                   # 10 tests, 3 files (Durable Object)
```

### Code Quality

```bash
pnpm typecheck    # tsc --noEmit (0 errors)
pnpm lint         # ESLint (0 errors, 0 warnings)
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
  api/      Hono Worker — 60+ REST endpoints across 24 route modules
  do/       CongregationDO — 10 RPC methods, 4-channel multiplexing, alarms
  web/      SvelteKit PWA — 26 pages, offline-first (IndexedDB + outbox)
  relay/    SMTP relay (Node.js, deploys to VPS)
packages/
  auth/     JWT + magic link + RLS middleware
  db/       44 Drizzle tables, migration runner
  email/    Email sender (relay transport)
  shared/   Zod schemas, revision fork detection, sabbath timing, crypto
docs/
  SESSION.md      Phase tracker (Platform Lifecycle Orchestrator)
  ARCHITECTURE.md  Stack & topology decisions
  DEPLOYMENT.md    Deployment guide
  ISSUES.md        Backlog dependency graph
  PROPOSAL.md      Platform proposal (24 use cases)
  PRD.md           Product requirements (30 user stories)
  CONTEXT.md       Domain glossary (47 terms)
  SECRETS.md       Required secrets & env vars
  ENV.md           Environment variable reference
  adr/             Architecture decisions (9 ADRs)
  issues/          23 tracer-bullet issues
```

## Domains

| URL                  | Routes to                              |
| -------------------- | -------------------------------------- |
| `theobase.app`       | PWA (Cloudflare Pages)                 |
| `api.theobase.net`   | API (Cloudflare Workers)               |
| `relay.theobase.net` | SMTP relay (VPS via Cloudflare Tunnel) |
