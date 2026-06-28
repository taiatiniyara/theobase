# Theobase

A platform for local Seventh-day Adventist churches and companies to run daily operations — membership, finances, governance, ministry, safety, communication, and reporting — replacing paper, spreadsheets, and WhatsApp with a single tool designed for each officer role.

## Stack

React 19 (PWA) + Cloudflare Workers (Hono) + D1 (SQLite) + R2 + TypeScript. Drizzle ORM. Tailwind CSS + Radix UI. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

| File | Purpose |
|------|---------|
| [CONTEXT.md](CONTEXT.md) | Domain glossary (28 terms) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, topology, API, design system |
| [docs/ISSUES.md](docs/ISSUES.md) | Backlog dependency graph (36 issues) |
| [docs/SESSION.md](docs/SESSION.md) | Phase tracker |
| [docs/adr/](docs/adr/) | Architectural decision records (10) |
| [docs/theobase.md](docs/theobase.md) | Vision and gap catalog reference |
| [docs/theobase-vision.md](docs/theobase-vision.md) | Vision narrative |
| [docs/revenue-model.md](docs/revenue-model.md) | Pricing and subscription |
| [docs/distribution-engine.md](docs/distribution-engine.md) | Growth and adoption strategy |

## Quick Start

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8787

## Quality

```bash
npm run typecheck   # TypeScript strict
npm run lint        # ESLint
npm run format      # Prettier
npm run test        # Test suite
```
