# 016 — Communion Service Planner

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A structural planning tool for the quarterly Ordinance of Humility. Maps venue splits (men's room, women's room), tracks towel and basin inventories, manages bread and wine preparation quantities, and allocates volunteer teams for each room. Designed to replace verbal coordination and the memory of older deacons/deaconesses.

## Acceptance criteria

- [ ] Drizzle schema: `communion_service` (date, congregation_id, status), `communion_room` (service_id, name, gender, volunteer_ids JSON), `communion_inventory` (service_id, item: towel, basin, bread, wine, quantity, unit)
- [ ] Hono endpoint `POST /communion` — plan a service with rooms, volunteers, inventory
- [ ] Hono endpoint `GET /communion/:id` — full service plan
- [ ] Hono endpoint `PATCH /communion/:id/rooms/:roomId` — update volunteer assignments
- [ ] Inventory reconciliation: after service, record actual usage vs. planned quantity
- [ ] Template: load previous communion plan as starting point for next quarter
- [ ] Test: plan communion → assign deacons to rooms → set inventory → reconcile after service → next quarter loads template

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
