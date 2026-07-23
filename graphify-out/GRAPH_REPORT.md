# Graph Report - theobase (2026-07-23)

## Corpus Check

- 85 files · ~118,777 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 580 nodes · 1287 edges · 48 communities (35 shown, 13 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `b8743a01`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]

## God Nodes (most connected - your core abstractions)

1. `authenticate()` - 81 edges
2. `fetch()` - 78 edges
3. `authorize()` - 74 edges
4. `logAudit()` - 40 edges
5. `getDeviceInfo()` - 40 edges
6. `useAuth()` - 31 edges
7. `json()` - 19 edges
8. `json()` - 18 edges
9. `PERMISSIONS` - 11 edges
10. `json()` - 11 edges

## Surprising Connections (you probably didn't know these)

- `request()` --calls--> `fetch()` [INFERRED]
  src/lib/api.ts → worker/index.ts
- `apiFetch()` --calls--> `fetch()` [INFERRED]
  src/lib/sync-manager.ts → worker/index.ts
- `Vite Build Configuration` --conceptually_related_to--> `Worker Fetch Handler` [INFERRED]
  vite.config.ts → worker/index.ts
- `Vitest Test Configuration` --conceptually_related_to--> `Worker Fetch Handler` [INFERRED]
  vitest.config.ts → worker/index.ts
- `Serif Affinity Designer` --exported--> `Theobase Icon (Shield Mark)` [INFERRED]
  branding/theobase.af → branding/icon.svg

## Hyperedges (group relationships)

- **Financial Custody Workflow** — contextmd_offering_batch, contextmd_dual_custody, contextmd_forwarding [EXTRACTED 1.00]
- **Per-Conference Data Isolation Pattern** — contextmd_conference, adr0002_cloudflare_d1, adr0004_platform_core [INFERRED 0.80]
- **Cloudflare Workers Durable Object Architecture** — worker_entry, ChurchSyncDO, ConferenceDO, worker_env_types [INFERRED 0.75]
- **Dev Proxy and Test Pipeline** — vite_config, vitest_config, worker_entry, smoke_test [INFERRED 0.75]

## Communities (48 total, 13 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.1
Nodes (95): AuditEntry, getDeviceInfo(), logAudit(), AuthContext, authenticate(), authorize(), extractToken(), json() (+87 more)

### Community 1 - "Community 1"

Cohesion: 0.06
Nodes (48): clearTokens(), getRefreshToken(), getToken(), inferQueueType(), isOnline(), queueOffline(), request(), setTokens() (+40 more)

### Community 2 - "Community 2"

Cohesion: 0.07
Nodes (38): ADR-0001: Append-Only Immutable Finance, SDA Church Manual, Cloudflare D1, ADR-0002: Per-Conference D1 Tenancy, Dexie.js, IndexedDB Operation-Log, ADR-0003: Offline-First PWA Architecture, Versioned Optimistic Locking (+30 more)

### Community 3 - "Community 3"

Cohesion: 0.08
Nodes (24): api, userApi, AuthContext, AuthContextType, useAuth(), User, ChurchMetric, ConferenceDashboard() (+16 more)

### Community 4 - "Community 4"

Cohesion: 0.09
Nodes (24): attendanceApi, AttendanceRecord, AttendanceStats, AttendanceTrendPoint, authApi, AuthResponse, BudgetTemplate, ChurchBalance (+16 more)

### Community 5 - "Community 5"

Cohesion: 0.15
Nodes (26): generateResetToken(), getKey(), hashPassword(), signAccessToken(), signRefreshToken(), verifyPassword(), verifyToken(), CsvParseResult (+18 more)

### Community 6 - "Community 6"

Cohesion: 0.07
Nodes (25): AuthProvider(), queryClient, attendanceRoute, auditRoute, conferenceDashboardRoute, contributionsRoute, dashboardIndex, dashboardLayout (+17 more)

### Community 7 - "Community 7"

Cohesion: 0.12
Nodes (10): Batch, BatchDetail, Budget, ExpenseCategory, Fund, MonthlyReport, Transaction, BatchesTab() (+2 more)

### Community 8 - "Community 8"

Cohesion: 0.14
Nodes (13): c1Body, c2Body, createMember(), detailBody, filterBody, hh, JH(), jsonAuthHeaders() (+5 more)

### Community 9 - "Community 9"

Cohesion: 0.15
Nodes (10): b1, b2, c1Body, catBody, listBody, me, rangeBody, signupBody (+2 more)

### Community 10 - "Community 10"

