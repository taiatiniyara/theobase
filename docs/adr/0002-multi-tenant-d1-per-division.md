# Multi-tenant D1 per world division

A single D1 database per SDA world division, with all congregations in that
division sharing one database. Row-level security via `church_id` on every
table. Each division's D1 is physically placed in the nearest Cloudflare region.

**Why:** The proposal requires per-region data hosting for GDPR and equivalent
regulations. A single global D1 would violate this. Per-church D1s would make
the Pastoral District Hub (cross-church dashboards) and Conference Report
Generator (cross-church aggregation) prohibitively complex, requiring federated
queries across hundreds of databases.

**Consequences:** Every Drizzle query must include `WHERE church_id = ?`. A
missing clause is a data leak. The middleware layer enforces this by extracting
the `church_id` from the auth session and injecting it automatically — no raw
query can run without it. Cross-division queries (rare: District Pastors don't
cross division boundaries) require explicit opt-in at the application layer.

**Rejected:** Per-church D1 (too many databases for district/conference
features) and single global D1 (violates regional data sovereignty).
