# Graph Report - theobase (2026-07-08)

## Corpus Check

- 24 files · ~6,744 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 173 nodes · 151 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `2f18c787`
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

## God Nodes (most connected - your core abstractions)

1. `Issues` - 11 edges
2. `Architecture` - 10 edges
3. `Contributing` - 9 edges
4. `UI / UX` - 7 edges
5. `ADR 0001: Hierarchical Organizational Model` - 7 edges
6. `ADR 0002: Deferred Institutions` - 7 edges
7. `ADR 0003: Authentication Approach` - 7 edges
8. `ADR 0004: RBAC with Row-Level Security` - 7 edges
9. `ADR 0005: Mobile-First PWA` - 7 edges
10. `Theobase` - 5 edges

## Surprising Connections (you probably didn't know these)

- None detected - all connections are within the same source files.

## Communities (23 total, 3 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.11
Nodes (18): Accessibility Baseline, API / IPC Contracts, Architecture, code:json ({), code:json ({), Compliance Posture, Component Library, Cost Model (+10 more)

### Community 1 - "Community 1"

Cohesion: 0.12
Nodes (15): code:block1 (Issue 1: Add First Member (TRACER BULLET)), Dependency Graph, Implementation Order, Issue 10: Dashboard and Navigation, Issue 1: Add First Member (TRACER BULLET), Issue 2: View Member List, Issue 3: Edit Member Details, Issue 4: Transfer Member Between Churches (+7 more)

### Community 2 - "Community 2"

Cohesion: 0.14
Nodes (13): Branching, CI, code:bash (git clone https://github.com/taiatiniyara/theobase.git), code:bash (# Run all dev servers), code:block3 (<type>(<scope>): <description>), code:bash (git config commit.gpgsign true), Commit Convention, Contributing (+5 more)

### Community 3 - "Community 3"

Cohesion: 0.15
Nodes (12): ADR 0001: Hierarchical Organizational Model, Alternatives Considered, Consequences, Context, Decision, Flat organization with tags, Graph-based organization, Negative (+4 more)

### Community 4 - "Community 4"

Cohesion: 0.15
Nodes (12): ADR 0003: Authentication Approach, Alternatives Considered, Consequences, Context, Decision, Magic links only (fully passwordless), Negative, Password-only authentication (+4 more)

### Community 5 - "Community 5"

Cohesion: 0.15
Nodes (12): ADR 0004: RBAC with Row-Level Security, Alternatives Considered, Application-level filtering only, Consequences, Context, Decision, Graph-based permissions, Negative (+4 more)

### Community 6 - "Community 6"

Cohesion: 0.15
Nodes (12): ADR 0005: Mobile-First PWA, Alternatives Considered, Consequences, Context, Decision, Desktop-first web app, Native mobile apps (iOS/Android), Negative (+4 more)

### Community 7 - "Community 7"

Cohesion: 0.17
Nodes (11): ADR 0002: Deferred Institutions, Alternatives Considered, Consequences, Context, Decision, Include institutions from the start, Model institutions as a generic "Organization" entity, Negative (+3 more)

### Community 8 - "Community 8"

Cohesion: 0.29
Nodes (6): queryClient, Register, router, indexRoute, rootRoute, routeTree

### Community 9 - "Community 9"

Cohesion: 0.29
Nodes (6): code:bash (npm install), Development, Documentation, Stack, Status, Theobase

### Community 10 - "Community 10"

Cohesion: 0.29
Nodes (6): Before exploring, read these, code:block1 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 11 - "Community 11"

Cohesion: 0.33
Nodes (5): Agent Configuration, Agent skills, Domain docs, Issue tracker, Triage labels

### Community 12 - "Community 12"

Cohesion: 0.33
Nodes (5): Phase 0, Phase 1, Phase 2, Phase Checklist, Session

### Community 13 - "Community 13"

Cohesion: 0.33
Nodes (5): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 14 - "Community 14"

Cohesion: 0.4
Nodes (4): Domain Glossary, Example Dialogue, Relationships, Terms

### Community 15 - "Community 15"

Cohesion: 0.5
Nodes (3): Added, Changelog, [Unreleased]

## Knowledge Gaps

- **110 isolated node(s):** `app`, `queryClient`, `router`, `Register`, `rootRoute` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What connects `app`, `queryClient`, `router` to the rest of the system?**
  _110 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
