# Graph Report - theobase (2026-07-26)

## Corpus Check

- 177 files · ~159,010 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1500 nodes · 3045 edges · 133 communities (84 shown, 49 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `940236a4`
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
- Disaster Recovery
- repos/members.test.ts
- Billing and Subscription
- Vite Client Type Declarations
- Contacting Support
- BillingRepo
- TransferRepo
- Conference Dashboard
- Monthly Treasurer Report
- Security Audit
- Quarterly Business Meeting Report
- Tithe Reconciliation
- Member Transfer
- User Management
- Creating Your First Church
- Forgot Password
- Getting Started with Theobase
- Offering Batches and Dual Custody
- globalload.js
- ReconciliationRepo
- Managing Members
- Positions and Roles
- Recording Attendance
- helpers.ts
- package.json
- lint-staged
- concurrently
- drizzle-kit
- drizzle-orm
- eslint
- @eslint/js
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- globals
- hono
- husky
- jose
- lint-staged
- stripe
- @tanstack/react-query
- @tanstack/react-table
- toucan-js
- @playwright/test
- prettier
- tailwindcss
- @types/react
- @types/react-dom
- typescript
- typescript-eslint
- vite
- vite-tsconfig-paths
- @vitejs/plugin-react
- vitest
- @vitest/coverage-istanbul
- wrangler
- React Application Entry Point
- rate-limit.ts
- routes/users.ts
- AttendancePage.tsx
- repos/attendance.ts
- ExpenseCategoryRepo
- BudgetTemplateRepo
- FundRepo

## God Nodes (most connected - your core abstractions)

1. `json()` - 118 edges
2. `createDb()` - 110 edges
3. `authenticate()` - 91 edges
4. `fetch()` - 86 edges
5. `authorize()` - 85 edges
6. `logAudit()` - 49 edges
7. `getDeviceInfo()` - 48 edges
8. `Db` - 34 edges
9. `useAuth()` - 33 edges
10. `json()` - 26 edges

## Surprising Connections (you probably didn't know these)

- `request()` --calls--> `fetch()` [INFERRED]
  src/lib/api.ts → worker/index.ts
- `apiFetch()` --calls--> `fetch()` [INFERRED]
  src/lib/sync-manager.ts → worker/index.ts
- `Serif Affinity Designer` --exported--> `Theobase Icon (Shield Mark)` [INFERRED]
  branding/theobase.af → branding/icon.svg
- `setupSecretary()` --calls--> `hashPassword()` [INFERRED]
  test/transfer.test.ts → worker/lib/auth.ts
- `Theobase React Entry Point` --conceptually_related_to--> `Theobase Platform` [INFERRED]
  index.html → CONTEXT.md

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **Financial Custody Workflow** — contextmd_offering_batch, contextmd_dual_custody, contextmd_forwarding [EXTRACTED 1.00]
- **Per-Conference Data Isolation Pattern** — contextmd_conference, adr0002_cloudflare_d1, adr0004_platform_core [INFERRED 0.80]
- **Cloudflare Workers Durable Object Architecture** — worker_entry, worker_durables_churchsyncdo, worker_durables_conferencedo, worker_env_types [INFERRED 0.75]
- **Dev Proxy and Test Pipeline** — vite_config, vitest_config, worker_entry, test_smoke_test [INFERRED 0.75]

## Communities (133 total, 49 thin omitted)

### Community 0 - "worker/index.ts"

Cohesion: 0.06
Nodes (129): app, authMiddleware, body, doId, fetch(), HonoEnv, json(), readLimitM (+121 more)

### Community 1 - "routes/reconciliation.ts"

Cohesion: 0.18
Nodes (10): ChurchBalanceRow, ConferenceTitheRow, ReceiveTitheData, ReconciliationRow, SetBalanceData, TitheReportRow, toChurchBalanceResponse(), toTitheEntry() (+2 more)

### Community 2 - "api.ts"

Cohesion: 0.06
Nodes (36): adminApi, AdminProvisioningStatus, AdminSubscription, auditApi, AuditLogEntry, AuditLogResponse, AuthResponse, billingApi (+28 more)

### Community 3 - "routes/auth.ts"

Cohesion: 0.16
Nodes (22): setupSecretary(), blacklistToken(), generateResetToken(), generateVerifyToken(), getKey(), hashPassword(), isTokenBlacklisted(), signAccessToken() (+14 more)

### Community 4 - "useAuth"

Cohesion: 0.07
Nodes (26): api, orgApi, userApi, useAuth(), ChurchMetric, ConferenceDashboard(), ConferenceSummary, District (+18 more)

### Community 5 - "Member"

Cohesion: 0.07
Nodes (38): ADR-0001: Append-Only Immutable Finance, SDA Church Manual, Cloudflare D1, ADR-0002: Per-Conference D1 Tenancy, Dexie.js, IndexedDB Operation-Log, ADR-0003: Offline-First PWA Architecture, Versioned Optimistic Locking (+30 more)

### Community 6 - "test/members.test.ts"

Cohesion: 0.08
Nodes (28): createSecondChurch(), jsonAuthHeaders(), setupTestContext(), TestContext, createFund(), createHousehold(), createMember(), FULL_SCHEMA (+20 more)

### Community 7 - "routes.tsx"

Cohesion: 0.04
Nodes (47): adminRoute, attendanceRoute, auditRoute, billingRoute, conferenceDashboardRoute, contributionsRoute, dashboardIndex, districtDashboardRoute (+39 more)

### Community 8 - "sync-manager.ts"

Cohesion: 0.30
Nodes (10): inferOperationType(), offlineSafeRequest(), pullFreshData(), stripApiBase(), getOnlineStatus(), triggerSync(), useOfflineInit(), useSyncState() (+2 more)

### Community 9 - "offline-db.ts"

Cohesion: 0.16
Nodes (10): inferQueueType(), queueOffline(), CachedMember, CachedResponse, db, generateClientUuid(), getOperationPriority(), OfflineDB (+2 more)

### Community 10 - "types/index.ts"

Cohesion: 0.08
Nodes (26): AttendanceRecordDto, AttendanceStatsDto, AttendanceTrendPointDto, AuditLogEntryDto, AuditLogResponseDto, BatchDetailDto, BatchDto, BudgetDto (+18 more)

### Community 11 - "routes/attendance.ts"

Cohesion: 0.26
Nodes (4): AttendanceRepo, handleGetAttendanceStats(), handleRecordAttendance(), json()

### Community 12 - "FinancePage.tsx"

Cohesion: 0.12
Nodes (9): Batch, BatchDetail, Budget, ExpenseCategory, MonthlyReport, Transaction, BatchesTab(), getLatestSaturday() (+1 more)

### Community 13 - "transfer.test.ts"

Cohesion: 0.12
Nodes (15): acceptBody, body, c1Body, c2Body, createMember(), dbTransfer, errBody, init (+7 more)

### Community 14 - "schema/index.ts"

Cohesion: 0.09
Nodes (20): db, MEMBER_SCHEMA, repo, CreateMemberData, MemberFilters, MemberRow, UpdateMemberData, MemberPositionRow (+12 more)

### Community 15 - "DashboardLayout.tsx"

Cohesion: 0.24
Nodes (9): Notification, notificationApi, getVisibleGroups(), isModuleVisible(), Module, MODULE_GROUPS, ModuleGroup, DashboardLayout() (+1 more)

### Community 16 - "repos/finance.ts"

Cohesion: 0.20
Nodes (13): BatchRow, BatchTransaction, BudgetRow, BudgetTemplateRow, ExpenseCategoryRow, FundRow, TransactionRow, budgets (+5 more)

### Community 17 - "devDependencies"

Cohesion: 0.29
Nodes (7): @cloudflare/vitest-pool-workers, @cloudflare/workers-types, devDependencies, @cloudflare/vitest-pool-workers, @cloudflare/workers-types, @tailwindcss/vite, @tailwindcss/vite

### Community 18 - "attendance.test.ts"

Cohesion: 0.15
Nodes (10): b1, b2, c1Body, catBody, listBody, me, rangeBody, signupBody (+2 more)

### Community 19 - "member-self-service.test.ts"

Cohesion: 0.15
Nodes (10): adminBody, body, cBody, list, me, memberBody, profile, treasBody (+2 more)

### Community 20 - "scripts"

Cohesion: 0.13
Nodes (15): scripts, build, coverage, dev, dev:web, dev:worker, e2e, format (+7 more)

### Community 22 - "ChurchSyncDO"

Cohesion: 0.08
Nodes (9): Initial Database Schema Migration, Test Environment Type Declarations, request, ChurchSyncDO, OfflineOperation, ConferenceDO, ProvisioningState, Worker Fetch Handler (+1 more)

### Community 23 - "compilerOptions"

Cohesion: 0.07
Nodes (27): dist, DOM, DOM.Iterable, node_modules, ./shared/types/index.ts, src, vite-env.d.ts, compilerOptions (+19 more)

### Community 24 - "db.ts"

Cohesion: 0.06
Nodes (30): 10.1 Termination by You, 10.2 Termination by Theobase, 10.3 Data After Termination, 10. Termination, 11. Governing Law, 12. Changes to Terms, 13. Contact, 1. Acceptance of Terms (+22 more)

### Community 25 - "contributions.test.ts"

Cohesion: 0.20
Nodes (7): body, c1Body, jane, john, listBody, me, signupBody

### Community 26 - "finance.test.ts"

Cohesion: 0.20
Nodes (7): b, batch, branchBody, lb, mb, parentBody, sb

### Community 28 - "Db"

Cohesion: 0.14
Nodes (16): AuthContext, extractToken(), json(), requireConference(), CHURCH_ROLES, CONFERENCE_ROLES, PERMISSIONS, Role (+8 more)

### Community 29 - "auth.test.ts"

Cohesion: 0.20
Nodes (8): body, forgotBody, loginBody, meBody, refreshBody, signupBody, tokenRow, userId

### Community 30 - "reconciliation.test.ts"

Cohesion: 0.22
Nodes (8): b, b2, churchA, churchB, eps, hh, mb, sb

### Community 32 - "ContributionsPage.tsx"

Cohesion: 0.32
Nodes (7): contributionApi, ContributionStatement, ContributionSummary, ContributionsPage(), formatCurrency(), FUND_LABELS, FUND_ORDER

### Community 33 - "conference.test.ts"

Cohesion: 0.25
Nodes (7): b, hh, mb, md, now, pb, sb

### Community 35 - "Domain Docs"

Cohesion: 0.25
Nodes (7): Before exploring, read these, code:block1 (/), code:block2 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 36 - "ExpenseCategoryRepo"

Cohesion: 0.11
Nodes (12): ChurchRow, ConferenceRepo, ConferenceRow, DistrictRepo, DistrictRow, UserRepo, toChurchResponse(), toConferenceResponse() (+4 more)

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

### Community 47 - "rate-limit.ts"

Cohesion: 0.07
Nodes (27): 10. Production checklist, 1. Custom domain, 2. D1 database, 3. Cloudflare secrets, 4. Durable Object migration, 5. Email binding, 6. Deploy, 7. Frontend build (+19 more)

### Community 48 - "FundRepo"

Cohesion: 0.09
Nodes (12): Db, AuditEntry, AuditFilters, AuditPage, AuditRepo, CreateHouseholdData, HouseholdRepo, HouseholdRow (+4 more)

### Community 50 - "sw.js"

Cohesion: 0.50
Nodes (3): ASSETS_TO_CACHE, fetchPromise, url

### Community 51 - "BudgetTemplateRepo"

Cohesion: 0.09
Nodes (21): 10. Breach Notification, 11. Data Deletion, 12. Audit Rights, 13. International Data Transfers, 14. Limitation of Liability, 1. Parties, 2. Purpose and Scope, 3. Duration (+13 more)

### Community 52 - "routes/org.ts"

Cohesion: 0.10
Nodes (19): 10. International Data Transfers, 11. Security, 12. Changes to This Policy, 13. Contact, 1. Introduction, 2.1 Account Information, 2.2 Church Member Data, 2.3 Financial Data (+11 more)

### Community 53 - "Theobase Icon (Shield Mark)"

Cohesion: 1.00
Nodes (4): Serif Affinity Designer, Theobase Icon (Shield Mark), Theobase Logo Light (Icon + Wordmark), Theobase Project

### Community 55 - "request"

Cohesion: 0.12
Nodes (25): getToken(), getPendingOperations(), markOperationSynced(), QueuedOperation, apiFetch(), emit(), emitConflict(), formatLabel() (+17 more)

### Community 57 - "opencode.json"

Cohesion: 0.50
Nodes (3): plugin, $schema, .opencode/plugins/graphify.js

### Community 58 - "routes/users.ts"

Cohesion: 0.13
Nodes (15): dexie, i18next, i18next-browser-languagedetector, dependencies, dexie, i18next, i18next-browser-languagedetector, react (+7 more)

### Community 67 - "Disaster Recovery"

Cohesion: 0.14
Nodes (13): 1. Identify the database, 2. Initiate restore, 3. Update the Worker binding, 4. Verify integrity, Disaster Recovery, Escalation, Prevention, Recovery Point Objective (RPO) (+5 more)

### Community 68 - "repos/members.test.ts"

Cohesion: 0.22
Nodes (10): authApi, clearTokens(), getRefreshToken(), isOnline(), request(), setTokens(), AuthContext, AuthContextType (+2 more)

### Community 69 - "Billing and Subscription"

Cohesion: 0.15
Nodes (12): Billing and Subscription, Cancelling Your Subscription, Checking Your Subscription Status, How Billing Works, Overview, Pricing, Setting Up Payment, Tips (+4 more)

### Community 72 - "Contacting Support"

Cohesion: 0.15
Nodes (12): Contacting Support, Feature Requests, Good Example, Helpful Extras, How to Contact Support, Overview, Reporting Bugs, Required Information (+4 more)

### Community 73 - "BillingRepo"

Cohesion: 0.18
Nodes (7): scheduled(), cleanExpiredBlacklist(), BillingRepo, getStripe(), handleBillingStatus(), handleCreateCheckout(), handleStripeWebhook()

### Community 74 - "TransferRepo"

Cohesion: 0.27
Nodes (6): SettingsRepo, handleGetChurchSettings(), handleUpdateChurchSettings(), handleUpdateConferenceSettings(), handleUpdateUserSettings(), stripMeta()

### Community 75 - "Conference Dashboard"

Cohesion: 0.17
Nodes (11): Church List, Church Summary, Conference Dashboard, District Dashboard, Filtering, Global Dashboard, Membership Trends, Overview (+3 more)

### Community 76 - "Monthly Treasurer Report"

Cohesion: 0.17
Nodes (11): Balance Summary, Expense Section, Exporting, Generating the Report, Income Section, Monthly Treasurer Report, Notes and Attachments, Overview (+3 more)

### Community 77 - "Security Audit"

Cohesion: 0.18
Nodes (10): Automated Scans, Findings and Remediation, Manual Checks, npm audit, OWASP ZAP, Remediation workflow, Responsible Disclosure, Scheduled Audits (+2 more)

### Community 78 - "Quarterly Business Meeting Report"

Cohesion: 0.18
Nodes (10): Auditor Role Notes, Generating the Report, Overview, Printing and Presenting, Quarterly Business Meeting Report, Report Sections, Section 1: Membership (Presented by the Clerk), Section 2: Finance (Presented by the Treasurer) (+2 more)

### Community 79 - "Tithe Reconciliation"

Cohesion: 0.18
Nodes (10): Church-Level Reconciliation, How Forwarding Works, Overview, Reconciliation Report, Reconciling Tithe, Step 1: View Forwarded Tithe, Step 2: Match Against Bank Deposits, Step 3: Handle Discrepancies (+2 more)

### Community 80 - "Member Transfer"

Cohesion: 0.20
Nodes (9): Member Transfer, Override (Conference-Level), Overview, Step 1: Initiate Transfer (Sending Church Clerk), Step 2: Approve Transfer (Conference Secretary), Step 3: Accept Transfer (Receiving Church Clerk), The Transfer Workflow, Tips (+1 more)

### Community 81 - "User Management"

Cohesion: 0.20
Nodes (9): Bulk Inviting Users, Inviting a User, Managing Existing Users, Overview, Resending an Invitation, Roles, Self-Service: Member Access, Tips (+1 more)

### Community 82 - "Creating Your First Church"

Cohesion: 0.22
Nodes (8): After Creation, Bulk Import, Church Types, Creating a Church, Creating Your First Church, Editing a Church, Overview, Tips

### Community 83 - "Forgot Password"

Cohesion: 0.22
Nodes (8): Check Your Email, Forgot Password, If the Reset Link Doesn't Work, If You Can't Access Your Email, Overview, Resetting Your Password, Security Notes, Setting a New Password

### Community 84 - "Getting Started with Theobase"

Cohesion: 0.22
Nodes (8): Dashboard Overview, Email Verification, First Login, Getting Help, Getting Started with Theobase, Next Steps, Overview, Signing Up

### Community 85 - "Offering Batches and Dual Custody"

Cohesion: 0.22
Nodes (8): Batch Reports, Offering Batches and Dual Custody, Overview, Step 1: Treasurer Creates the Batch, Step 2: Assistant Treasurer Confirms, The Dual-Custody Workflow, Viewing Confirmed Batches, What If There's a Mistake?

### Community 86 - "globalload.js"

Cohesion: 0.31
Nodes (8): CONFERENCES, DURATION, main(), makeRequest(), PER_CONF, signup(), simulateUser(), stats

### Community 88 - "Managing Members"

Cohesion: 0.25
Nodes (7): Adding a Member, Assigning to a Household, Editing Member Details, Managing Members, Membership Statuses, Overview, Removing a Member

### Community 89 - "Positions and Roles"

Cohesion: 0.25
Nodes (7): Assigning a Position to a Member, Benefits, Overview, Positions and Roles, Removing a Position, Standard Church Positions, Viewing All Position Holders

### Community 90 - "Recording Attendance"

Cohesion: 0.25
Nodes (7): Attendance Categories, Attendance Statistics, How to Record Attendance, Overview, Recording Attendance, Tips, Viewing Attendance History

### Community 92 - "package.json"

Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 93 - "lint-staged"

Cohesion: 0.50
Nodes (5): lint-staged, *.{json,css,md}, *.{ts,tsx,js,jsx}, eslint --fix, prettier --write

### Community 125 - "rate-limit.ts"

Cohesion: 0.22
Nodes (8): rateLimit(), AUTH_LIMIT, checkRateLimitAsync(), RateLimitConfig, READ_LIMIT, SYNC_READ_LIMIT, SYNC_WRITE_LIMIT, WRITE_LIMIT

### Community 126 - "routes/users.ts"

Cohesion: 0.29
Nodes (6): result, AuditEntry, CsvParseResult, parseCsv(), validateCsvHeaders(), toUserResponse()

### Community 127 - "AttendancePage.tsx"

Cohesion: 0.25
Nodes (6): attendanceApi, AttendanceRecord, AttendanceStats, AttendanceTrendPoint, AttendancePage(), CATEGORIES

### Community 128 - "repos/attendance.ts"

Cohesion: 0.32
Nodes (6): AttendanceFilters, CategoryStats, TrendPoint, UpsertAttendanceData, attendance, memberAttendance

## Knowledge Gaps

- **634 isolated node(s):** `$schema`, `.opencode/plugins/graphify.js`, `PER_CONF`, `CONFERENCES`, `DURATION` (+629 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `fetch()` connect `worker/index.ts` to `routes/auth.ts`, `repos/members.test.ts`, `routes/attendance.ts`, `request`, `rate-limit.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `request()` connect `repos/members.test.ts` to `worker/index.ts`, `offline-db.ts`, `api.ts`, `request`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `request` to `worker/index.ts`, `repos/members.test.ts`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `fetch()` (e.g. with `request()` and `apiFetch()`) actually correct?**
  _`fetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `.opencode/plugins/graphify.js`, `PER_CONF` to the rest of the system?**
  _634 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `worker/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0557909604519774 - nodes in this community are weakly interconnected._
- **Should `api.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._
