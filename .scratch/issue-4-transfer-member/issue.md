# Issue 4: Transfer Member Between Churches

## What to build

Church Clerk can initiate a member transfer to another church. The system records the transfer, updates the member's church affiliation, and creates audit log entries at both source and target churches.

**End-to-end behavior:**

1. Church Clerk navigates to member detail page
2. Clicks "Transfer" button
3. System displays transfer form with church selector
4. Clerk selects target church (must be in same Conference)
5. Clerk enters transfer reason (optional)
6. System validates target church exists and is in same Conference
7. System updates Person's church_id to target church
8. System creates audit log entries at both source and target churches
9. System creates Transfer record with date, reason, source/target churches
10. Clerk sees success message

## Input/Output

**Input:**

- Person ID: UUID
- Target Church ID: UUID
- Transfer reason: string (optional)

**Output:**

- Updated Person record (new church_id)
- Transfer record created
- Audit log entries at source and target churches
- Success confirmation

## Validation Requirements

- Person ID must exist and belong to user's church
- Target Church ID must exist
- Target Church must be in same Conference as source church
- Transfer reason must be at most 500 characters
- Person cannot be transferred to their current church
- Audit log must record transfer details

## Acceptance Criteria

- [ ] "Transfer" button appears on member detail page
- [ ] Transfer form displays church selector
- [ ] Church selector shows only churches in same Conference
- [ ] Form validates target church is selected
- [ ] Form validates target church is different from current church
- [ ] Submitting form updates Person's church_id
- [ ] Transfer record is created with date, reason, source/target churches
- [ ] Audit log entry created at source church
- [ ] Audit log entry created at target church
- [ ] Success message displays after successful transfer
- [ ] Error message displays if validation fails
- [ ] Error message displays if target church not in same Conference
- [ ] Data is filtered by user's church (cannot transfer other churches' members)

## Blocked by

- Issue 2: View Member List
- Issue 3: Edit Member Details

## Docs

- `docs/agents/contracts/person-api.md` — update with POST /api/persons/:id/transfer endpoint
- `docs/agents/schemas/transfer.json` — Transfer data model schema
- `docs/agents/contracts/transfer-api.md` — Transfer API contract
- `CHANGELOG.md` — entry for member transfer feature
