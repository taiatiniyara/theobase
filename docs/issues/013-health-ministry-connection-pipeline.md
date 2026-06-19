# 013 — Health Ministry Connection Pipeline

## What to build

A digital screener used on tablets at health expos and cooking schools. Collects community contact data and automatically organizes interests into follow-up invitation lists for future health seminars, cooking demonstrations, and evangelistic meetings.

## Acceptance criteria

- [ ] Drizzle schema: `health_event` (name, date, type, congregation_id), `health_contact` (event_id, name, phone, email, interests JSON, follow_up_status, congregation_id)
- [ ] Hono endpoint `POST /health/events` — create event
- [ ] Hono endpoint `POST /health/events/:id/contacts` — bulk add contacts from event (tablet friendly)
- [ ] Hono endpoint `GET /health/contacts` — list contacts with filter by interest, follow_up_status
- [ ] Hono endpoint `POST /health/contacts/:id/follow-up` — record follow-up action
- [ ] Interest tagging: predefined tags (diabetes, hypertension, nutrition, smoking_cessation, stress, cooking, exercise) + free-text
- [ ] Export: generate CSV of contacts filtered by interest for import into seminar invitation tools
- [ ] Test: create event → add contacts with interests → filter by "diabetes" → export → CSV matches filter
- [ ] Test: offline event collection (tablet with no signal) → syncs when back online

## Blocked by

- 001 — Monorepo + Auth Foundation
- 002 — Member Self-Service Portal
