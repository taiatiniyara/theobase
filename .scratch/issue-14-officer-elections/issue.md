# Issue 14: Officer Elections

## What to build

Track officer elections — nominating committee, slate proposal, business meeting vote, term tracking.

## Input/Output

**Input:** Election year, nominating committee members (Person IDs), proposed slate (office + Person ID pairs), business meeting date, vote result
**Output:** Election record, Office assignment records with term dates, office history preserved

## Validation Requirements

- Nominating committee members must belong to the church
- Each office can have only one active office-holder at a time
- Term start date must be after election date
- Term start/end dates must be valid
- Office history is append-only (past terms preserved)
- Data filtered by user's church

## Acceptance Criteria

- [ ] Clerk creates Election with year and nominating committee members
- [ ] Nominating committee proposes slate of officers
- [ ] Slate presented at business meeting and voted on
- [ ] Elected officers tracked with term start/end dates
- [ ] Office history preserved (past terms for each person)

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/election-api.md`, `docs/agents/schemas/election.json`
