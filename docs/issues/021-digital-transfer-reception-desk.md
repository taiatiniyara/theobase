# 021 — Digital Transfer & Reception Desk

## What to build

A secure, traceable workflow for membership transfers between congregations. A clerk requests a letter of transfer for a departing member, the receiving clerk accepts, and the member record automatically migrates upon confirmation. Replaces postal mail and unsecured email with a digital audit trail.

## Acceptance criteria

- [ ] Drizzle schema: `transfer_request` (member_id, from_congregation_id, to_congregation_id, status: requested → approved_by_sending → received_by_destination → completed, requested_by, approved_by, received_by, dates for each stage)
- [ ] Hono endpoint `POST /transfers` — clerk requests transfer for a member
- [ ] Hono endpoint `GET /transfers/outgoing` — list outgoing transfers (sending congregation)
- [ ] Hono endpoint `GET /transfers/incoming` — list incoming transfers (receiving congregation)
- [ ] Hono endpoint `POST /transfers/:id/approve` — sending clerk approves (releases member)
- [ ] Hono endpoint `POST /transfers/:id/receive` — receiving clerk accepts (member record migrates)
- [ ] Member status: during transfer, member marked as `transferring`; after reception, `congregation_id` updates to new congregation
- [ ] Notification: email to receiving clerk when transfer is approved by sender
- [ ] Audit trail: every status change logged with timestamp and actor
- [ ] Test: send transfer → approve → receive → member appears in new congregation's roll → old congregation shows member as transferred
- [ ] Test: receiving clerk rejects transfer → member stays in original congregation
- [ ] Test: clerk cannot transfer a member to a congregation outside their organization unless specified

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
- 014 — Harvest Decision Tracker + Household Mapper
