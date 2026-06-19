# 012 — Community Welfare CRM

## What to build

A confidential, privacy-first portal for the Dorcas / Community Welfare department. Track welfare assistance cases (food, financial aid, clothing), manage pantry inventory, and maintain assistance histories. Strict confidentiality controls — only authorized Dorcas officers can access case data.

## Acceptance criteria

- [ ] Drizzle schema: `welfare_case` (household_id, assistance_type, amount_or_items, date, notes, created_by, congregation_id), `pantry_item` (name, quantity, unit, last_restocked, congregation_id), `pantry_transaction` (item_id, quantity_change, type, date, case_id)
- [ ] Hono endpoint `POST /welfare/cases` — create assistance case (confidential)
- [ ] Hono endpoint `GET /welfare/cases` — list cases for congregation (Dorcas officers only)
- [ ] Hono endpoint `GET /welfare/cases/:id` — full case with assistance history
- [ ] Hono endpoint `GET /welfare/pantry` — current inventory
- [ ] Hono endpoint `POST /welfare/pantry/transaction` — record stock in/out, auto-link to case if tied
- [ ] WelfareDO: one DO per congregation, multiplexes WebSocket channel `welfare` for real-time inventory updates
- [ ] Confidentiality test: non-Dorcas officer (elder, department leader) gets 403 on welfare endpoints
- [ ] Confidentiality test: Dorcas officer sees only their congregation's cases
- [ ] Test: create case → issue pantry items → inventory decreases → case history shows items

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
