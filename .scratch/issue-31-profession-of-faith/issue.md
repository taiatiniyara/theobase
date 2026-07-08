# Issue 31: Profession of Faith

## What to build

Record professions of faith — members joining the church without rebaptism (previously baptized in another denomination).

## Input/Output

**Input:** Person ID, profession date, officiant (Person ID), previous baptism denomination, membership vows accepted (boolean), church ID
**Output:** ProfessionOfFaith record, updated Person membership status with profession date

## Validation Requirements

- Person ID must exist and not already be a baptized member
- Profession date must be valid and not in the future
- Officiant must be a church officer
- Previous baptism denomination is required
- Membership vows accepted must be true
- Data filtered by user's church

## Acceptance Criteria

- [ ] Record profession of faith: person, date, officiant, previous baptism denomination
- [ ] Membership vows accepted flag
- [ ] Updates Person membership status
- [ ] Appears in quarterly membership report as "professions of faith"

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/profession-api.md`, `docs/agents/schemas/profession-of-faith.json`, `CHANGELOG.md`
