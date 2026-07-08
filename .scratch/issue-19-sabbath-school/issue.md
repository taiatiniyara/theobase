# Issue 19: Sabbath School Management

## What to build

Manage Sabbath School classes — create classes by age group, assign teachers, record weekly attendance, track visitors, produce quarterly report.

## Input/Output

**Input:** Class name, age group, teacher (Person ID), student IDs, weekly attendance count (members + visitors), lessons studied count, decisions for Christ count
**Output:** SabbathSchoolClass record, weekly attendance records, quarterly report auto-generated

## Validation Requirements

- Teacher must belong to the church
- Age group must be valid (Cradle Roll, Kindergarten, Primary, Junior, Earliteen, Youth, Adult)
- Attendance count must be non-negative
- Visitors and members counted separately
- Data filtered by user's church

## Acceptance Criteria

- [ ] Clerk creates SabbathSchoolClass (name, age group, teacher)
- [ ] Teacher records weekly attendance per class
- [ ] Visitors counted separately from members
- [ ] Quarterly report auto-generated (attendance, lessons studied, decisions)
- [ ] Data filtered by user's church

## Blocked by

- Issue 1: Add First Member

## Docs: `docs/agents/contracts/sabbath-school-api.md`, `docs/agents/schemas/sabbath-school.json`
