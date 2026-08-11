# Theobase

**The operating system for Seventh-day Adventist churches.** An offline-first church management platform — membership, giving, reports — built for SDA polity. From the counting room to the conference.

[![CI](https://github.com/taiatiniyara/theobase/actions/workflows/ci.yml/badge.svg)](https://github.com/taiatiniyara/theobase/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

## What it does

Theobase handles the paperwork so church officers can focus on people:

- **Church Clerk** — membership lifecycle, transfers, the annual statistical report fills itself out
- **Counting Room** — dual-signoff enforced by software: two counters independently confirm each batch
- **Treasurer** — tithe remittance auto-computed from live giving records, one-tap approval
- **Everyone** — works entirely offline, syncs when you reconnect

Built for the way SDA churches actually work. Fourteen role types. No IT department needed. Data export anytime.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────┐
│  PWA (React) │────▶│  Worker + DO     │────▶│  D1 / R2 │
│  offline-1st │◀────│  (per church)    │◀────│  reports │
└──────────────┘     └──────────────────┘     └──────────┘
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + TanStack Router/Query/Table
- **Backend**: Cloudflare Worker + Durable Objects (one per church)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM
- **Auth**: Passwordless magic link via email (JWT, RS256)
- **Sync**: DO-as-authority, write-ahead log, offline IndexedDB queue

See [CONTEXT.md](CONTEXT.md) for the full domain model, architecture constraints, and design principles.

## Getting started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- A Cloudflare account

### Setup

```bash
# Clone
git clone https://github.com/taiatiniyara/theobase.git
cd theobase

# Install dependencies
pnpm install

# Start dev servers
pnpm dev          # PWA at localhost:5173
pnpm dev:worker   # Worker at localhost:8787

# Run tests
pnpm test
pnpm --filter @theobase/web test:e2e
```

### Deploy

See [docs/deployment.md](docs/deployment.md) for full deployment instructions.

## Directory structure

```
theobase/
├── packages/
│   ├── web/          # React PWA frontend
│   ├── worker/       # Cloudflare Worker + Durable Objects
│   ├── shared/       # Drizzle schema, Zod validators, types
│   └── observability/ # Error reporting pipeline
├── docs/
│   ├── adr/          # Architecture Decision Records
│   ├── design-system.md
│   └── deployment.md
├── branding/         # Logo assets
├── CONTEXT.md        # Domain model and architecture
└── package.json
```

## License

Theobase is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](LICENSE) for the full text.

The AGPL requires that modified versions of the software, when used to provide a service over a network, make the complete source code available to users of that service. This ensures the community benefits from improvements, even when the software is deployed as a hosted service rather than distributed as an application.

## Community

- [Contributing guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)

---

Built by [Tiniyara](https://github.com/taiatiniyara) for the global SDA Church. Starting with the Pacific, expanding conference by conference.
