# 003 — Congregation Setup & Officer Management

## What to build

A clerk can register their congregation, configure basic details (name, address, conference, time zone, bank account), import a member roll from CSV, and invite officers via email. Sets up the role-based permission framework.

## Acceptance criteria

- [x] Hono endpoint `POST /congregations` — creates congregation with type discriminator
- [x] Hono endpoint `GET /congregations/:id` — returns congregation details (clerk-scoped)
- [x] Hono endpoint `PATCH /congregations/:id` — updates details
- [x] CSV import: parse member roll template, create `person` + `member` rows, return validation errors
- [x] Officer invitation: clerk enters email + role → magic link sent → invitee logs in → role assigned
- [x] Drizzle schema: `role` table linking `person_id` to `congregation_id` with role type enum (clerk, treasurer, elder, deacon, deaconess, department_leader, pastor, district_pastor)
- [x] Permission middleware: scopes endpoints by role (clerk can manage members, treasurer can manage finances, etc.)
- [x] Test: clerk creates congregation, imports CSV, invites treasurer
- [x] Test: invited treasurer logs in and has treasurer-scoped access
- [x] Test: non-clerk cannot modify congregation details

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
