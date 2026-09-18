```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## Database (Drizzle + D1)

Schema lives in `src/db/schema.ts`. After changing it:

```txt
npm run db:generate       # writes a new SQL file into migrations/
npm run db:migrate:local  # applies pending migrations to the local D1 (used by `wrangler dev`)
```

Apply to the real (remote) database with `wrangler d1 migrations apply theobase-db --remote` once it exists (see the root README).

## Tests

```txt
npm test
```

Runs against a real D1 instance inside the Workers runtime (`@cloudflare/vitest-pool-workers`), with migrations applied automatically before each test file (`test/apply-migrations.ts`).

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
