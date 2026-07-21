# Architecture

## Stack

| Layer          | Choice                                             | Rationale                                                                                                                                                                          |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**    | Cloudflare Workers                                 | Edge-native, serverless, zero-ops. Single Worker handles all API routes.                                                                                                           |
| **Database**   | Cloudflare D1 (SQLite)                             | Row-level tenancy sufficient for church-scale data (kilobytes per church, not gigabytes). No separate databases — single D1 with `orgId` on every table.                           |
| **API**        | REST + JSON                                        | Resources map to domain entities (`/churches/{id}/members`, `/conferences/{id}/stats/membership`). Worker enforces auth and tenant scoping at route level.                         |
| **Auth**       | JWT (email + password)                             | Worker-issued JWTs carry `orgId`, `orgLevel`, `role`. No third-party auth dependency. Password reset via email link (Cloudflare Email Routing).                                    |
| **Client**     | React + Vite + TanStack                            | TanStack Query for online-first data fetching/caching. TanStack Table for membership rolls, financial reports. TanStack Router for type-safe navigation. Tailwind CSS for styling. |
| **Offline**    | PWA (Service Worker + IndexedDB)                   | Online-first: reads cached, writes queued when offline, synced on connectivity return. Last-write-wins conflict resolution with audit log.                                         |
| **Deployment** | Static assets on Cloudflare Pages + Worker for API | Pages for the PWA (with `_worker.js` or separate Worker). D1 bound to Worker.                                                                                                      |
| **Testing**    | Vitest + @cloudflare/vitest-pool-workers           | Isolated D1 environment for integration tests. Contract tests on API routes.                                                                                                       |
| **CI**         | GitHub Actions                                     | Run lint, typecheck, test on every push. Block merge on failure.                                                                                                                   |

## System Topology

```
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Pages                                           │
│  ┌─────────────────────────────────┐                        │
│  │  PWA Client (React + TanStack)  │                        │
│  │  - Service Worker (cache/sync)  │                        │
│  │  - IndexedDB (offline queue)    │                        │
│  └──────────────┬──────────────────┘                        │
│                 │ HTTPS (REST + JSON)                       │
│                 ▼                                            │
│  ┌─────────────────────────────────┐                        │
│  │  Worker (API)                   │                        │
│  │  - Auth middleware (JWT)        │                        │
│  │  - Tenant scoping (orgId)      │                        │
│  │  - Route: /api/v1/*            │                        │
│  └──────────────┬──────────────────┘                        │
│                 │ D1 binding                                 │
│                 ▼                                            │
│  ┌─────────────────────────────────┐                        │
│  │  D1 (SQLite)                    │                        │
│  │  - All tables with orgId col   │                        │
│  │  - Migrations via Wrangler      │                        │
│  └─────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Auth Model

- Registration: system admin provisions users per org unit. Member self-registration via invite link (optional for V1).
- Login: email + password → Worker returns JWT (access token, short-lived). Refresh via long-lived refresh token stored in D1.
- JWT payload: `{ sub: userId, orgId, orgLevel, role }`.
- Every API request includes `Authorization: Bearer <token>`. Middleware validates and attaches `ctx.user` to the request context.
- Password reset: user requests reset → Worker emails link via Cloudflare Email Routing → link contains short-lived reset token → user sets new password.

## Data Tenancy

Row-level tenancy. Every domain table has an `orgId` column referencing the org hierarchy.

Query scoping rules:

- A user at **orgLevel = church** can read/write rows where `orgId = theirOrgId`.
- A user at **orgLevel = conference** can read rows where `orgId IN (SELECT id FROM orgs WHERE parentId = conferenceId OR parentId IN (SELECT id FROM orgs WHERE parentId = conferenceId))` — i.e., their Conference + all Churches/Companies in it.
- Write access at conference level is scoped to conference-owned entities (policies, org config), not individual church records (except transfer approval).

## API Contracts

All routes prefixed with `/api/v1`.

### Membership

```
GET    /api/v1/churches/:churchId/members          — list members
POST   /api/v1/churches/:churchId/members           — add member (baptism, transfer-in)
GET    /api/v1/churches/:churchId/members/:id       — get member detail
PATCH  /api/v1/churches/:churchId/members/:id       — update member
POST   /api/v1/churches/:churchId/members/:id/transfer — request transfer
POST   /api/v1/churches/:churchId/members/:id/remove   — remove (apostasy, missing, renounced, deceased)
```

### Financial

```
GET    /api/v1/churches/:churchId/transactions       — list transactions (paginated)
POST   /api/v1/churches/:churchId/transactions       — create receipt or disbursement
GET    /api/v1/churches/:churchId/transactions/:id   — get transaction detail
PATCH  /api/v1/churches/:churchId/transactions/:id/verify — treasurer verification
GET    /api/v1/churches/:churchId/contributions      — list donor statements
POST   /api/v1/churches/:churchId/contributions/generate — generate batch annual statements
```

### Attendance

```
POST   /api/v1/churches/:churchId/attendance         — record attendance (weekly)
GET    /api/v1/churches/:churchId/attendance          — list attendance records
```

### Reports

```
GET    /api/v1/conferences/:confId/stats/membership   — aggregated membership stats
GET    /api/v1/conferences/:confId/stats/finance      — aggregated financial stats
GET    /api/v1/conferences/:confId/stats/attendance   — aggregated attendance
GET    /api/v1/unions/:unionId/stats/*                 — union-level aggregates
GET    /api/v1/divisions/:divId/stats/*                — division-level aggregates
```

### Auth

```
POST   /api/v1/auth/register          — register user (admin only)
POST   /api/v1/auth/login             — login, returns JWT
POST   /api/v1/auth/refresh           — refresh access token
POST   /api/v1/auth/reset-password    — request password reset
POST   /api/v1/auth/reset-password/:token — execute reset
```

### Org

```
GET    /api/v1/orgs                    — list org units (scoped to user)
POST   /api/v1/orgs                    — create org unit (admin)
GET    /api/v1/orgs/:id                — get org detail
PATCH  /api/v1/orgs/:id                — update org unit
```

## D1 Schema (core tables)

These are the foundational tables; full schema evolves during implementation.

```sql
CREATE TABLE orgs (
  id TEXT PRIMARY KEY,
  parentId TEXT REFERENCES orgs(id),
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('division','union','conference','church','company')),
  districtId TEXT REFERENCES districts(id)
);

CREATE TABLE districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conferenceId TEXT NOT NULL REFERENCES orgs(id)
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active','under-censure','transferred-out',
    'transferred-in','disfellowshipped','apostasy','missing','renounced','deceased')),
  baptismDate TEXT,
  transferRequestId TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  memberId TEXT REFERENCES members(id)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  fund TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('receipt','disbursement')),
  donorId TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verifiedBy TEXT REFERENCES users(id),
  createdBy TEXT NOT NULL REFERENCES users(id),
  proxyFor TEXT REFERENCES members(id),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  orgId TEXT NOT NULL REFERENCES orgs(id),
  date TEXT NOT NULL,
  count INTEGER NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('sabbath-school','church-service','youth')),
  createdBy TEXT NOT NULL REFERENCES users(id)
);
```
