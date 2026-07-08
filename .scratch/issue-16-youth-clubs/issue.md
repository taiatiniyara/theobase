# Issue 16: Youth Club Management

## What to build

Manage Pathfinder and Adventurer clubs — track members, class progression, and camporee attendance.

## Input/Output

**Input:** Club name, type (Pathfinder/Adventurer), director (Person ID), counselors (Person IDs), members with join dates and class levels, class completions, camporees
**Output:** YouthClub record, YouthMember records, ClassCompletion records (Friend → Guide), Camporee attendance records

## Validation Requirements

- Club type must be Pathfinder or Adventurer
- Director must belong to the church
- Members must belong to the church
- Class levels must follow progression order: Friend → Companion → Explorer → Ranger → Voyager → Guide
- Class completion date must be after member join date
- Camporee date must be valid
- Data filtered by user's church

## Acceptance Criteria

- [ ] Clerk creates YouthClub (name, type, director, counselors)
- [ ] YouthMembers enrolled with join date and current class level
- [ ] ClassCompletion records progression (Friend → Companion → Explorer → Ranger → Voyager → Guide)
- [ ] Camporee attendance tracked
- [ ] Club statistics viewable (member count by class level)

## Blocked by

- Issue 1, Issue 7 (Ministry Participation)

## Docs: `docs/agents/contracts/youth-club-api.md`, `docs/agents/schemas/youth-club.json`
