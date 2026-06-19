# 018 — Pastoral District Hub

## What to build

A master dashboard for district pastors overseeing 3–8 congregations. Shows preaching rotation schedules, travel logs, pastoral visit tracking, and anonymized cross-church health metrics. The district pastor sees aggregated data without accessing individual member records in congregations outside their pastoral charge.

## Acceptance criteria

- [ ] Drizzle schema: `district` (name, organization_id), `district_congregation` (district_id, congregation_id), `preaching_rotation` (congregation_id, date, preacher_id, topic), `pastoral_visit` (household_id, pastor_id, date, purpose, notes), `travel_log` (pastor_id, date, from_congregation_id, to_congregation_id, distance_km, purpose)
- [ ] Hono endpoint `GET /district/overview` — aggregated dashboard: member count per church, baptism count (period), attendance trends, giving summaries
- [ ] Hono endpoint `GET /district/rotations` — preaching schedule across all congregations
- [ ] Hono endpoint `POST /district/rotations` — schedule preaching assignment
- [ ] Hono endpoint `GET /district/visits` — pastoral visit log
- [ ] Hono endpoint `POST /district/visits` — record visit
- [ ] Hono endpoint `GET /district/travel` — travel log
- [ ] Hono endpoint `POST /district/travel` — log travel leg
- [ ] Cross-church aggregation: all dashboard queries use `IN (district_congregation_ids)`, not per-church iteration
- [ ] Privacy boundary: district pastor cannot drill into individual member records; only aggregated numbers and congregation-level summaries
- [ ] Test: district pastor sees 4-church overview → schedules preaching → logs travel → records visit → dashboard updates
- [ ] Test: district pastor cannot access individual member details from any congregation

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
- 003 — Congregation Setup & Officer Management
