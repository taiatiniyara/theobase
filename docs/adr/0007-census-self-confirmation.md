# ADR 0007: Census Self-Confirmation

## Status

Accepted

## Context

SDA churches conduct an annual census to verify membership. The traditional approach is the Church Clerk manually reviewing the membership roll, contacting members individually, and tracking responses. This creates significant work for the clerk and delays the process.

## Decision

Implement a self-confirmation model:

- Church Clerk initiates a CensusSession
- System notifies all members via email/in-app notification
- Members log in and confirm their details with one tap (or update if changed)
- System tracks confirmations and flags unconfirmed members
- Clerk only follows up on exceptions (unconfirmed members)
- Census report auto-generates from confirmed data

## Alternatives Considered

### Clerk-only verification

- Pros: No member interaction needed, clerk has full control
- Cons: High workload on clerk, delays, members may miss changes they need to report

### Church board verification

- Pros: Shared workload across board members
- Cons: Still manual, coordination overhead, slower

### Automated-only (no clerk involvement)

- Pros: Fully automated, no manual work
- Cons: No human oversight, may miss members who moved, died, or left without notice

## Consequences

### Positive

- Reduces Church Clerk workload significantly (only follows up on unconfirmed)
- Members can update their own information (address, phone, email, family)
- Faster census process
- More accurate data (members are best source of their own details)
- Audit trail of confirmations for compliance

### Negative

- Requires members to log in and take action
- Some members may not have devices or internet access
- Need fallback process for members who cannot self-confirm
- Reminder system adds complexity

## Related Decisions

- ADR 0005: Mobile-First PWA (members need mobile access)
- ADR 0003: Authentication Approach (members need easy login)
