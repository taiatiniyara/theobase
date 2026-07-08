# Issue 15: Meeting Management

## What to build

Track all church meetings — business meetings, board meetings, ministry meetings, special committees. Minutes stored as file attachments.

## Input/Output

**Input:** Meeting type, date, church ID, presiding officer (Person ID), attendee IDs, agenda items, decisions (text + vote result), minutes file upload
**Output:** Meeting record with agenda, decisions, minutes attachment (R2), meeting history

## Validation Requirements

- Meeting type must be one of: business, board, ministry, committee
- Date must be a valid date
- Presiding officer must belong to the church
- Attendees must belong to the church
- Minutes file must be valid format (PDF, DOCX, MD)
- Decisions must have text (required field)
- Recurring meetings generate future instances automatically
- Data filtered by user's church

## Acceptance Criteria

- [ ] Clerk creates meeting with type, date, presiding officer, attendees
- [ ] Agenda items tracked
- [ ] Decisions recorded with vote results
- [ ] Minutes uploaded as file attachment (R2)
- [ ] Recurring meetings supported
- [ ] Meeting history viewable by type

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/meeting-api.md`, `docs/agents/schemas/meeting.json`
