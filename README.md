# Theobase

See `CONTEXT.md` for product context. This is an npm-workspaces monorepo:

- `apps/web` — the PWA (Vite + React + TypeScript), deployed to Cloudflare Pages
- `apps/api` — the API (Hono on Cloudflare Workers), with D1 (structured data) and R2 (blobs)

## Setup

```
npm install
```

## Develop

Run both in separate terminals:

```
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:5173
```

`apps/web` reads `VITE_API_URL` (see `apps/web/.env.example`) to reach the API; it defaults to `http://localhost:8787`.

## Before first deploy

`apps/api/wrangler.jsonc` has a placeholder D1 `database_id`. Create the real Cloudflare resources and fill it in:

```
cd apps/api
npx wrangler d1 create theobase-db
npx wrangler r2 bucket create theobase-storage
```

## Checks

```
npm run lint
npm run typecheck
npm run build
```
