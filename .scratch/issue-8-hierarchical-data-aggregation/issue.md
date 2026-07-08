# Issue 8: Hierarchical Data Aggregation

## What to build

Implement row-level security and hierarchical data aggregation. Conference Admin can see all churches in their conference, Union Admin can see all conferences, etc. Data flows upward through the hierarchy.

**End-to-end behavior:**

1. Conference Admin logs in
2. System identifies user's organizational scope (Conference)
3. Admin can view aggregated data from all churches in conference
4. Admin can drill down to individual church data
5. Union Admin can see all conferences in union
6. Division Admin can see all unions in division
7. GC Admin can see worldwide data
8. Data is automatically filtered by user's organizational scope

## Input/Output

**Input:**

- User's organizational scope (from session)
- Query parameters (church_id, conference_id, etc.)

**Output:**

- Data filtered by user's organizational scope
- Aggregated data at each level
- Drill-down capability to subordinate units

## Validation Requirements

- User can only access data within their organizational scope
- Conference Admin can see their conference's churches
- Union Admin can see their union's conferences
- Division Admin can see their division's unions
- GC Admin can see worldwide data
- Row-level security must be enforced at database level
- Aggregation must be accurate (sums, counts, averages)

## Acceptance Criteria

- [ ] Conference Admin can view aggregated data from all churches in conference
- [ ] Conference Admin can drill down to individual church data
- [ ] Union Admin can view aggregated data from all conferences in union
- [ ] Division Admin can view aggregated data from all unions in division
- [ ] GC Admin can view worldwide data
- [ ] Data is automatically filtered by user's organizational scope
- [ ] Row-level security is enforced at database level
- [ ] Aggregation is accurate (sums, counts, averages)
- [ ] User cannot access data outside their organizational scope
- [ ] Cross-conference transfers are visible to both source and target conferences during transition
- [ ] Loading state displays while fetching data
- [ ] Error state displays if API call fails

## Blocked by

- Issue 1: Add First Member
- Issue 5: Quarterly Membership Report
- Issue 6: Financial Tracking

## Docs

- `docs/agents/contracts/organizational-api.md` — Organizational Unit API contract
- `docs/agents/schemas/organizational-unit.json` — OrganizationalUnit data model schema
- `docs/adr/0004-rbac-row-level-security.md` — updated: implement row-level security per this ADR
- `CHANGELOG.md` — entry for hierarchical data aggregation feature
