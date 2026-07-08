# ADR 0008: Combined Offering Plan (COP) Distribution

## Status

Accepted

## Context

The SDA church uses a Combined Offering Plan (COP) where all offerings are pooled and distributed according to a voted formula. The distribution supports all levels: local church (50-60%), General Conference world mission (20%), and Conference/Union/Division (remainder). Churches that do not use COP have separate offering categories for each level.

When the treasurer records the WeeklyFinancialSummary, the system must also calculate and display the distribution.

## Decision

Implement an auto-calculated offering distribution based on the COP formula:

- System applies the division's voted formula to weekly totals
- Local church portion stays visible in church records
- Conference portion is calculated for reporting
- GC world mission portion (20%) is calculated
- The formula is configurable per division (can be updated by GC Admin)

## Alternatives Considered

### Manual calculation by treasurer

- Pros: No system complexity, treasurer has full control
- Cons: Error-prone, time-consuming, inconsistent across churches, no audit trail

### Fixed formula hardcoded for all divisions

- Pros: Simple to implement, no configuration needed
- Cons: COP formula varies by Division (e.g., South American Division uses 60% local, some use 50%), doesn't accommodate churches using alternative giving plans (Personal Giving Plan, Calendar of Offerings)

### Treasurer enters distribution manually

- Pros: Flexible for any formula, simple UI
- Cons: Duplicates effort, errors in calculation, no consistency across churches

## Key Implementation Details

- COP formula stored as a configuration value per Division
- WeeklyFinancialSummary includes distribution breakdown JSON
- Conference can view aggregated distribution from all churches
- Manual overrides allowed for churches not using COP (separate categories)

## Consequences

### Positive

- Consistent application of COP formula across all churches
- Reduced manual calculation errors
- Transparent distribution tracking
- Conference can see distribution status for all churches
- Audit trail of distribution calculations

### Negative

- COP formula varies by Division (needs configurable per division)
- Some churches may use different offering plans (Personal Giving Plan, Calendar of Offerings)
- Manual overrides add complexity

## Related Decisions

- ADR 0001: Hierarchical Organizational Model (distribution flows up the hierarchy)
