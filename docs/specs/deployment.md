# Deployment

## Environments

- production — `theobase.app`
- staging — `staging.theobase.app`
- local — `wrangler dev`

## CI

GitHub Actions: lint + typecheck + unit + DO-interface + e2e on PR; deploy on merge (staging → production promotion).

## Stack (ADR-0018, ADR-0022)

Cloudflare Workers + Durable Objects + D1 + R2 + Queues + Email Routing + Email Sending + Pages. Application stack: React 18 + Vite + Tailwind + Zustand + XState + Dexie + i18next + Biome. pnpm-workspaces monorepo: `packages/shared`, `packages/worker`, `packages/web`.
