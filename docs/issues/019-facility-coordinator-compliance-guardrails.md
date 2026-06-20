# 019 — Facility Coordinator + Policy Compliance Guardrails

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A facility reservation engine for church hall bookings that runs an integrated safety and policy questionnaire before sending a booking to the board. Simultaneously, build the Policy Compliance Guardrails — Church Manual and Working Policy rule checks that flag violations automatically: quorum not met for a vote, missing audit trail for an expense, membership discipline process not documented.

## Acceptance criteria

### Facility Coordinator
- [ ] Drizzle schema: `facility_booking` (congregation_id, date, time_start, time_end, purpose, requester_id, external_group_name, attendees_count, status), `booking_policy_check` (booking_id, question, answer, passed)
- [ ] Hono endpoint `POST /facilities/bookings` — submit booking request; runs policy questionnaire
- [ ] Hono endpoint `GET /facilities/bookings` — list bookings by date range
- [ ] Hono endpoint `POST /facilities/bookings/:id/board-review` — send to board for approval (links to board meeting)
- [ ] Policy questionnaire: configurable questions (Is the group SDA-affiliated? Will minors be present? Are safety clearances current? Is alcohol prohibited? Does the booking align with Church Manual Section X?)
- [ ] Booking conflict detection: no double-booking same venue/time

### Policy Compliance Guardrails
- [ ] Guardrail rules engine: configurable JSON rules keyed to Church Manual sections
- [ ] Board meeting quorum check: before recording a vote, verify attendees >= quorum threshold
- [ ] Audit trail check: expense without linked receipt + board decision triggers warning
- [ ] Membership discipline check: discipline case without documented steps triggers warning
- [ ] Safety clearance check: youth volunteer without valid clearance triggers block (extends Slice 006)
- [ ] Compliance dashboard: clerk sees list of current warnings with severity (info, warning, blocking)
- [ ] Test: book facility → questionnaire fails safety question → booking blocked until resolved → resent passes → board approves
- [ ] Test: board vote without quorum → guardrail flags → vote blocked
- [ ] Test: expense without receipt link → guardrail warning on audit view

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
- 005 — Boardroom Management Ledger
