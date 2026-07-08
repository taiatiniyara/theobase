# Issue 11: Baptism Class Management

## What to build

Church Clerk can manage baptism preparation classes — create classes, assign instructors, enroll participants, track attendance, and mark completions.

**End-to-end behavior:**

1. Clerk creates BaptismClass (name, start/end dates, instructor)
2. Clerk enrolls participants (People preparing for baptism)
3. Instructor records attendance for each lesson
4. Clerk tracks completion status per participant
5. Completed participants are ready for BaptismEvent

## Input/Output

**Input:** Class name, dates, instructor_id, participant_ids
**Output:** BaptismClass record, participant enrollment, attendance tracking

## Validation Requirements

- Instructor must be a church member
- Participants must belong to the church
- Attendance must be recorded per participant per lesson
- Completion status changes only when all lessons attended

## Acceptance Criteria

- [ ] Clerk can create a baptism class with name, dates, instructor
- [ ] Clerk can enroll participants
- [ ] Instructor can record attendance per participant per lesson
- [ ] System tracks completion status
- [ ] Completed participants are flagged as ready for baptism
- [ ] Data filtered by user's church

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/baptism-class-api.md`
- `docs/agents/schemas/baptism-class.json`, `baptism-event.json`
- `CHANGELOG.md`
