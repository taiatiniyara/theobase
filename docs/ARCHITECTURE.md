# ARCHITECTURE

## Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript (strict) | Type safety across full stack |
| Frontend | React 19 (PWA) via Vite | Offline-first Progressive Web App, same stack as Worker |
| Backend | Cloudflare Workers (Hono) | Edge compute, global latency, free-tier viable for churches |
| Database (cloud) | Cloudflare D1 | SQLite-at-edge, zero cold starts, Drizzle-compatible |
| Database (local) | SQLite via WASM | Same engine and schema as D1, full offline capability |
| File storage | Cloudflare R2 | Object storage for attachments, receipts, exports |
| Static hosting | Cloudflare Pages | Co-located with Workers, automatic CI/CD from git |
| ORM | Drizzle ORM | Type-safe, SQLite-native, generates D1 migrations (ADR-0007) |
| UI | Tailwind CSS + Radix UI | Lightweight, accessible primitives, WCAG 2.1 AA target (ADR-0006) |
| Routing | React Router v7 | Standard PWA routing, nested layouts |
| Server state | TanStack Query | API caching, mutation queue for offline retry |
| Auth | Email/password + JWT | Long-lived JWT validated locally when offline (ADR-0003) |

## Deployment Target

- **Compute:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 with row-level multi-tenancy (ADR-0004)
- **Files:** Cloudflare R2 for member documents, receipts, exports
- **Frontend:** Cloudflare Pages, served from the edge
- **Dev:** `wrangler dev` for Worker, Vite dev server for PWA

## Data Store

### Cloud (D1)
- Single D1 database with `organisation_id` on every table for multi-tenancy
- Row-level isolation enforced at the API layer
- Drizzle ORM manages schema migrations

### Local (SQLite WASM)
- Full SQLite engine running in the browser via WebAssembly (ADR-0001)
- Identical schema to D1 — same Drizzle queries run on both sides
- Survives 72+ hours offline with full feature parity

### File Storage (R2)
- Attachments, receipts, exports stored in R2
- Offline: files queued locally in IndexedDB/Cache API, uploaded on sync

### Encryption
- **In transit:** TLS 1.3 on all connections (Cloudflare default)
- **At rest:** D1 and R2 encrypt at rest by default (Cloudflare-managed AES-256)
- **Field-level encryption:** Highly sensitive fields (background-check results, disciplinary records, health information) encrypted before write with application-layer keys. Deferred to P3 per vision doc §4.9.14.

### Backup & Disaster Recovery
- **D1:** Automatic point-in-time recovery via Cloudflare (configurable retention). Export dumps to R2 on schedule.
- **R2:** Versioned objects with lifecycle policies.
- **RTO target:** <4 hours (redeploy Worker + restore D1 from backup)
- **RPO target:** <1 hour (D1 point-in-time recovery)
- **Church-level export:** Portable formats (CSV, JSON, PDF) on demand via API. Never hold data hostage.

## Integration Posture

Theobase is middleware — it feeds institutional systems, it doesn't replace them.

### Upstream (data consumer)
- **ACMS** — Membership events (baptisms, transfers, attendance) flow from Theobase to ACMS as structured data extracts. ACMS is the canonical institutional membership store.
- **SunPlus** — Remittances and aggregated financial reports flow from Theobase to SunPlus. SunPlus is the canonical institutional financial ledger.
- **AdventistGiving** — Complementary. Member-facing online giving stays on AdventistGiving; Theobase handles local church treasury (physical offering counting, receipting).

### Downstream (data provider)
- **Adsafe / ALC** — Linked, not absorbed. Theobase verifies training completion via portal integration but does not re-host their accredited content.
- **WhatsApp** — Bridge during transition. Announcements may be relayed to WhatsApp groups so communication doesn't fragment during migration.

### Import Pipeline (P1)
- Structured templates for spreadsheet and legacy data import
- Field-mapping wizard with validation passes
- Dry-run mode (preview before commit) with rollback capability
- Every imported record tagged with provenance (source, date, operator)

## Auth Model

- **Registration/invite:** Officer receives an invite link, sets password
- **Login:** Email + password → Worker issues JWT (long expiry, e.g. 30 days)
- **Online validation:** Worker verifies JWT signature and expiry
- **Offline validation:** PWA verifies JWT signature and expiry locally
- **Role-based access:** JWT payload includes role claims, scoped to organisation
- **SSO (P2):** OIDC layer on top, still issues JWTs — additive, not breaking
- **Layered access governance:** Data flows upward in governed, auditable increments. A local clerk cannot see the district budget; a union auditor sees aggregated compliance dashboards, not individual member records. Access is scoped by organisation type and role, enforced at the API layer.

