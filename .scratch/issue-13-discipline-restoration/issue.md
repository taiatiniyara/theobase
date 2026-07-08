# Issue 13: Membership Discipline and Restoration

## What to build

Track member removals (disfellowship, resignation, death) and restoration process.

## Input/Output

**Input:** Person ID, removal type (disfellowship/resignation/death), reason, date, vote result, restoration date
**Output:** MembershipRemoval record, Restoration record (if applicable)

## Validation Requirements

- Person ID must exist and belong to user's church
- Removal type must be one of: disfellowship, resignation, death
- Disfellowship requires business meeting date and vote result
- Death requires date of death
- Restoration requires removal to already exist
- Restoration date must be after removal date
- Audit log must record all status changes

## Acceptance Criteria

- [ ] Clerk records disfellowship with reason, business meeting date, vote result
- [ ] Clerk records resignation with reason
- [ ] Clerk records death with date
- [ ] Restoration process tracked (request, completion, approval)
- [ ] Removal updates Person membership status
- [ ] Audit log entries for all changes

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/removal-api.md`
- `docs/agents/schemas/removal.json`, `restoration.json`
- `CHANGELOG.md`
