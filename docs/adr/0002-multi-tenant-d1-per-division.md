# Multi-tenant D1 per world division

## Status: Accepted

A single D1 database per SDA world division, with all congregations in that
division sharing one database. Row-level security via `congregation_id` on every
multi-tenant table. Each division's D1 is physically placed in the nearest
Cloudflare region.

**Why:** The proposal requires per-region data hosting for GDPR and equivalent
regulations. A single global D1 would violate this. Per-church D1s would make
the Pastoral District Hub (cross-church dashboards) and Conference Report
Generator (cross-church aggregation) prohibitively complex, requiring federated
queries across hundreds of databases.

**Consequences:** Every Drizzle query must include `WHERE congregation_id = ?`.
The auth middleware extracts the `congregation_id` from the session and exposes
it via `c.get("congregationId")` — each route handler is responsible for
applying the filter on every query. Cross-division queries (rare: District
Pastors don't cross division boundaries) require explicit opt-in at the
application layer.

**Rejected:** Per-church D1 (too many databases for district/conference
features) and single global D1 (violates regional data sovereignty).
