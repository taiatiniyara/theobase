# 006 — Smart-Swap Duty Rota + Volunteer Safety Shield

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A rota coordinator assigns platform duty slots (elder of the day, preacher, deacon, musician, AV operator) to volunteers on a weekly calendar. Volunteers receive email + WebSocket notifications when assigned. Declined slots auto-offer to pre-qualified substitutes via OR-Set conflict resolution. The Safety Shield flags expired safety clearances and blocks uncertified volunteers from youth-related duties.

## Acceptance criteria

- [ ] Drizzle schema: `duty_slot` (date, role, volunteer_id, status, congregation_id), `safety_clearance` (volunteer_id, type, issued_date, expiry_date, certificate_key)
- [ ] RotaDO: one DO per congregation, multiplexes WebSocket channel `rota`
- [ ] DO RPC `assignSlot(slot)` → adds volunteer to slot, broadcasts update, schedules email alarm
- [ ] DO RPC `declineSlot(slotId)` → marks declined, OR-Set finds substitute
- [ ] DO RPC `getRota(weekStart)` → returns full week schedule
- [ ] DO alarm: fires 24h before Sabbath, dispatches email + WS notification to assigned volunteers
- [ ] OR-Set for slot assignments: two offline treasurers assigning same slot merge without data loss
- [ ] Safety Shield: before assigning youth duty (Pathfinders, Adventurers, children's Sabbath School), checks `safety_clearance.expiry_date > today`; blocks assignment if expired or missing
- [ ] Safety clearance upload: volunteer or clerk uploads certificate to R2, sets expiry
- [ ] Hono endpoint `GET /rota/:weekStart` — returns weekly schedule
- [ ] Test: assign volunteers to slots → notifications fire → volunteer declines → auto-swap to substitute
- [ ] Test: expired safety clearance blocks youth duty assignment
- [ ] Test: two offline assignments to same slot merge via OR-Set

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