### Policy Compliance (ADR-0010)

The policy-compliance engine enforces GC Working Policy rules as configurable system gates. Rules are defined per union/conference and cascade to churches. Evaluated at the API boundary before mutations are committed. Example rules: quorum validation, dual-signature thresholds, audit-committee approval gates. The engine is a configurable rule set, not hardcoded checks.

### Immutable Audit Trail (ADR-0008)

Every significant domain event — membership changes, financial transactions, board motions, incident reports — is stored with an append-only audit trail. Records are never updated in place; corrections are made by superseding events. This is a domain-level constraint, not a technical preference.

## Network Topology

```
┌─────────────────────────────────────────────────────┐
│  Member's device / Officer's tablet                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  PWA (React)                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │ UI Layer │  │ TanStack │  │ SQLite WASM │  │  │
│  │  │ (Radix/  │  │ Query    │  │ (local DB)  │  │  │
│  │  │ Tailwind)│  │ (cache,  │  │             │  │  │
│  │  │          │  │  queue)  │  │             │  │  │
│  │  └──────────┘  └──────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ REST (JSON + JWT)
                        ▼
┌─────────────────────────────────────────────────────┐
│  Cloudflare Edge                                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  Worker (Hono)                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────┐  │  │
│  │  │ Auth MW  │  │ API      │  │ Sync       │  │  │
│  │  │ (JWT)    │  │ Routes   │  │ Endpoints  │  │  │
│  │  └──────────┘  └──────────┘  └────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ D1 (DB)  │  │ R2 (File)│  │ Pages (static)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## API / IPC Contracts

### REST API (ADR-0005)

Base: `https://api.theobase.app/v1`

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/login` | Email/password → JWT |
| POST | `/auth/register` | Create account (invite flow) |
| GET/POST/PUT/DELETE | `/organisations/:id/members` | CRUD members |
| GET/POST/PUT/DELETE | `/organisations/:id/transactions` | CRUD transactions |
| GET/POST/PUT/DELETE | `/organisations/:id/meetings` | CRUD meetings |
| GET/POST | `/organisations/:id/activities` | Log/list activities |
| POST | `/sync/push` | Push local changes → D1 |
| GET | `/sync/pull?since=<timestamp>` | Pull remote changes → local |
| GET | `/sync/conflicts` | List unresolved conflicts |
| POST | `/sync/conflicts/:id/resolve` | Resolve a conflict |

All endpoints except auth require `Authorization: Bearer <JWT>`. All data endpoints are scoped to `organisation_id` from the JWT claims.

### Public API (ADR-0009)

A public-facing REST API for unions, missions, and third-party systems. Uses API-key authentication instead of JWT. Supports webhook subscriptions for event-driven integration. Rate-limited per key with graduated throttling. Separate from the internal API but sharing the same Hono router.

### Sync Protocol

1. **Online detection:** PWA monitors `navigator.onLine` + heartbeat to Worker
2. **Push:** Local changes (inserts, updates, deletes) with timestamps → `/sync/push`. Worker applies with LWW (ADR-0002), queues conflicts.
3. **Pull:** Poll `/sync/pull?since=<last_sync>` → receive remote changes, apply locally
4. **Conflict resolution:** Manual via reconciliation UI → `/sync/conflicts/:id/resolve` (ADR-0002)
5. **Files:** Queued uploads processed after data sync

## Design System & UX Patterns

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Navy `#1a365d` | Buttons, links, header, sidebar, active nav |
| Surface | White `#ffffff` | Card backgrounds, form inputs, content area |
| Accent | Gold `#d4a843` | Highlights, badges, selected states, icons |
| Muted | Slate `#f1f5f9` | Page background, disabled states, dividers |
| Error | Red `#dc2626` | Validation errors, expired clearances, overdue items |
| Success | Green `#16a34a` | Confirmation, synced status, completed items |
| Warning | Amber `#d97706` | Expiring items, conflict badges, pending |
| Font | System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) | All text — zero download, works offline |
| Border radius | `0.375rem` (rounded-md) | Cards, inputs, buttons |
| Spacing scale | Tailwind default (`0.25rem` steps) | Layout, padding, gaps |
| Breakpoints | `sm: 640px`, `md: 768px`, `lg: 1024px` | Responsive layout |
| Icons | Lucide React (tree-shakeable, MIT) | UI icons — check, plus, calendar, users, etc. |

### Layout System

**Hybrid responsive layout** — adapts to device capability:

