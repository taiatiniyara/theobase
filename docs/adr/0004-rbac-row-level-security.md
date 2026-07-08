# ADR 0004: RBAC with Row-Level Security

## Status

Accepted

## Context

The system has users at multiple organizational levels (Church, Conference, Union, Division, General Conference) with different permissions. Each user should only see data relevant to their role and organizational scope. For example:

- Church Clerk sees only their Church's data
- Conference Admin sees all Churches in their Conference
- Union Admin sees all Conferences in their Union
- Data must be isolated between sibling organizations (one Conference cannot see another's data)

## Decision

Implement role-based access control (RBAC) with row-level security:

- **Roles**: Church Clerk, Treasurer, Conference Admin, Union Admin, Division Admin, GC Admin, Pastor, Member
- **Permissions**: role-based (e.g., Church Clerk can edit membership, Conference Admin can approve reports)
- **Row-level security**: queries automatically filtered by organizational hierarchy
- **Data inheritance**: higher levels automatically see subordinate data (Union Admin sees all Conferences in their Union)
- **Logical multi-tenancy**: all data in one database, but queries filtered by organizational path

## Alternatives Considered

### Separate databases per tenant

- Pros: Complete data isolation, easier to comply with data residency requirements
- Cons: Complex to manage, expensive, difficult to aggregate data across tenants, hard to implement cross-conference transfers

### Application-level filtering only

- Pros: Simpler to implement initially
- Cons: Security relies on application code (easy to miss a filter), no database-level protection, harder to audit

### Graph-based permissions

- Pros: Flexible, can model complex permission scenarios
- Cons: Overly complex for this domain, harder to reason about, slower queries

## Consequences

### Positive

- Clear permission model that maps to church organizational structure
- Database-level security (row-level security) prevents accidental data leaks
- Easy to audit (who has access to what)
- Scalable (adding new roles or organizational levels is straightforward)
- Logical multi-tenancy reduces infrastructure complexity

### Negative

- Row-level security requires careful implementation (can't miss a filter)
- Complex permission matrix to maintain
- Cross-conference transfers require temporary dual-access
- Performance impact from row-level security filters on large datasets

## Related Decisions

- ADR 0001: Hierarchical Organizational Model
- ADR 0003: Authentication Approach
