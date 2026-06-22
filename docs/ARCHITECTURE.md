# Architecture

> Decisions recorded here carry rationale. See `docs/adr/` for the full
> decision records.

## Stack

| Layer          | Technology                                       | ADR        |
| -------------- | ------------------------------------------------ | ---------- |
| Frontend       | SvelteKit (PWA) → Cloudflare Pages               | 0001, 0006 |
| API            | Hono → Cloudflare Workers                        | 0001, 0003 |
| Database       | Cloudflare D1 (SQLite) + Drizzle ORM             | 0001, 0002 |
| Real-time      | Cloudflare Durable Objects (WebSocket + alarms)  | 0001, 0003 |
| Blob storage   | Cloudflare R2 (receipt images, exports)          | 0001       |
| Inbound email  | Cloudflare Email Routing                         | 0001       |
| Outbound email | Node.js SMTP relay on micro VPS → Hostinger SMTP | 0009       |
| Auth           | Passwordless magic-link + JWT (httpOnly cookie)  | 0005       |
| Testing        | Vitest + Miniflare 3                             | —          |
| Monorepo       | pnpm workspaces (apps/ + packages/)              | —          |

**Rationale (ADR 0001):** The three non-negotiables — offline-first, regional
data isolation, near-zero per-church infrastructure cost — map directly onto
Cloudflare's edge model. Workers sleep when idle, D1 databases can be placed per
world division, and the PWA offline cache + WebSocket DOs deliver offline-first
without native app complexity.

## System Topology

