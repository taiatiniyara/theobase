# Graph Report - theobase (2026-07-26)

## Corpus Check

- 126 files · ~135,807 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1076 nodes · 2438 edges · 69 communities (51 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `f05638d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- worker/index.ts
- routes/reconciliation.ts
- api.ts
- routes/auth.ts
- useAuth
- Member
- test/members.test.ts
- routes.tsx
- sync-manager.ts
- offline-db.ts
- types/index.ts
- routes/attendance.ts
- FinancePage.tsx
- transfer.test.ts
- schema/index.ts
- DashboardLayout.tsx
- repos/finance.ts
- devDependencies
- attendance.test.ts
- member-self-service.test.ts
- scripts
- TransactionRepo
- ChurchSyncDO
- compilerOptions
- db.ts
- contributions.test.ts
- finance.test.ts
- PositionRepo
- Db
- auth.test.ts
- reconciliation.test.ts
- auth.tsx
- ContributionsPage.tsx
- conference.test.ts
- BatchRepo
- Domain Docs
- ExpenseCategoryRepo
- Issue tracker: GitHub
- Agent Skills Configuration
- Theobase Profile Picture (flame/torch icon in orange #F97316)
- Logo Light SVG
- tsconfig.worker.json
- ChurchRepo
- manifest.json
- Agent skills
- Theobase
- org.test.ts
- rate-limit.ts
- FundRepo
- BudgetRepo
- sw.js
- BudgetTemplateRepo
- routes/org.ts
- Theobase Icon (Shield Mark)
- test/env.d.ts
- request
- worker/env.d.ts
- opencode.json
- routes/users.ts
- Append-only immutable finance
- 0002-per-conference-d1-tenancy.md
- 0003-offline-first-pwa.md
- 0004-modular-package-architecture.md
- triage-labels.md
- Vite Client Type Declarations

## God Nodes (most connected - your core abstractions)

1. `json()` - 99 edges
2. `authenticate()` - 91 edges
3. `fetch()` - 86 edges
4. `createDb()` - 82 edges
5. `authorize()` - 78 edges
6. `logAudit()` - 47 edges
7. `getDeviceInfo()` - 46 edges
8. `useAuth()` - 33 edges
9. `Db` - 30 edges
10. `json()` - 26 edges

## Surprising Connections (you probably didn't know these)

- `request()` --calls--> `fetch()` [INFERRED]
  src/lib/api.ts → worker/index.ts
- `apiFetch()` --calls--> `fetch()` [INFERRED]
  src/lib/sync-manager.ts → worker/index.ts
- `Serif Affinity Designer` --exported--> `Theobase Icon (Shield Mark)` [INFERRED]
  branding/theobase.af → branding/icon.svg
- `Home Page Component` --conceptually_related_to--> `Initial Database Schema Migration` [INFERRED]
  src/routes/HomePage.tsx → migrations/0001_initial.sql
- `Worker Smoke Tests` --calls--> `Worker Fetch Handler` [EXTRACTED]
  test/smoke.test.ts → worker/index.ts

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **Financial Custody Workflow** — contextmd_offering_batch, contextmd_dual_custody, contextmd_forwarding [EXTRACTED 1.00]
- **Per-Conference Data Isolation Pattern** — contextmd_conference, adr0002_cloudflare_d1, adr0004_platform_core [INFERRED 0.80]
- **Cloudflare Workers Durable Object Architecture** — worker_entry, worker_durables_churchsyncdo, worker_durables_conferencedo, worker_env_types [INFERRED 0.75]
- **Dev Proxy and Test Pipeline** — vite_config, vitest_config, worker_entry, test_smoke_test [INFERRED 0.75]

## Communities (69 total, 18 thin omitted)

### Community 0 - "worker/index.ts"

Cohesion: 0.08
Nodes (107): app, authMiddleware, body, doId, fetch(), HonoEnv, json(), rateLimit() (+99 more)

### Community 1 - "routes/reconciliation.ts"

Cohesion: 0.11
Nodes (15): ChurchBalanceRow, ConferenceTitheRow, ReceiveTitheData, ReconciliationRepo, ReconciliationRow, SetBalanceData, TitheReportRow, handleChurchBalance() (+7 more)

### Community 2 - "api.ts"

Cohesion: 0.07
Nodes (34): attendanceApi, AttendanceRecord, AttendanceStats, AttendanceTrendPoint, auditApi, AuditLogEntry, AuditLogResponse, AuthResponse (+26 more)

### Community 3 - "routes/auth.ts"

Cohesion: 0.18
Nodes (17): setupSecretary(), generateResetToken(), getKey(), hashPassword(), signAccessToken(), signRefreshToken(), verifyPassword(), verifyToken() (+9 more)

### Community 4 - "useAuth"

Cohesion: 0.07
Nodes (26): api, orgApi, userApi, useAuth(), AttendancePage(), ChurchMetric, ConferenceDashboard(), ConferenceSummary (+18 more)

### Community 5 - "Member"

Cohesion: 0.07
Nodes (38): ADR-0001: Append-Only Immutable Finance, SDA Church Manual, Cloudflare D1, ADR-0002: Per-Conference D1 Tenancy, Dexie.js, IndexedDB Operation-Log, ADR-0003: Offline-First PWA Architecture, Versioned Optimistic Locking (+30 more)

### Community 6 - "test/members.test.ts"

Cohesion: 0.08
Nodes (28): createSecondChurch(), jsonAuthHeaders(), setupTestContext(), TestContext, createFund(), createHousehold(), createMember(), FULL_SCHEMA (+20 more)

### Community 7 - "routes.tsx"

Cohesion: 0.07
Nodes (29): authApi, attendanceRoute, auditRoute, conferenceDashboardRoute, contributionsRoute, dashboardIndex, districtDashboardRoute, financeRoute (+21 more)

### Community 8 - "sync-manager.ts"

Cohesion: 0.12
Nodes (28): getPendingOperations(), markOperationSynced(), QueuedOperation, emit(), emitConflict(), formatLabel(), getOnlineStatus(), initSyncManager() (+20 more)

### Community 9 - "offline-db.ts"

Cohesion: 0.16
Nodes (10): inferQueueType(), queueOffline(), CachedMember, CachedResponse, db, generateClientUuid(), getOperationPriority(), OfflineDB (+2 more)

### Community 10 - "types/index.ts"

Cohesion: 0.08
Nodes (25): AttendanceRecordDto, AttendanceStatsDto, AttendanceTrendPointDto, AuditLogEntryDto, AuditLogResponseDto, BatchDetailDto, BatchDto, BudgetDto (+17 more)

### Community 11 - "routes/attendance.ts"

Cohesion: 0.12
Nodes (14): AuditEntry, AttendanceFilters, AttendanceRepo, AttendanceRow, CategoryStats, TrendPoint, UpsertAttendanceData, CATEGORIES (+6 more)

### Community 12 - "FinancePage.tsx"

Cohesion: 0.12
Nodes (9): Batch, BatchDetail, Budget, ExpenseCategory, MonthlyReport, Transaction, BatchesTab(), getLatestSaturday() (+1 more)

### Community 13 - "transfer.test.ts"

Cohesion: 0.12
Nodes (15): acceptBody, body, c1Body, c2Body, createMember(), dbTransfer, errBody, init (+7 more)

### Community 14 - "schema/index.ts"

Cohesion: 0.10
Nodes (20): db, MEMBER_SCHEMA, repo, CreateHouseholdData, HouseholdRow, UpdateHouseholdData, CreateMemberData, MemberFilters (+12 more)

### Community 15 - "DashboardLayout.tsx"

Cohesion: 0.19
Nodes (10): Notification, notificationApi, getVisibleGroups(), isModuleVisible(), Module, MODULE_GROUPS, ModuleGroup, ConflictResolver() (+2 more)

### Community 16 - "repos/finance.ts"

Cohesion: 0.20
Nodes (13): BatchRow, BatchTransaction, BudgetRow, BudgetTemplateRow, ExpenseCategoryRow, FundRow, TransactionRow, budgets (+5 more)

### Community 17 - "devDependencies"

Cohesion: 0.04
Nodes (47): @cloudflare/vitest-pool-workers, @cloudflare/workers-types, concurrently, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+39 more)

### Community 18 - "attendance.test.ts"

Cohesion: 0.15
Nodes (10): b1, b2, c1Body, catBody, listBody, me, rangeBody, signupBody (+2 more)

### Community 19 - "member-self-service.test.ts"

Cohesion: 0.15
Nodes (10): adminBody, body, cBody, list, me, memberBody, profile, treasBody (+2 more)

### Community 20 - "scripts"

Cohesion: 0.05
Nodes (40): dexie, drizzle-orm, hono, jose, dependencies, dexie, drizzle-orm, hono (+32 more)

### Community 22 - "ChurchSyncDO"

Cohesion: 0.09
Nodes (13): Initial Database Schema Migration, React Application Entry Point, TanStack Router Configuration, Home Page Component, Test Environment Type Declarations, Worker Smoke Tests, Church Sync Durable Object, ChurchSyncDO (+5 more)

### Community 23 - "compilerOptions"

Cohesion: 0.07
Nodes (27): dist, DOM, DOM.Iterable, node_modules, ./shared/types/index.ts, src, vite-env.d.ts, compilerOptions (+19 more)

### Community 24 - "db.ts"

Cohesion: 0.15
Nodes (15): PERMISSIONS, AuthContext, extractToken(), json(), requireConference(), CHURCH_ROLES, CONFERENCE_ROLES, PERMISSIONS (+7 more)

### Community 25 - "contributions.test.ts"

Cohesion: 0.20
Nodes (7): body, c1Body, jane, john, listBody, me, signupBody

### Community 26 - "finance.test.ts"

Cohesion: 0.20
Nodes (7): b, batch, branchBody, lb, mb, parentBody, sb

### Community 28 - "Db"

Cohesion: 0.11
Nodes (6): Db, AuditRepo, HouseholdRepo, NotificationRepo, NotificationRow, notifications

### Community 29 - "auth.test.ts"

Cohesion: 0.20
Nodes (8): body, forgotBody, loginBody, meBody, refreshBody, signupBody, tokenRow, userId

### Community 30 - "reconciliation.test.ts"

Cohesion: 0.22
Nodes (8): b, b2, churchA, churchB, eps, hh, mb, sb

### Community 31 - "auth.tsx"

Cohesion: 0.19
Nodes (16): clearTokens(), getRefreshToken(), getToken(), isOnline(), request(), setTokens(), AuthContext, AuthContextType (+8 more)

### Community 32 - "ContributionsPage.tsx"

Cohesion: 0.32
Nodes (7): contributionApi, ContributionStatement, ContributionSummary, ContributionsPage(), formatCurrency(), FUND_LABELS, FUND_ORDER

### Community 33 - "conference.test.ts"

Cohesion: 0.25
Nodes (7): b, hh, mb, md, now, pb, sb

### Community 35 - "Domain Docs"

Cohesion: 0.25
Nodes (7): Before exploring, read these, code:block1 (/), code:block2 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 37 - "Issue tracker: GitHub"

Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 38 - "Agent Skills Configuration"

Cohesion: 0.29
Nodes (7): Agent Skills Configuration, Domain Documentation Layout, GitHub Issues Tracker, Triage Label System, GitHub Issues Agent Workflows, Wayfinding Operations, Triage Label Mapping

### Community 39 - "Theobase Profile Picture (flame/torch icon in orange #F97316)"

Cohesion: 0.29
Nodes (7): Theobase Brand Palette: Orange #F97316 + Gray #6B7280, Affinity Designer Source File, Theobase Brand Color Palette: Orange #F97316 + Gray #6B7280, Theobase Profile Picture (flame/torch icon in orange #F97316), Theobase Brand Cover Image (1640x720 OpenGraph/Social Share), Flame/Torch Icon â€” primary brand mark of Theobase, Theobase SDA Church Administration Platform

### Community 40 - "Logo Light SVG"

Cohesion: 0.33
Nodes (7): Brand Orange (rgb 249,115,22), Branding Directory, Logo Light SVG, 512x512 Bounding Rect (fill:none), T Icon Glyph, Theobase Brand, Wordmark Text Paths

### Community 41 - "tsconfig.worker.json"

Cohesion: 0.14
Nodes (13): @cloudflare/vitest-pool-workers, @cloudflare/workers-types, test, ./tsconfig.json, worker, compilerOptions, lib, noUncheckedIndexedAccess (+5 more)

### Community 43 - "manifest.json"

Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 44 - "Agent skills"

Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, graphify, Issue tracker, Triage labels

### Community 45 - "Theobase"

Cohesion: 0.33
Nodes (5): Finance, Membership, Organization, Reporting, Theobase

### Community 46 - "org.test.ts"

Cohesion: 0.40
Nodes (4): body, companyBody, me, parentBody

### Community 50 - "sw.js"

Cohesion: 0.50
Nodes (3): ASSETS_TO_CACHE, fetchPromise, url

### Community 52 - "routes/org.ts"

Cohesion: 0.11
Nodes (16): ChurchRow, ConferenceRepo, ConferenceRow, DistrictRepo, DistrictRow, handleBulkCreateChurches(), handleGetChurches(), handleGetConferences() (+8 more)

### Community 53 - "Theobase Icon (Shield Mark)"

Cohesion: 1.00
Nodes (4): Serif Affinity Designer, Theobase Icon (Shield Mark), Theobase Logo Light (Icon + Wordmark), Theobase Project

### Community 57 - "opencode.json"

Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 58 - "routes/users.ts"

Cohesion: 0.21
Nodes (8): result, CsvParseResult, parseCsv(), validateCsvHeaders(), UserRow, UserWithChurch, toUserResponse(), users

## Ambiguous Edges - Review These

- `Home Page Component` → `TanStack Router Configuration` [AMBIGUOUS]
  src/routes/HomePage.tsx · relation: conceptually_related_to

## Knowledge Gaps

- **368 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `name`, `version`, `private` (+363 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Home Page Component` and `TanStack Router Configuration`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `fetch()` connect `worker/index.ts` to `routes/reconciliation.ts`, `routes/auth.ts`, `routes/attendance.ts`, `routes/org.ts`, `auth.tsx`?**
  _High betweenness centrality (0.203) - this node is a cross-community bridge._
- **Why does `request()` connect `auth.tsx` to `worker/index.ts`, `offline-db.ts`, `api.ts`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `auth.tsx` to `sync-manager.ts`, `worker/index.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `fetch()` (e.g. with `request()` and `apiFetch()`) actually correct?**
  _`fetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `.opencode/plugins/graphify.js`, `name` to the rest of the system?**
  _368 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `worker/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07664233576642336 - nodes in this community are weakly interconnected._
