# ADR 0002: Deferred Institutions

## Status

Accepted

## Context

The SDA Church operates 7,500+ schools, 229 hospitals, publishing houses, and media centers worldwide. These institutions:

- Are part of the organizational structure
- Have different reporting requirements per type
- Require different data models (school enrollment vs. hospital patient counts)
- Add significant complexity to the initial system

## Decision

Defer institution modeling to a later phase. The initial system will focus on:

- Person (member) management
- Church organizational structure
- Membership, financial, and ministry reporting
- Hierarchical data aggregation

Institutions will be added in a subsequent phase once the core system is stable.

## Alternatives Considered

### Include institutions from the start

- Pros: Complete system from day one, no need for schema migrations later
- Cons: Significantly increases initial complexity, delays core functionality, requires modeling multiple institution types with different data models

### Model institutions as a generic "Organization" entity

- Pros: Flexible, can handle any type of organization
- Cons: Doesn't capture institution-specific requirements, still adds complexity, may need refactoring when institution-specific features are added

## Consequences

### Positive

- Simpler initial system, faster time to value
- Core functionality (membership, reporting) can be delivered sooner
- Institution requirements can be refined based on actual usage patterns
- No need to design complex institution-specific data models upfront

### Negative

- Will require schema changes to add institutions later
- Institutions cannot be tracked in the initial system
- May need to migrate data when institutions are added

## Related Decisions

- ADR 0001: Hierarchical Organizational Model
- ADR 0003: Authentication Approach
