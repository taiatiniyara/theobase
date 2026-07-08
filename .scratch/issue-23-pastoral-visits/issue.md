# Issue 23: Pastoral Visit Tracking

## What to build

Track pastoral visits — who was visited, by whom, when, purpose, and follow-up needs.

## Input/Output

**Input:** Person visited (Person ID), pastor (Person ID), visit date, purpose, notes, follow-up status
**Output:** PastoralVisit record, visit history per person, follow-up tracking

## Validation Requirements

- Person visited must exist and belong to the church
- Pastor must be a church officer or pastor assigned to the church
- Visit date must be valid and not in the future
- Purpose is a free-text field (max 500 chars)
- Notes are free-text (max 2000 chars)
- Data filtered by pastor's church scope

## Acceptance Criteria

- [ ] Pastor records visit (person visited, date, purpose, notes)
- [ ] Follow-up status tracked (needed/completed)
- [ ] Visit history viewable per person
- [ ] Data filtered by pastor's church

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/pastoral-api.md`, `docs/agents/schemas/pastoral-visit.json`
