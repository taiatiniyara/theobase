# ADR-0018: SDA Organization Hierarchy — orgUnit Tree

## Status

Accepted (2026-08-13)

## Context

Theobase's organization data is two levels: a bare `conference` table and a `church` table with `conferenceId`. The flat `conference` row is a placeholder — it has no territory, no kind, no parent — and nothing exists above or below it. The SDA hierarchy the platform serves is five structural levels (General Conference → Division → Union → Conference/Mission/Field → Local Church) with real-world irregularities: attached fields and missions that skip a level, companies/groups below churches, and institutions (schools, hospitals, publishing houses, ADRA) affiliated inside the tree. Terminology (Conference vs Mission vs Field, Union Conference vs Union Mission) is a status distinction, not a structural one. The current data model cannot represent any of this, and it also cannot represent conference roles truthfully — `role_assignment` requires a `churchId`, so conference officers are fake-attached to a single church and conference roles act *inside* a church's Durable Object.

This ADR supersedes the flat `conference` model and rebuilds organization data as a single recursive unit tree.

## Decision

### 1. Generic recursive `orgUnit` tree

One table, `orgUnit`, represents every organizational entity: GC, Division, Union, Conference, Mission, Field, attached units, District, Church, Company, Group, and Institution. `parentId` is recursive; `level` and `kind` are data, not structure. The church remains a concrete tenant extension (see 8).

- `level`: `gc | division | union | conference | district | church | company | institution`
- `kind`: naming/Yearbook status — `conference | mission | field | attached-field | union-conference | union-mission | attached-mission | company | group | church | institution`. Terminology is data; the hierarchy never branches on it.
- `status`: `organized | constituted | attached | inactive`
- `parentId` is **mutable and not part of identity** — attached units simply point one level higher.

### 2. Capabilities as `facets`

A unit carries a `facets` set declaring its capacities: `tenant | subscribable | aggregator | non-entity | institution`. Validity rules (which `level` permits which `facet`, which `facet` implies what) live in shared Zod, the same layer the DO cannot bypass.

- `aggregator` — has roll-up views over descendants (GC, Division, Union, Conference, District).
- `subscribable` — can be a billing customer; metering walks descendant `level='church'` units.
- `tenant` — has a Durable Object and billing (churches only).
- `non-entity` — aggregates and targets grants but is disposable: no Yearbook/statistics presence, freely deletable, children re-parent to the conference. Used for Districts.
- `institution` — inert; Yearbook/affiliation entry only, never a write path.

### 3. Districts are units, not a separate concept

A District is an `orgUnit` at `level='district'`, flagged `non-entity`. District scope gives one pastor one grant covering all churches below it, and the aggregation is simply "descendants of unit X" — the same mechanism every conference view uses. No second grouping structure exists.

### 4. Same-row promotion; merge/split out of scope

Identity is stable across every transition:

- Mission → Conference, Union-Mission → Union-Conference, attached-field → Conference: the **same row** mutates `kind` (`status`), keeps its id; `parentId` walks if the unit is re-homed.
- Company → Church: the same row changes `level`, re-parents under the conference, gains a `church` extension, and a Durable Object is provisioned. Companies are structural-only (Pen. 9), so there is no roll to migrate on promotion.

Mergers and splits (churches merging, conferences dividing) are **out of scope** — no `superseded-by`/`absorbed-from` provenance links yet. Add when a real customer reports one.

### 5. Operator-authored hierarchy; clean slate

- The **operator is the Super Admin**: `user.isSuperAdmin` flag, *not* a grant row. The operator belongs to no church and no org unit; the whole tree is theirs to author and inspect. No context-switching, no grant, no expiration.
- **No shipped reference data.** The GC/division spine is created by the operator, not seeded. No canonical seed. **Status note:** `org-seed.ts` (`POST /op/seed`) currently ships an idempotent Fiji reference spine (GC → SPD → TPUM → Fiji Mission → Suva Central) as a dev/operator bootstrap convenience. Whether that stays as the operator's bootstrap tool or is removed when the tree-UI ships is open — it is keyed off `SEED_TOKEN`, not shipped as canonical data.
- **No demo seed.** `pnpm seed:demo`, the demo church, and the demo onboarding tour are removed (supersedes ADR-0013). A fresh install is an empty tree and one super admin user. **Status note:** this removal is *not yet complete* — `packages/worker/src/demo-seed.ts` and `POST /church/seed-demo` still ship (the restore drill depends on the seeded demo church), and `seed:demo` is a placeholder script. Removing the demo seed is outstanding work that ADR-0013's remaining references must be reconciled against when it lands.
- Two authoring tools, both shipped now: a checked-in bootstrap script for the static spine, and an operator admin tree-UI for creating and maintaining units.
- The operator **onboards conferences and their users** (creates the conference/union/division units and grants their officers).
- **Churches self-register** against an operator-created conference. A territory's first church exists only once someone registers it — acceptable, there is no data to migrate.

