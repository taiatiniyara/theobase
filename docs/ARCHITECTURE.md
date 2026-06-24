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
| Outbound email | @taiatiniyara/smtp-relay-client → Hostinger SMTP | 0009       |
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
│  SMTP Relay Server                               │
│  ┌──────────────────────────────────────────┐   │
│  │  @taiatiniyara/smtp-relay               │   │
│  │  (stateless, credential-free)            │   │
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
   Channel B (email: SmtpRelayClient.send() → SMTP relay → Hostinger SMTP). Every notification
   dispatches on both channels (ADR 0008).
4. **Alarm path:** DO alarm fires → broadcasts WebSocket reminder + dispatches email
   via SMTP relay.

## Multi-Tenancy

One D1 database per SDA world division. Every multi-tenant row carries
`congregation_id`. The auth middleware extracts `congregationId` from the session
JWT and injects it via Hono context. Every read and write query includes
`WHERE congregation_id = ?` — enforced in each route handler.

**Rationale (ADR 0002):** Per-division databases satisfy regional data
sovereignty (GDPR, LGPD, NDPR, etc.) while enabling cross-congregation features
(District Hub, Conference Report Generator) that per-church databases would make
prohibitively expensive.

## Middleware Stack

Every request passes through, in order:

| Middleware             | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `securityHeaders()`    | HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy        |
| `correlationId()`      | Injects `x-correlation-id` header and structured JSON log per request |
| `corsMiddleware`       | Handles OPTIONS preflight, sets Access-Control-Allow-Origin           |
| `rateLimiter(100, 60)` | Global rate limit: 100 requests per 60 seconds per IP+path            |
| `csrfProtection()`     | Blocks non-JSON POST/PATCH/DELETE outside auth/health paths           |
| `policyGuardian()`     | Enforces Church Manual compliance rules                               |
| `requireAuth()`        | JWT validation via httpOnly cookie (per-route, not global)            |
| `loadRoles()`          | Resolves user roles from D1 (per-route)                               |

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

RPC methods exposed by the DO:
`meetingUpdated`, `decisionRecorded`, `rotaUpdated`, `slotAssigned`,
`slotSwapRequested`, `orderUpdated`, `slideChanged`, `notifyUser`,
`notifyCongregation`, `connectedCount`. Each broadcasts an event on the
appropriate channel to all connected clients.

### SMTP Relay (outbound email)

`POST https://relay.example.com` with JSON body (via `@taiatiniyara/smtp-relay-client`):

```ts
await relay.send(
  { host, port, secure, auth: { user, pass } }, // SMTP config (sent per-request)
  { from, to, subject, html } // email payload
);
```

Authenticated via shared PIN in request body. Relay forwards to configured SMTP
server (e.g. Hostinger). SMTP credentials are stored as Cloudflare Worker secrets
and passed through — the relay itself is credential-free.

## Data Model

### Congregation type discriminator (ADR 0004)

Single `congregation` table with `type` column (`'local_church' | 'company' | 'branch'`)
and self-referencing `parent_id`. Separate tables rejected because Branch →
Company → Local Church status changes would require data migration; the three types
share identical feature schemas (members, leaders, departments, finances).

### CRDT strategy for offline writes (ADR 0007)

| Data type                                            | Strategy                  | Rationale                              |
| ---------------------------------------------------- | ------------------------- | -------------------------------------- |
| Scalar fields (phone, uniform size, inventory count) | Last-writer-wins register | No semantic merge needed               |
| Duty rota slot assignments                           | Direct D1 insert          | Single-coordinator model               |
| Board minutes                                        | Revision-based merge      | Preserves edit history, surfaces forks |

`detectRevisionFork` in `packages/shared/src/crdt.ts` is the primary CRDT
primitive in use, handling concurrent board minute edits.

## Auth Model

1. User enters email → `POST /auth/request` → magic link sent via email relay
2. User clicks link → `GET /auth/verify?token=<jwt>` → httpOnly session cookie set
3. Cookie carries JWT with: `{ sub: userId, congregationId, role }`
4. Hono middleware extracts congregation ID, injects into context
5. 2FA escalation (second email code) implemented for clerk, treasurer, and nominating committee roles

## Delivery Model

PWA-only (ADR 0006). No iOS/Android app stores. Users visit URL → add to home
screen. Service Worker caches app shell + data in IndexedDB. Updates deploy
silently. Notifications via WebSocket (in-app) + email (guaranteed delivery).

## Deployment

| Component     | Target                                  | CI/CD                                     |
| ------------- | --------------------------------------- | ----------------------------------------- |
| PWA           | Cloudflare Pages (`theobase.app`)       | GitHub Actions `deploy.yml`               |
| API Worker    | Cloudflare Workers (`api.theobase.net`) | GitHub Actions `deploy.yml`               |
| SMTP Relay    | `@taiatiniyara/smtp-relay`              | 0009                                      |
| D1 Migrations | Per-division D1 bindings                | Manual via `wrangler d1 migrations apply` |

The relay VPS is exposed via Cloudflare Tunnel — no open ports, authenticated
with pre-shared token.

## Observability

- **Health check:** `GET /health` on the API Worker verifies D1 connectivity,
  returning `{ ok: boolean, status: "healthy" | "degraded", db: "connected" | "disconnected", timestamp }`.
  The SMTP relay exposes `GET /health` returning `{ status: "ok" }`.
- **Structured logging:** The `correlationId()` middleware emits a JSON log line
  per request: `{ correlation_id, method, path, status, duration_ms, timestamp }`.
- **Error tracking:** Cloudflare Observability enabled on both Workers
  (`apps/api/wrangler.jsonc` and `apps/do/wrangler.jsonc`).
- **Backup:** Daily D1 backup via GitHub Actions (`backup.yml`) with 90-day
  artifact retention. Cloudflare-managed backups also active.

## Out of Scope

- Payment processing (Theobase records intent, doesn't move money)
- Native iOS/Android apps (PWA-only)
- Real-time video/audio streaming
- SMS/WhatsApp notifications (email only)
- Third-party church software migration (CSV import only)
- Full double-entry accounting (fund-balance dashboard, not general ledger)
- ADRA integration (local crisis registry, not connected to ADRA systems)
