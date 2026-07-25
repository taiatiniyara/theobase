# Theobase

Seventh-day Adventist church administration platform — from Conference down to Member, with read-only aggregated reporting up to General Conference level.

Modular by design: Finance, Membership, Organization Structure, Auth/Roles, and Audit/Reports.

## Quick start

```bash
npm install
cp .dev.vars.example .dev.vars   # or create with JWT_SECRET and ALLOWED_ORIGINS
npm run dev                        # starts Worker + Vite dev server
```

- **Worker**: `http://localhost:8787`
- **Frontend**: `http://localhost:5173`

## Documentation

- [Domain glossary](CONTEXT.md) — SDA church administration vocabulary
- [Architecture decisions](docs/adr/) — append-only finance, per-conference D1 tenancy, offline-first PWA
- [Deployment guide](docs/deployment.md) — production deployment to Cloudflare Workers
- [Agent skills](docs/agents/) — triage, issue tracker, domain doc conventions

## Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start Worker + Vite dev server |
| `npm test`          | Run test suite (vitest)        |
| `npm run typecheck` | TypeScript check               |
| `npm run lint`      | ESLint                         |
| `npm run format`    | Prettier                       |

## Stack

- **Runtime**: Cloudflare Workers (Hono)
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **State**: Durable Objects (ChurchSyncDO, ConferenceDO)
- **Frontend**: React 19 + TanStack Router/Query + Tailwind CSS v4
- **Offline**: Dexie.js (IndexedDB) with sync queue
- **Email**: Cloudflare Email binding
- **Auth**: JWT (jose) with access/refresh tokens
