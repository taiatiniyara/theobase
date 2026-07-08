# Issue 7: Ministry Participation

## What to build

Church Clerk can manage ministries within the church and assign members to participate in ministries. Each ministry has a director and members.

**End-to-end behavior:**

1. Church Clerk navigates to "Ministries" page
2. System displays list of ministries (Sabbath School, Youth, Personal Ministries, etc.)
3. Clerk can create a new ministry (name, type, director)
4. Clerk can view ministry details (director, members, activities)
5. Clerk can add members to a ministry
6. Clerk can remove members from a ministry
7. Clerk can assign a director to a ministry
8. Ministry participation is tracked per member

## Input/Output

**Input:**

- Ministry data: name, type, director_id (optional)
- Member assignment: ministry_id, person_id
- Member removal: ministry_id, person_id

**Output:**

- Ministry record created/updated
- Member assigned to ministry
- Member removed from ministry
- Ministry details with director and members

## Validation Requirements

- Ministry name must be unique within church
- Ministry type must be valid (Sabbath School, Youth, Personal Ministries, etc.)
- Director must be a member of the church
- Member must belong to the church
- User must have appropriate role to manage ministries

## Acceptance Criteria

- [ ] Ministries page displays list of ministries
- [ ] Clerk can create a new ministry (name, type, director)
- [ ] Ministry is saved to database
- [ ] Clerk can view ministry details (director, members)
- [ ] Clerk can add members to a ministry
- [ ] Member is assigned to ministry in database
- [ ] Clerk can remove members from a ministry
- [ ] Member is removed from ministry in database
- [ ] Clerk can assign a director to a ministry
- [ ] Director is a member of the church
- [ ] Ministry data is filtered by user's church
- [ ] Loading state displays while fetching data
- [ ] Error state displays if API call fails

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/ministry-api.md` — Ministry API contract
- `docs/agents/schemas/ministry.json` — Ministry data model schema
- `CHANGELOG.md` — entry for ministry management feature