### 6. Upper units are D1 read-side aggregation

Only churches are Durable Objects. Divisions, Unions, Conferences, Districts never write church data; they read aggregated views from D1. No store above the church becomes a write path (supersedes the current shape where a conference-secretary role mutates state inside a church DO).

### 7. Grants replace the flat role assignment

`roleGrant(userId, unitId, role, expiresAt?)` replaces `role_assignment`:

- One user holds many grants; one grant per (user, unit).
- A **level-validity map** in shared code constrains role to level: church-family (`clerk`, `treasurer`, `counter`, `department-head`, `board-member`, `member`, `interest`, `visitor`) ⇒ `church`; `pastor` ⇒ `church | district`; conference-family (`conference-treasurer`, `conference-secretary`, `conference-president`) ⇒ `conference | union | division`; `auditor` ⇒ any unit, with `expiresAt` scoping. Flat role names are kept.
- `operator` is removed from the grantable role set — super admin is the flag, not a role (Pen. 5).
- **One active grant per session.** The JWT carries the active grant (`unitId` + `role`) plus the user's grants-version. Context-switch re-tokens with the new grant. `tokenVersion` bumps on any grant change, revoking all sessions — the existing invalidation machinery is unchanged.

### 8. Church extension

`church` becomes an extension table keyed by `orgUnit.id` (same row id), not an independent entity: DO binding, activation status, address. `church.conferenceId` is replaced by walking `orgUnit.parentId`. Billing attaches to the nearest `subscribable` ancestor; grace is evaluated at that ancestor in the auth/DO layer so a church is not locked out mid-counting-room.

### 9. Companies and institutions are structural

Companies/groups carry **no membership roll and no finance** — they exist in the tree for directory and roll-up; their members sit on the parent church's roll. A nullable `rollOwningUnitId` (defaulting to the parent church) is shaped now so a future company-roll feature is additive, not a migration. Institutions are inert Yearbook/affiliation entries (Pen. 2). Companies are unmetered for billing.

### 10. Transfers are D1-authoritative, orchestrated across DOs

A durable-workflow orchestration coordinates every membership transfer: reads the sending church DO, writes the receiving church DO, emits one authoritative record in a D1 `transfer` table (initiated / accepted / rejected + actor + timestamps). The receiving conference/union grant-holder accepts against that record. Same-conference transfers are two DOs and use the same mechanism.

### 11. Governance mutations are audited

Append-only `orgAudit` rows in D1 record every tree/grant/subscription mutation (`{ actor, action, target, before, after, timestamp }`). Trusted-writer model — writers are the super admin and conference admins, not offline clients — so no hash chain; the church DO event log's threat model does not apply. Reuses the existing data-classification and retention policies.

## Killed

- `conference` table and `church.conferenceId`.
- `role_assignment` flat model and its fake church attachment; `role:assign`/`role:revoke` leave the church event-log and become platform operations recorded in `orgAudit`.
- Demo seed data, demo accounts, demo onboarding tour (ADR-0013).
- Self-serve conference unit creation; `canonical` seed concept; upper-unit Durable Objects.

## Consequences

- A fresh install is an empty tree plus one super admin. The operator's bootstrap script becomes the reference for standing up a territory (e.g. Fiji: GC → SPD → TPUM → Fiji Mission → Suva Central).
- Schema changes ripple across `packages/shared`: new `orgUnit`/`roleGrant`/`transfer`/`orgAudit` tables and a `user.isSuperAdmin` column; `member`, `giving_batch`, and other `churchId` columns re-point at church units. The org tables are now wired into `schema.ts` (with Drizzle migrations in `packages/worker/drizzle/`); the legacy `conference`, `church`, and `role_assignment` tables remain in the schema until the migration is fully cut over.
- Conference-role users stop being fake-attached to a church and instead hold grants on real units.
- The transfer flow is honest for the first time: cross-tenant, D1-authoritative, with the receiving unit's officer accepting.
- The super admin (not a grant-holder) is invisible to grant-scoped queries by construction.