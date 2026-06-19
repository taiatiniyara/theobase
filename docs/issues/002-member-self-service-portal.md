# 002 — Member Self-Service Portal

## What to build

A logged-in member can view their personal profile, see their giving history, update contact details, and view their ministry involvement — all scoped to their congregation via RLS. Establishes the SvelteKit PWA shell with basic Service Worker caching.

## Acceptance criteria

- [x] Drizzle schema: extend `person` table with contact fields, extend `user` with `person_id` FK
- [x] Hono endpoint `GET /me` — returns member profile, giving summary, ministry involvement
- [x] Hono endpoint `PATCH /me` — updates contact details, validates input via Zod
- [x] RLS middleware: extracts `congregation_id` from JWT, injects into every D1 query automatically
- [x] RLS test: user from Church A cannot query Church B's data (returns 403 or empty results)
- [x] SvelteKit PWA shell: login page, profile page, navigation shell
- [x] Service Worker: caches profile data on first load, serves from cache when offline
- [x] Manifest.json: app name, icons, theme color for "Add to Home Screen"
- [x] Test: member logs in → sees their profile → updates phone number → change persists in D1
- [x] Test: member sees only their own congregation's data

## Blocked by

- 001 — Monorepo + Auth Foundation
