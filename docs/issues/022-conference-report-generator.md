# 022 — Conference Report Generator

## What to build

A one-click export that compiles the local congregation's operational data into the standard conference quarterly statistical report format. Eliminates double data entry — the clerk no longer copies figures from Theobase into the conference's separate reporting portal. Covers membership changes, baptisms, finances, Sabbath School attendance, and departmental activity.

## Acceptance criteria

- [ ] Report schema: membership opening/closing, additions (baptism, profession of faith, transfer in), subtractions (death, transfer out, dropped), tithe total, offering totals by fund, Sabbath School attendance by division, Pathfinder/Adventurer enrollment
- [ ] Hono endpoint `POST /reports/generate` — triggers async report generation (DO-based for large congregations, 30s Worker limit)
- [ ] Hono endpoint `GET /reports/:id` — download generated report (PDF or CSV)
- [ ] Hono endpoint `GET /reports/:id/status` — poll generation progress
- [ ] Data aggregation: pulls from receipts (Slice 004), decisions (Slice 014), Sabbath School (Slice 011), Pathfinders (Slice 010), transfers (Slice 021)
- [ ] Report period selector: quarter (Q1/Q2/Q3/Q4) + year
- [ ] Preview before download: clerk reviews numbers in-browser before generating final PDF
- [ ] Test: generate Q1 report → verify membership numbers match → verify tithe total matches verified receipts → verify baptism count matches decisions → download PDF
- [ ] Test: large congregation (500+ members) generates without 30s timeout

## Blocked by

- 004 — Digital Receipt Registry
- 005 — Boardroom Management Ledger
- 011 — Sabbath School Division Dashboard
- 014 — Harvest Decision Tracker + Household Mapper