Cohesion: 0.23
Nodes (12): Church Sync Durable Object, Conference Durable Object, Home Page Component, React Application Entry Point, Initial Database Schema Migration, TanStack Router Configuration, Worker Smoke Tests, Test Environment Type Declarations (+4 more)

### Community 11 - "Community 11"

Cohesion: 0.22
Nodes (8): Notification, notificationApi, getVisibleGroups(), Module, MODULE_GROUPS, ModuleGroup, DashboardLayout(), ICONS

### Community 12 - "Community 12"

Cohesion: 0.2
Nodes (7): body, c1Body, jane, john, listBody, me, signupBody

### Community 13 - "Community 13"

Cohesion: 0.22
Nodes (8): b, b2, churchA, churchB, eps, hh, mb, sb

### Community 15 - "Community 15"

Cohesion: 0.29
Nodes (7): contributionApi, ContributionStatement, ContributionSummary, ContributionsPage(), formatCurrency(), FUND_LABELS, FUND_ORDER

### Community 16 - "Community 16"

Cohesion: 0.25
Nodes (7): body, forgotBody, loginBody, meBody, refreshBody, signupBody, userId

### Community 17 - "Community 17"

Cohesion: 0.25
Nodes (7): b, hh, mb, md, now, pb, sb

### Community 18 - "Community 18"

Cohesion: 0.25
Nodes (7): Before exploring, read these, code:block1 (/), code:block2 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 19 - "Community 19"

Cohesion: 0.29
Nodes (5): auditApi, AuditLogEntry, AuditLogResponse, ACTIONS, ENTITY_TYPES

### Community 20 - "Community 20"

Cohesion: 0.29
Nodes (4): b, lb, mb, sb

### Community 21 - "Community 21"

Cohesion: 0.29
Nodes (6): b, cb, ecb, hh, mb, sb

### Community 22 - "Community 22"

Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 23 - "Community 23"

Cohesion: 0.29
Nodes (7): Agent Skills Configuration, Domain Documentation Layout, GitHub Issues Tracker, Triage Label System, GitHub Issues Agent Workflows, Wayfinding Operations, Triage Label Mapping

### Community 24 - "Community 24"

Cohesion: 0.29
Nodes (7): Theobase Brand Palette: Orange #F97316 + Gray #6B7280, Affinity Designer Source File, Theobase Brand Color Palette: Orange #F97316 + Gray #6B7280, Theobase Brand Cover Image (1640x720 OpenGraph/Social Share), Flame/Torch Icon â€” primary brand mark of Theobase, Theobase Profile Picture (flame/torch icon in orange #F97316), Theobase SDA Church Administration Platform

### Community 25 - "Community 25"

Cohesion: 0.33
Nodes (7): Brand Orange (rgb 249,115,22), Branding Directory, Logo Light SVG, 512x512 Bounding Rect (fill:none), T Icon Glyph, Theobase Brand, Wordmark Text Paths

### Community 26 - "Community 26"

Cohesion: 0.33
Nodes (5): orgApi, Church, Conference, District, OrgManagementPage()

### Community 28 - "Community 28"

Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, graphify, Issue tracker, Triage labels

### Community 29 - "Community 29"

Cohesion: 0.33
Nodes (5): Finance, Membership, Organization, Reporting, Theobase

### Community 30 - "Community 30"

Cohesion: 0.4
Nodes (3): AUTH_LIMIT, checkRateLimitAsync(), RateLimitConfig

### Community 31 - "Community 31"

Cohesion: 0.5
Nodes (3): ASSETS_TO_CACHE, fetchPromise, url

### Community 32 - "Community 32"

Cohesion: 1.0
Nodes (4): Serif Affinity Designer, Theobase Icon (Shield Mark), Theobase Logo Light (Icon + Wordmark), Theobase Project

## Ambiguous Edges - Review These

- `TanStack Router Configuration` → `Home Page Component` [AMBIGUOUS]
  src/routes/HomePage.tsx · relation: conceptually_related_to

## Knowledge Gaps

- **205 isolated node(s):** `ASSETS_TO_CACHE`, `url`, `fetchPromise`, `queryClient`, `rootRoute` (+200 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `TanStack Router Configuration` and `Home Page Component`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `fetch()` connect `Community 0` to `Community 1`, `Community 5`, `Community 30`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Why does `request()` connect `Community 1` to `Community 0`, `Community 4`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Why does `apiFetch()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `fetch()` (e.g. with `request()` and `apiFetch()`) actually correct?**
  _`fetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ASSETS_TO_CACHE`, `url`, `fetchPromise` to the rest of the system?**
  _205 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
