# ADR 0001: Hierarchical Organizational Model

## Status

Accepted

## Context

The SDA Church has a well-defined hierarchical structure: Local Church → Conference → Union → Division → General Conference. This structure is:

- Hard to reverse (changing it would require reorganizing the entire church)
- Surprising without context (why not flat? why not graph-based?)
- The result of a real trade-off (hierarchy vs. flexibility)

## Decision

Model the organizational structure as a strict hierarchy with fixed levels:

- Local Church (leaf node)
- Conference/Mission (parent of Churches)
- Union (parent of Conferences)
- Division (parent of Unions)
- General Conference (root, parent of Divisions)

Each entity has exactly one parent (except General Conference which is the root). Data flows upward through this hierarchy for aggregation and reporting.

## Alternatives Considered

### Flat organization with tags

- Pros: More flexible, easier to model edge cases
- Cons: Doesn't match church polity, aggregation queries become complex, harder to enforce data isolation

### Graph-based organization

- Pros: Can model complex relationships (e.g., a Church reporting to multiple Conferences for different purposes)
- Cons: Overly complex for this domain, doesn't match actual church structure, harder to reason about permissions

### Self-referential hierarchy (single table with parent_id)

- Pros: Simpler schema, easier to add levels
- Cons: Harder to enforce level-specific rules, queries become recursive and slow, doesn't match the fixed 5-level structure

## Consequences

### Positive

- Matches actual church polity (per Church Manual)
- Simple data model with clear ownership
- Easy to implement row-level security (filter by organizational path)
- Aggregation queries are straightforward (roll up from children)
- Permissions map cleanly to hierarchy (Conference Admin sees their Conference's Churches)

### Negative

- Cannot model edge cases (e.g., a Church that temporarily reports to a different Conference)
- Adding a new organizational level requires schema changes
- Institutions (schools, hospitals) are deferred — they don't fit cleanly into this hierarchy

## Related Decisions

- ADR 0002: Deferred Institutions
- ADR 0003: Authentication Approach
- ADR 0004: RBAC with Row-Level Security
