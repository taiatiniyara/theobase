# ADR 0006: Photo-Based Giving

## Status

Accepted

## Context

Members need a simple way to self-report their tithes and offerings. The traditional approach is paper envelopes with a written breakdown, which are counted by the treasurer and recorded manually. This is error-prone and creates significant data entry work for the treasurer.

## Decision

Implement a photo-based self-reporting system:

- Members photograph their envelope contents using the PWA
- Photo is stored in Cloudflare R2
- Amount can be auto-extracted from the photo (future) or manually entered by the member
- Treasurer physically counts the envelope and verifies against the photo
- Discrepancies are flagged automatically
- Unnamed envelopes and loose cash are tracked as anonymous offerings

## Alternatives Considered

### Manual entry by treasurer only

- Pros: No self-service needed, simpler member experience
- Cons: High data entry burden on treasurer, more errors, delays

### Full online giving (credit card/bank transfer)

- Pros: No physical cash handling, instant verification
- Cons: Processing fees, not available in all regions, members prefer physical giving, complex integration

### Envelope scanning at the church

- Pros: Centralized, no member device needed
- Cons: Requires scanner hardware, delays, more work for treasurer

## Consequences

### Positive

- Members self-report their own data (matches core product vision)
- Photo serves as self-report and receipt simultaneously
- Treasurer only verifies, reducing manual data entry
- Photo provides visual proof for auditing
- Discrepancies flagged automatically

### Negative

- Requires members to have camera-capable devices
- Photo upload requires network (offline-first needed)
- Amount extraction from photo is manual initially (future: OCR)

## Related Decisions

- ADR 0005: Mobile-First PWA (photo-based giving requires PWA camera access)
- ADR 0004: RBAC with Row-Level Security (members can only see their own giving)
