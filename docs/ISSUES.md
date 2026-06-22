# Issues — Backlog Dependency Graph

> 23 vertical-slice issues. Each cuts through every architectural layer.
> See `.scratch/<slug>/issue.md` for full acceptance criteria.

## Tracer Bullet

**001 — Monorepo + Auth Foundation** (COMPLETE) — touches Workers, D1, DO, Email, PWA cache. Proves every layer of the Cloudflare stack before feature code.

## Dependency Graph

```
001 ── Monorepo + Auth Foundation [COMPLETE]
│
├── 002 ── Member Self-Service Portal [COMPLETE]
│   │
│   ├── 003 ── Congregation Setup & Officer Management [COMPLETE]
│   │   ├── 005 ── Boardroom Management Ledger [IMPLEMENTED]
│   │   │   ├── 007 ── Volunteer Treasury Interface [IMPLEMENTED]
│   │   │   │   └── 022 ── Conference Report Generator [IMPLEMENTED]
│   │   │   └── 019 ── Facility Coordinator [IMPLEMENTED]
│   │   ├── 018 ── Pastoral District Hub [IMPLEMENTED]
│   │   └── 020 ── Crisis Resilience Matrix [IMPLEMENTED]
│   │
│   ├── 004 ── Digital Receipt Registry [IMPLEMENTED]
│   │   ├── 007 ── Volunteer Treasury Interface (see above)
│   │   ├── 009 ── Tithe Envelope Camera Assistant [NOT IMPLEMENTED]
│   │   └── 022 ── Conference Report Generator (see above)
│   │
│   ├── 006 ── Smart-Swap Duty Rota + Safety Shield [IMPLEMENTED]
│   │   ├── 008 ── Offline Foundation [IMPLEMENTED]
│   │   │   └── 009 ── Tithe Envelope Camera Assistant (see above)
│   │   └── 015 ── Sabbath-Calibrated Timing Engine [IMPLEMENTED]
│   │
│   ├── 010 ── Pathfinder/Adventurer Matrix [IMPLEMENTED]
│   ├── 011 ── Sabbath School Division Dashboard [IMPLEMENTED]
│   ├── 012 ── Community Welfare CRM [IMPLEMENTED]
│   ├── 013 ── Health Ministry Connection Pipeline [IMPLEMENTED]
│   ├── 014 ── Harvest Decision Tracker + Household Mapper [IMPLEMENTED]
│   │   ├── 021 ── Digital Transfer & Reception Desk [IMPLEMENTED]
│   │   └── 022 ── Conference Report Generator (see above)
│   ├── 016 ── Communion Service Planner [IMPLEMENTED]
│   ├── 017 ── Pulpit-to-AV Live-Sync [IMPLEMENTED]
│   └── 023 ── Secure Nominating Vault [IMPLEMENTED]
```

## Status Summary

| Status                          | Count | Issues           |
| ------------------------------- | ----- | ---------------- |
| COMPLETE (gates met)            | 3     | 001, 002, 003    |
| IMPLEMENTED (needs gate review) | 19    | 004–008, 010–023 |
| NOT IMPLEMENTED                 | 1     | 009              |

## Issue Index

| #   | Slug                                       | Title                                        | Status          | Blocked by         |
| --- | ------------------------------------------ | -------------------------------------------- | --------------- | ------------------ |
| 001 | monorepo-auth-foundation                   | Monorepo + Auth Foundation                   | COMPLETE        | —                  |
| 002 | member-self-service-portal                 | Member Self-Service Portal                   | COMPLETE        | 001                |
| 003 | congregation-setup-officer-management      | Congregation Setup & Officer Management      | COMPLETE        | 001, 002           |
| 004 | digital-receipt-registry                   | Digital Receipt Registry                     | IMPLEMENTED     | 001, 002           |
| 005 | boardroom-management-ledger                | Boardroom Management Ledger                  | IMPLEMENTED     | 001, 002, 003      |
| 006 | smart-swap-duty-rota-safety-shield         | Smart-Swap Duty Rota + Safety Shield         | IMPLEMENTED     | 001, 002           |
| 007 | volunteer-treasury-interface-audit-binder  | Volunteer Treasury Interface + Audit Binder  | IMPLEMENTED     | 004, 005           |
| 008 | offline-foundation                         | Offline Foundation                           | IMPLEMENTED     | 002, 004, 006      |
| 009 | tithe-envelope-camera-assistant            | Tithe Envelope Camera Assistant              | NOT IMPLEMENTED | 004, 008           |
| 010 | pathfinder-adventurer-matrix               | Pathfinder/Adventurer Matrix                 | IMPLEMENTED     | 001, 002           |
| 011 | sabbath-school-division-dashboard          | Sabbath School Division Dashboard            | IMPLEMENTED     | 001, 002           |
| 012 | community-welfare-crm                      | Community Welfare CRM                        | IMPLEMENTED     | 001, 002           |
| 013 | health-ministry-connection-pipeline        | Health Ministry Connection Pipeline          | IMPLEMENTED     | 001, 002           |
| 014 | harvest-decision-tracker-household-mapper  | Harvest Decision Tracker + Household Mapper  | IMPLEMENTED     | 001, 002           |
| 015 | sabbath-calibrated-timing-engine           | Sabbath-Calibrated Timing Engine             | IMPLEMENTED     | 001, 006           |
| 016 | communion-service-planner                  | Communion Service Planner                    | IMPLEMENTED     | 001, 002           |
| 017 | pulpit-to-av-live-sync                     | Pulpit-to-AV Live-Sync                       | IMPLEMENTED     | 001, 002           |
| 018 | pastoral-district-hub                      | Pastoral District Hub                        | IMPLEMENTED     | 001, 002, 003      |
| 019 | facility-coordinator-compliance-guardrails | Facility Coordinator + Compliance Guardrails | IMPLEMENTED     | 001, 002, 005      |
| 020 | crisis-resilience-matrix                   | Crisis Resilience Matrix                     | IMPLEMENTED     | 001, 002, 003      |
| 021 | digital-transfer-reception-desk            | Digital Transfer & Reception Desk            | IMPLEMENTED     | 001, 002, 014      |
| 022 | conference-report-generator                | Conference Report Generator                  | IMPLEMENTED     | 004, 005, 011, 014 |
| 023 | secure-nominating-vault                    | Secure Nominating Vault                      | IMPLEMENTED     | 001, 002           |
