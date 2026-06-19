# 014 — Harvest Decision Tracker + Household Mapper

## What to build

Track Bible study interests through baptismal preparation to a recorded decision (baptism, profession of faith, or re-baptism). Includes the officiating pastor and date. Simultaneously, build the household mapper linking spouses, children, and dependants into family units for pastoral visit planning and household-level giving summaries.

## Acceptance criteria

- [ ] Drizzle schema: `candidacy` (person_id, stage enum: interest → bible_study → baptismal_class → decision, start_date, congregation_id), `decision` (person_id, type enum: baptism, profession_of_faith, rebaptism, date, officiating_pastor_id, congregation_id)
- [ ] Drizzle schema: `household` (name, congregation_id), `household_member` (household_id, person_id, relationship: head, spouse, child, dependant)
- [ ] Hono endpoint `POST /candidacies` — start candidacy for a person
- [ ] Hono endpoint `PATCH /candidacies/:id` — advance stage (bible_study → baptismal_class → decision)
- [ ] Hono endpoint `POST /decisions` — record decision with date, type, officiating pastor
- [ ] Hono endpoint `GET /candidacies` — pipeline view: all candidacies by stage
- [ ] Hono endpoint `POST /households` — create household
- [ ] Hono endpoint `POST /households/:id/members` — add person with relationship type
- [ ] Hono endpoint `GET /households` — list with member counts
- [ ] Hono endpoint `GET /households/:id` — household detail with giving summary (sum of all member receipts)
- [ ] Auto-promotion: when a decision is recorded, the person's congregational status updates (interest → member)
- [ ] Test: create interest → advance through stages → record baptism → person becomes member → household giving summary updates
- [ ] Test: pipeline view shows all candidacies grouped by stage

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
