# Issue 21: Guest Tracking and Follow-up

## What to build

Track visitors and guests — capture contact info, interests, follow-up contacts, and progression to membership.

## Input/Output

**Input:** Guest name, contact info (phone, email), interests, visit date, follow-up contact dates and notes, status progression
**Output:** GuestRecord with pipeline status, follow-up contact history, conversion to Person record when baptized/joined

## Validation Requirements

- Name and at least one contact method (phone or email) required
- Visit date must be valid and not in the future
- Status must follow progression: new → contacted → attending-regularly → in-baptism-class → baptized → joined
- Each status change requires explicit action (no automatic progression)
- Conversion to Person creates both records with cross-reference
- Data filtered by user's church

## Acceptance Criteria

- [ ] Host/hostess captures guest info (name, contact, interests, visit date)
- [ ] Guest assigned to Personal Ministries leader for follow-up
- [ ] Follow-up contacts tracked (dates, notes, who followed up)
- [ ] Guest status progression (new → contacted → attending → in-class → baptized)
- [ ] Guest converts to Person when baptized/joined

## Blocked by

- Issue 1, Issue 11 (Baptism Classes)

## Docs: `docs/agents/contracts/guest-api.md`, `docs/agents/schemas/guest.json`
