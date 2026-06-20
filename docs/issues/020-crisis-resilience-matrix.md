# 020 — Crisis Resilience Matrix

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A regional registry of local congregation utility assets — generators, water storage, shelter capacity, first aid supplies, communication equipment. During cyclones, floods, or other emergencies, disaster coordinators (conference-level) can instantly identify which congregations are operational shelter sites.

## Acceptance criteria

- [ ] Drizzle schema: `congregation_asset` (congregation_id, asset_type enum: generator, water_tank, shelter, first_aid, comms_radio, vehicle, kitchen, medical), `asset_detail` (asset_id, key, value), `asset_status` (asset_id, status: operational, damaged, offline, last_checked, checked_by)
- [ ] Hono endpoint `POST /crisis/assets` — register an asset for a congregation
- [ ] Hono endpoint `GET /crisis/assets` — list all assets in a district or conference (aggregated view)
- [ ] Hono endpoint `PATCH /crisis/assets/:id/status` — update operational status
- [ ] Emergency dashboard: map or list view showing congregations with operational status (green/yellow/red)
- [ ] Conference-level access: disaster coordinator role can view all congregations in their conference
- [ ] Export: CSV of operational assets for external emergency services
- [ ] Test: register assets for 3 congregations → mark one generator as damaged → dashboard shows 2 operational generators → export reflects correct data

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
- 003 — Congregation Setup & Officer Management
