# Issue 20: Census Self-Confirmation

## What to build

Annual membership census with member self-confirmation — Clerk initiates session, members confirm their details, Clerk only follows up on unconfirmed.

## Input/Output

**Input:** CensusSession (year, church ID), member confirmations (confirmed/updated/unconfirmed/removed status, changes JSON)
**Output:** CensusSession record with progress tracking, CensusConfirmation records per member, auto-generated census report

## Validation Requirements

- CensusSession year must be valid and unique per church per year
- CensusSession requires a church ID
- Confirmation status must be one of: confirmed, updated, unconfirmed, removed
- Changes JSON must be valid and track previous vs new values
- Members can only confirm their own record
- Clerk can confirm on behalf of members (fallback)
- Report must accurately tally: confirmed, updated, unconfirmed, removed
- Data filtered by user's church

## Acceptance Criteria

- [ ] Clerk initiates CensusSession (year, church)
- [ ] System notifies all members (email/in-app)
- [ ] Members confirm details with one tap (or update changes)
- [ ] Confirmation status tracked per member (confirmed/updated/unconfirmed/removed)
- [ ] Clerk dashboard shows progress (85 of 120 confirmed)
- [ ] Clerk follows up on unconfirmed members
- [ ] Census report auto-generates

## Blocked by

- Issue 1, Issue 2, Issue 22 (Communication)

## Docs: `docs/agents/contracts/census-api.md`, `docs/agents/schemas/census.json`