```
┌─────────────────────────────────────────────────┐
│                    Users                          │
│  (mobile/desktop browser, PWA installed)          │
└────────────┬───────────────┬────────────────────┘
             │               │
     HTTPS   │               │  WebSocket (wss)
             ▼               ▼
┌──────────────────┐  ┌──────────────────────────┐
│  Cloudflare      │  │  Cloudflare              │
│  Pages           │  │  Workers                 │
│  (SvelteKit PWA) │  │  (Hono API)              │
│                  │  │  ┌────────────────────┐  │
│  Service Worker  │  │  │  REST endpoints    │  │
│  IndexedDB       │  │  │  (reads, cacheable)│  │
│  outbox queue    │  │  └────────┬───────────┘  │
└──────────────────┘  │           │              │
                      │  ┌────────▼───────────┐  │
                      │  │  Durable Objects    │  │
                      │  │  (1 per congregation│  │
                      │  │   4 WS channels,    │  │
                      │  │   alarms, RPC)      │  │
                      │  └────────────────────┘  │
                      └──────┬───────┬───────────┘
                             │       │
                      ┌──────▼──┐ ┌──▼──────────┐
                      │  D1      │ │  R2         │
                      │ (per     │ │ (receipt    │
                      │ division)│ │  images,    │
                      │          │ │  exports)   │
                      └──────────┘ └─────────────┘

┌─────────────────────────────────────────────────┐
│  Micro VPS (SMTP Relay)                          │
│  ┌──────────────────────────────────────────┐   │
│  │  Node.js relay (Docker)                  │   │
│  │  POST /send  ──►  Hostinger SMTP         │   │
│  │  Cloudflare Tunnel (no open ports)       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Data flow

1. **Read path:** PWA → Service Worker cache (IndexedDB) → if stale, Worker REST
   endpoint → D1. REST responses are cacheable by the SW.
2. **Write path:** PWA → Worker REST endpoint → D1 write → DO stub.call() to
   broadcast change over WebSocket to connected clients. If offline, write goes
   to IndexedDB outbox → flushes on reconnect.
3. **Notification path:** Channel A (WebSocket: instant in-app toasts via DO).
   Channel B (email: POST to SMTP relay → Hostinger SMTP). Every notification
   dispatches on both channels (ADR 0008).
4. **Alarm path:** DO alarm fires → broadcasts WebSocket reminder + (planned)
   dispatches email.

## Multi-Tenancy

One D1 database per SDA world division. Every multi-tenant row carries
`congregation_id`. The auth middleware extracts `congregationId` from the session
JWT and injects it via Hono context. Every query must include `WHERE
congregation_id = ?` — enforced by convention (not yet by query builder
middleware).

**Rationale (ADR 0002):** Per-division databases satisfy regional data
sovereignty (GDPR, LGPD, NDPR, etc.) while enabling cross-congregation features
(District Hub, Conference Report Generator) that per-church databases would make
prohibitively expensive.

## API Contracts

### REST (Hono Worker)

All endpoints are prefixed by role. Responses follow:

```ts
{ data: T } | { error: { code: string, message: string } }
```

Key endpoint families:

- `POST /auth/*` — magic link request, token verification, session refresh
- `GET/POST /members/*` — membership CRUD, self-service profile
- `GET/POST /receipts/*` — receipt submission, verification queue
- `GET/POST /board/*` — meetings, agendas, minutes, decisions
- `GET/POST /rota/*` — duty slots, assignments, swaps
- `GET/POST /treasury/*` — fund balances, expense tracking
- `GET/POST /pathfinders/*`, `/sabbath-school/*`, `/welfare/*`, `/health/*` — department tools
- `GET/POST /communion/*`, `/av/*` — sabbath operations
- `GET/POST /district/*`, `/conference/*` — district/conference coordination
- `GET/POST /nominating/*`, `/transfers/*`, `/facilities/*`, `/crisis/*` — governance + safety

### Durable Object RPC

One DO per congregation. 4 multiplexed WebSocket channels:

| Channel         | Purpose                              |
| --------------- | ------------------------------------ |
| `board`         | Real-time board minute collaboration |
| `rota`          | Duty slot assignment broadcasts      |
| `av`            | Pulpit-to-AV slide sync              |
| `notifications` | In-app toast dispatch                |

RPC methods (10 total): `onBoardUpdate`, `onRotaChange`, `onAVUpdate`,
`sendNotification`, `subscribeChannel`, `unsubscribeChannel`, plus alarm
scheduling and state hydration.

### SMTP Relay (outbound email)

`POST https://relay.theobase.net/send` with JSON body:

```json
{
  "to": "clerk@church.org",
  "subject": "Magic link for Theobase",
  "html": "<a href=\"...\">Sign in</a>"
}
```

Authenticated via pre-shared token in `Authorization` header. Relay unwraps and
forwards to Hostinger SMTP (`messenger@theobase.net`). Stateless — no queuing,
no retry logic in the relay itself.

## Data Model

### Congregation type discriminator (ADR 0004)

Single `congregation` table with `type` column (`'church' | 'company' | 'branch'`)
and self-referencing `parent_id`. Separate tables rejected because Branch →
Company → Church status changes would require data migration; the three types
share identical feature schemas (members, leaders, departments, finances).

### CRDT strategy for offline writes (ADR 0007)

| Data type                                            | Strategy                  | Rationale                              |
| ---------------------------------------------------- | ------------------------- | -------------------------------------- |
| Scalar fields (phone, uniform size, inventory count) | Last-writer-wins register | No semantic merge needed               |
| Duty rota slot assignments                           | Observed-Remove Set       | Prevents double-assignment             |
| Board minutes                                        | Revision-based merge      | Preserves edit history, surfaces forks |

Implemented in `packages/shared/src/crdt.ts` (LWW, OR-Set).

## Auth Model

1. User enters email → `POST /auth/request` → magic link sent via email relay
2. User clicks link → `GET /auth/verify?token=<jwt>` → httpOnly session cookie set
3. Cookie carries JWT with: `{ sub: userId, congregationId, role }`
4. Hono middleware extracts congregation ID, injects into context
5. 2FA escalation (second email code) planned for treasurer/clerk/nominating roles

## Delivery Model

PWA-only (ADR 0006). No iOS/Android app stores. Users visit URL → add to home
screen. Service Worker caches app shell + data in IndexedDB. Updates deploy
silently. Notifications via WebSocket (in-app) + email (guaranteed delivery).

## Deployment

| Component     | Target                                     | CI/CD                                     |
| ------------- | ------------------------------------------ | ----------------------------------------- |
| PWA           | Cloudflare Pages (`theobase.app`)          | GitHub Actions `deploy.yml`               |
| API Worker    | Cloudflare Workers (`api.theobase.net`)    | GitHub Actions `deploy.yml`               |
| SMTP Relay    | Docker on micro VPS (`relay.theobase.net`) | GitHub Actions `deploy-relay`             |
| D1 Migrations | Per-division D1 bindings                   | Manual via `wrangler d1 migrations apply` |

The relay VPS is exposed via Cloudflare Tunnel — no open ports, authenticated
with pre-shared token.

## Out of Scope

- Payment processing (Theobase records intent, doesn't move money)
- Native iOS/Android apps (PWA-only)
- Real-time video/audio streaming
- SMS/WhatsApp notifications (email only)
- Third-party church software migration (CSV import only)
- Full double-entry accounting (fund-balance dashboard, not general ledger)
- ADRA integration (local crisis registry, not connected to ADRA systems)
