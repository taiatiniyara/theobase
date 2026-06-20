# Congregation type discriminator

## Status: Accepted

Local Churches, Companies, and Branch Sabbath Schools are modeled as a single
`congregation` table with a `type` column (`'church' | 'company' | 'branch'`)
and a self-referencing `parent_id` for hierarchy. No separate tables per type.

**Why:** In SDA polity, a Branch can graduate into a Company, and a Company into
a Local Church. Separate tables would require membership migration on every
status change. Additionally, almost every feature (giving, rosters, board
minutes, Sabbath School, Pathfinders) operates identically across all three
types — they all have members, leaders, departments, and finances. A single
table means every feature query uses `congregation_id` uniformly.

**Consequences:** Application-level logic gates features unavailable to
Companies (e.g., no elder ordination tracking, no full board governance) rather
than database-enforced constraints. The `parent_id` self-reference can point to
another Congregation (Branch → Company or Branch → Local Church) or an
Organization (Company → Conference).

**Rejected:** Three separate tables (migration pain on status change, duplicate
schema for identical features).
