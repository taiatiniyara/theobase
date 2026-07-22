# Graph Report - theobase (2026-07-23)

## Corpus Check

- 47 files · ~52,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 306 nodes · 576 edges · 32 communities (19 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `164bcf41`
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
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)

1. `fetch()` - 39 edges
2. `authenticate()` - 36 edges
3. `authorize()` - 33 edges
4. `json()` - 18 edges
5. `useAuth()` - 15 edges
6. `json()` - 11 edges
7. `handleBulkInviteUsers()` - 10 edges
8. `Member` - 9 edges
9. `ChurchSyncDO` - 8 edges
10. `handleBulkCreateChurches()` - 8 edges

## Surprising Connections (you probably didn't know these)

- `request()` --calls--> `fetch()` [INFERRED]
  src/lib/api.ts → worker/index.ts
- `Vite Build Configuration` --conceptually_related_to--> `Worker Fetch Handler` [INFERRED]
  vite.config.ts → worker/index.ts
- `Vitest Test Configuration` --conceptually_related_to--> `Worker Fetch Handler` [INFERRED]
  vitest.config.ts → worker/index.ts
- `Serif Affinity Designer` --exported--> `Theobase Icon (Shield Mark)` [INFERRED]
  branding/theobase.af → branding/icon.svg
- `Theobase React Entry Point` --conceptually_related_to--> `Theobase Platform` [INFERRED]
  index.html → CONTEXT.md

## Hyperedges (group relationships)

- **Financial Custody Workflow** — contextmd_offering_batch, contextmd_dual_custody, contextmd_forwarding [EXTRACTED 1.00]
- **Per-Conference Data Isolation Pattern** — contextmd_conference, adr0002_cloudflare_d1, adr0004_platform_core [INFERRED 0.80]
- **Cloudflare Workers Durable Object Architecture** — worker_entry, ChurchSyncDO, ConferenceDO, worker_env_types [INFERRED 0.75]
- **Dev Proxy and Test Pipeline** — vite_config, vitest_config, worker_entry, smoke_test [INFERRED 0.75]

## Communities (32 total, 13 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.05
Nodes (49): api, authApi, AuthResponse, clearTokens(), CreateMemberData, getRefreshToken(), getToken(), Household (+41 more)

### Community 1 - "Community 1"

Cohesion: 0.2
Nodes (40): AuthContext, authenticate(), authorize(), extractToken(), json(), requireConference(), BAPTISM_TYPES, handleAcceptTransfer() (+32 more)

### Community 2 - "Community 2"

Cohesion: 0.07
Nodes (38): ADR-0001: Append-Only Immutable Finance, SDA Church Manual, Cloudflare D1, ADR-0002: Per-Conference D1 Tenancy, Dexie.js, IndexedDB Operation-Log, ADR-0003: Offline-First PWA Architecture, Versioned Optimistic Locking (+30 more)

### Community 3 - "Community 3"

Cohesion: 0.14
Nodes (28): generateResetToken(), getKey(), hashPassword(), signAccessToken(), signRefreshToken(), verifyPassword(), verifyToken(), CsvParseResult (+20 more)

### Community 4 - "Community 4"

Cohesion: 0.15
Nodes (12): c1Body, c2Body, createMember(), detailBody, filterBody, hh, JH(), listBody (+4 more)

### Community 5 - "Community 5"

Cohesion: 0.23
Nodes (12): Church Sync Durable Object, Conference Durable Object, Home Page Component, React Application Entry Point, Initial Database Schema Migration, TanStack Router Configuration, Worker Smoke Tests, Test Environment Type Declarations (+4 more)

### Community 7 - "Community 7"

Cohesion: 0.25
Nodes (7): Before exploring, read these, code:block1 (/), code:block2 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 8 - "Community 8"

Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 9 - "Community 9"

Cohesion: 0.29
Nodes (7): Agent Skills Configuration, Domain Documentation Layout, GitHub Issues Tracker, Triage Label System, GitHub Issues Agent Workflows, Wayfinding Operations, Triage Label Mapping

### Community 10 - "Community 10"

Cohesion: 0.33
Nodes (7): Brand Orange (rgb 249,115,22), Branding Directory, Logo Light SVG, 512x512 Bounding Rect (fill:none), T Icon Glyph, Theobase Brand, Wordmark Text Paths

### Community 11 - "Community 11"

Cohesion: 0.29
Nodes (7): Theobase Brand Palette: Orange #F97316 + Gray #6B7280, Affinity Designer Source File, Theobase Brand Color Palette: Orange #F97316 + Gray #6B7280, Theobase Brand Cover Image (1640x720 OpenGraph/Social Share), Flame/Torch Icon â€” primary brand mark of Theobase, Theobase Profile Picture (flame/torch icon in orange #F97316), Theobase SDA Church Administration Platform

### Community 12 - "Community 12"

Cohesion: 0.33
Nodes (5): forgotBody, loginBody, meBody, refreshBody, signupBody

### Community 14 - "Community 14"

Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, graphify, Issue tracker, Triage labels

### Community 15 - "Community 15"

Cohesion: 0.33
Nodes (5): Finance, Membership, Organization, Reporting, Theobase

### Community 16 - "Community 16"

Cohesion: 1.0
Nodes (4): Serif Affinity Designer, Theobase Icon (Shield Mark), Theobase Logo Light (Icon + Wordmark), Theobase Project

## Ambiguous Edges - Review These

- `TanStack Router Configuration` → `Home Page Component` [AMBIGUOUS]
  src/routes/HomePage.tsx · relation: conceptually_related_to

## Knowledge Gaps

- **109 isolated node(s):** `queryClient`, `rootRoute`, `indexRoute`, `loginRoute`, `signupRoute` (+104 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `TanStack Router Configuration` and `Home Page Component`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `fetch()` connect `Community 1` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Why does `request()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `ChurchSyncDO` connect `Community 6` to `Community 1`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `queryClient`, `rootRoute`, `indexRoute` to the rest of the system?**
  _109 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
