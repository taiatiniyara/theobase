# Issue 3: Edit Member Details

## What to build

Church Clerk can edit a member's details through a form with inline validation. Changes are saved to the database with an audit log entry.

**End-to-end behavior:**

1. Church Clerk navigates to member detail page (from list)
2. Clicks "Edit" button
3. Edit form loads with current member data
4. Clerk modifies fields (name, email, phone, baptism date)
5. Form validates changes inline (on blur)
6. Clerk submits form
7. System validates all fields, updates Person record
8. Audit log records who changed what and when
9. Clerk sees success message and updated member data

## Input/Output

**Input:**

- Person ID: UUID
- Updated fields: given_name, family_name, email, phone, baptism_date (any subset)

**Output:**

- Updated Person record
- Audit log entry
- Success confirmation

## Validation Requirements

- Person ID must exist and belong to user's church
- Email format validation
- Email must be unique within church (excluding current person)
- Baptism date must be valid date format
- At least one field must be changed
- Audit log must record old and new values

## Acceptance Criteria

- [ ] Member detail page displays all member information
- [ ] "Edit" button navigates to edit form
- [ ] Edit form pre-fills with current member data
- [ ] Form validates required fields before submission
- [ ] Form validates email format
- [ ] Form validates baptism date format
- [ ] Form prevents duplicate emails (within church)
- [ ] Submitting form updates Person record in database
- [ ] Audit log records the change (who, what, when, old/new values)
- [ ] Success message displays after successful update
- [ ] Error message displays if validation fails
- [ ] Cancel button returns to member detail without saving
- [ ] Data is filtered by user's church (cannot edit other churches' members)

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/person-api.md` — update with PUT /api/persons/:id endpoint
- `docs/agents/schemas/audit-log.json` — AuditLog data model schema
- `CHANGELOG.md` — entry for member edit feature
