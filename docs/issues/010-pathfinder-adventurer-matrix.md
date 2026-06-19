# 010 — Pathfinder/Adventurer Matrix

## What to build

A dedicated youth ministry portal for Pathfinder and Adventurer directors. Track each member's progressive class rank (Friend → Companion → Explorer → Ranger → Guide for Pathfinders; Little Lamb → Eager Beaver → Busy Bee → Sunbeam → Builder → Helping Hand for Adventurers), honors/merit badges earned, uniform sizes, and campout permission slips.

## Acceptance criteria

- [ ] Drizzle schema: `pathfinder_class` (name, order, club_type), `pathfinder_progress` (member_id, class_id, status, completed_at), `pathfinder_honor` (name, category), `pathfinder_honor_earned` (member_id, honor_id, date), `uniform_record` (member_id, item, size, issued_date), `campout_permission` (member_id, event_name, date, signed_by, form_key)
- [ ] Hono endpoint `GET /pathfinder/members` — list of Pathfinder/Adventurer members with progress summary
- [ ] Hono endpoint `GET /pathfinder/members/:id` — full progress card (classes, honors, uniform, permissions)
- [ ] Hono endpoint `POST /pathfinder/members/:id/progress` — update class rank progress
- [ ] Hono endpoint `POST /pathfinder/members/:id/honors` — record earned honor
- [ ] Hono endpoint `POST /pathfinder/members/:id/uniform` — update uniform record
- [ ] Hono endpoint `POST /pathfinder/members/:id/permissions` — upload signed permission slip to R2
- [ ] Club type toggle: director switches between Pathfinder and Adventurer views
- [ ] Test: director adds member → records class progress → awards honor → uploads permission slip → full card displays correctly
- [ ] Test: permission slip expiry (e.g. campout date passed) flags the record

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