- **Mobile (< 768px):** Bottom tab bar with 3-5 role-scoped tabs. Tab 1 is always the officer's dashboard. Remaining tabs are role-specific module shortcuts. Single-column content stack.
- **Tablet/Desktop (≥ 768px):** Collapsible sidebar navigation listing all modules available to the officer's role. Main canvas area with multi-column content where appropriate.
- **Role-scoped:** Navigation items are determined by the officer's roles (clerk sees membership; treasurer sees finance; pastor sees oversight).

### Component State Coverage

Every interactive component must handle these states:

| State | Example |
|-------|---------|
| **Loading** | Skeleton/spinner while data fetches |
| **Empty** | "No members yet — add your first member" |
| **Error** | Inline error with retry action |
| **Success** | Confirmation toast/checkmark |
| **Offline** | Indicator + queued mutation badge |
| **Syncing** | Progress indicator on sync operations |
| **Conflict** | Yellow badge + link to reconciliation UI |

### Accessibility Baseline

- **Target:** WCAG 2.1 AA (as set in vision doc §4.9.15, P3)
- **Baseline from day one:** Radix UI provides WAI-ARIA primitives (keyboard nav, focus management, screen-reader labels)
- **Color contrast:** All text/UI elements meet 4.5:1 minimum (AA)
- **Keyboard:** Every workflow reachable without a mouse
- **Screen reader:** All interactive elements have accessible names

### Offline UX Patterns

- **Connectivity indicator:** Persistent badge in header (online/offline/syncing)
- **Queued mutations:** TanStack Query mutation queue with pending count badge
- **Stale data indicator:** "Last synced: 5 minutes ago" timestamp
- **Degraded gracefully:** Features that require connectivity (e.g., sending announcements) show "Offline — will send when connected"

### Role-Anchored UX

Every interface is scoped to a specific officer role — the clerk sees membership workflows, the treasurer sees financial workflows, the pastor sees oversight dashboards. The user sees only what they need, in the language and literacy level they need. Role claims in the JWT drive UI composition, not just API authorization.

### Voice & Tone

The platform speaks with a **warm, pastoral, and humble** voice. It is a tool for ministry, not a corporate dashboard. Principles:

- **You are not alone.** Reference the wider church family: "You and 47 other churches in the [Conference] family." "Your district pastor can see this too."
- **What you do matters.** Give weight to important moments: "This baptism will be in your church's permanent record." "This report will be read by your conference leadership."
- **We trust you.** Never condescend. Never lecture. Officers are doing sacred work — the platform supports, never judges.
- **Joy is appropriate.** Celebrate milestones: first baptism, first report, church anniversaries. Ministry is joyful work.
- **Plain language.** Grade 6 reading level. Short sentences. No jargon the officer doesn't already use.

Every slice's copy must follow this voice. Empty states, error messages, success toasts, tooltips, help content — all consistent.

### Internationalization (i18n)

- **Framework:** Built-in i18n with union-curated translation packs
- **Language preference:** Stored per member profile, applied across all interfaces
- **Low-literacy mode (P2):** Icon-heavy interfaces, voice input, audio prompts, step-by-step wizards
- **Cultural adaptation (P2):** Configurable labels, workflow names, and role titles per union (data model is canonical; surface layer is culturally adapted)

## Operational Infrastructure

### CI/CD (S28)
- GitHub Actions: lint → typecheck → test → deploy on push to main
- Cloudflare Pages: auto-deploy frontend from git
- Cloudflare Workers: deploy via wrangler in CI
- Staging environment: `staging.theobase.app` mirroring production topology
- Canary deployments with automated rollback on error-rate spikes

### Observability (S28)
- Structured JSON logging with correlation IDs across all Workers
- Workers Analytics Engine for metrics (request rate, error rate, latency)
- Proactive alerting: error-rate spikes, sync backlogs, D1 query latency
- Health check endpoint: `GET /health` confirms D1 + R2 connectivity
- Public status page with incident history

### Backup & Disaster Recovery (S28)
- D1: automated point-in-time recovery, scheduled exports to R2
- R2: versioned objects with lifecycle policies
- Backup/restore script: `scripts/backup.sh` + `scripts/restore.sh`
- RTO target: <4 hours. RPO target: <1 hour
- Quarterly restore drill automated in CI

### Performance Budget
- PWA initial load: <3s on 3G, <1s on 4G
- JS bundle: <200KB gzipped (code splitting per route)
- SQLite WASM: ~1MB, loaded async, cached by service worker
- Offline storage quota: monitored, warnings at 80% usage
