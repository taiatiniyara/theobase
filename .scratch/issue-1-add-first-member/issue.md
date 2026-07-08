# Issue 1: Add First Member

## What to build

End-to-end flow for adding the first church member. Church Clerk logs in, fills out a simple form with member details (name, contact info, baptism date), and the member is saved to the database. This is the tracer bullet — the thinnest vertical slice through all layers.

**End-to-end behavior:**

1. Church Clerk navigates to login page
2. Enters email/password credentials
3. System authenticates and creates session
4. Clerk navigates to "Add Member" page
5. Fills out form: name, email, phone, baptism date
6. Submits form
7. System validates input, creates Person record, links to Church
8. Clerk sees success message and member appears in database

## Input/Output

**Input:**

- Email, password (for login)
- Person data: given_name, family_name, email, phone, baptism_date

**Output:**

- Authentication token/session
- Person record created in database
- Success confirmation to user

## Validation Requirements

- Email format validation
- Required fields: given_name, family_name
- Baptism date must be valid date format
- Email must be unique within church
- Authentication must verify credentials before allowing member creation

## Acceptance Criteria

- [ ] Church Clerk can log in with valid credentials
- [ ] Church Clerk cannot log in with invalid credentials
- [ ] Church Clerk can access "Add Member" page after login
- [ ] Form validates required fields before submission
- [ ] Form validates email format
- [ ] Form validates baptism date format
- [ ] Member is saved to database with all provided data
- [ ] Member is linked to the Church Clerk's church
- [ ] Success message displays after successful creation
- [ ] Error message displays if validation fails
- [ ] Error message displays if email already exists

## Blocked by

None - can start immediately

## Docs

- `docs/agents/contracts/auth-api.md` — authentication API contract
- `docs/agents/contracts/person-api.md` — person CRUD API contract
- `docs/agents/schemas/person.json` — Person data model schema
- `docs/agents/schemas/user.json` — SystemUser data model schema
- `CHANGELOG.md` — entry for initial member management feature
- `README.md` — update with setup instructions for running the app
