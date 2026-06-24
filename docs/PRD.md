# PRD: Theobase

## Problem Statement

Local Seventh-day Adventist congregations operate without purpose-built digital
tools. Church volunteers — clerks, treasurers, elders, department leaders — rely
on group chats, paper ledgers, scattered spreadsheets, and manual processes for
24 distinct weekly operations. This creates duplicate work (the same data
entered locally then again for conference reports), lost institutional memory
(board decisions buried in email threads), compliance gaps (Church Manual
requirements violated unknowingly), and perpetual fire drills (Friday-night
phone calls to fill empty platform duty slots).

Existing church software targets denominational headquarters, not the local
congregation. It assumes always-on broadband, technical administrators, and a
Sunday-oriented calendar. A rural church in the Solomon Islands with a single
patchy 3G connection and elderly volunteer officers has fundamentally different
needs than a corporate accounting department.

## Solution

Theobase is a Progressive Web Application backed by a fully Cloudflare-native
infrastructure. It replaces 24 paper/spreadsheet workflows with a unified
platform that works offline during Sabbath services, respects regional data
sovereignty, and costs $5/month per congregation. The platform does not process
payments — it is a Digital Filing Cabinet that records member intent and links
receipt images to board decisions and bank statements for audit readiness.

## User Stories

### Authentication & Access Control

1. As a church elder, I want to log in with just my email address (no password), so that I can access the app without remembering credentials.
2. As a treasurer, I want a second authentication step before accessing financial records, so that congregation funds are protected beyond a single email compromise.
3. As a clerk, I want to invite officers to the platform by entering their email, so they receive a magic link and join the congregation immediately.
4. As a district pastor, I want to see anonymized cross-church dashboards without accessing individual member records, so that I can monitor district health without violating privacy.
5. As a department leader, I want access scoped to only my department's records, so that I cannot accidentally view or modify Dorcas data while managing Pathfinders.

### Administration & Governance

6. As a clerk, I want to build a board meeting agenda from a template, track attendance and quorum, and record minutes with numbered decisions, so that every board action is searchable and auditable.
7. As a nominating committee member, I want to cast confidential digital ballots for officer candidates, so that the election process is both private and auditable.
8. As a rota coordinator, I want to assign platform duty slots (elder, deacon, musician, AV operator) by dragging volunteers onto a calendar, so that the schedule is visible to everyone and declined slots auto-offer to substitutes.
9. As a clerk, I want the system to block a youth volunteer from being scheduled if their safety clearance has expired, so that child protection compliance is enforced automatically.

### Finance & Treasury

10. As a member, I want to upload a screenshot of my bank transfer and specify how it should be split (tithe, church budget, Pathfinders), so that the treasurer receives a clear, organized submission instead of a WhatsApp screenshot.
11. As a treasurer, I want to see a queue of pending receipt verifications side-by-side with the bank statement, so that I can approve or reject each submission with one click.
12. As a treasurer, I want every approved expense linked to its originating receipt image and the board decision that authorized it, so that audit preparation takes minutes instead of weeks.
13. As a treasurer, I want a simplified dashboard showing weekly fund balances split by department, so that I can report to the board without navigating a full accounting system.
14. As a treasurer, I want to point my phone camera at a physical tithe envelope, have it read the handwritten split, and update the records, so that Saturday afternoon counting takes a fraction of the time.

### Ministries & Auxiliaries

15. As a Pathfinder director, I want to track each member's class rank progression (Friend through Guide), honors earned, uniform sizes, and campout permission slips, so that I have a complete record for each Pathfinder in one place.
16. As a Sabbath School teacher, I want a digital class register for my specific age division that shows attendance trends and links to the current lesson study, so that I can focus on teaching rather than paperwork.
17. As a Dorcas coordinator, I want to log welfare assistance cases (food, financial aid) with strict confidentiality, so that member dignity is protected and pantry inventory stays accurate.
18. As a health ministries leader, I want to collect community contact data on a tablet at a health expo and automatically organize it into follow-up invitation lists, so that no visitor interest goes cold.

### Sabbath Operations

19. As a worship coordinator, I want reminders calibrated to my local Friday sunset time, not midnight, so that notifications never arrive during sacred hours.
20. As a deaconess, I want a structural plan for communion that maps venue splits, towel inventories, and room transitions, so that the Ordinance of Humility runs smoothly without relying on memory.
21. As an AV operator, I want the order of service changes made at the pulpit to appear on my presentation screen in real time, so that I don't run the wrong hymn slide when a last-minute swap is announced.

### District & Conference

22. As a district pastor overseeing six congregations, I want a master dashboard showing preaching rotations, travel logs, and pastoral visit schedules across all sites, so I stop tracking everything in pocket planners.
23. As a conference secretary, I want a one-click export of the quarterly statistical report (membership, finances, baptisms, attendance) from every congregation, so that I receive accurate data without reminding clerks three times.
24. As a disaster coordinator, I want to instantly see which congregations in a cyclone zone have generators, water storage, and shelter capacity, so that emergency response decisions are data-driven.

### Membership & Records

25. As a member, I want to view my personal giving history, update my contact details, and see my ministry involvement, so that I don't need to call the clerk for basic information.
26. As a clerk, I want to link spouses and children into households, so that pastoral visit planning and children's ministry tracking operate at the family level.
27. As an evangelism coordinator, I want to track a Bible study interest from first contact through baptismal preparation and record the decision date and officiating pastor, so that we have an accurate growth record for quarterly reports.
28. As a clerk, I want a secure digital workflow for requesting, approving, and receiving membership transfers between congregations, so that members don't wait months for a letter of transfer to arrive by post.
29. As a clerk, I want the system to flag policy violations proactively (no quorum for a vote, missing audit trail), so that the congregation stays compliant with the Church Manual by default.

## Implementation Decisions

### Monorepo Structure

Four apps and four packages in a pnpm workspace:

- `apps/api` — Hono Workers (REST endpoints, D1 queries, email dispatch)
- `apps/do` — Durable Objects (multiplexed WebSocket, alarm scheduling, write RPC)
- `apps/web` — SvelteKit PWA (Service Worker, IndexedDB, deployed to Cloudflare Pages)
- `apps/relay` — SMTP relay client (@taiatiniyara/smtp-relay-client)
- `packages/db` — Drizzle schemas, migrations, shared D1 connection utility
- `packages/email` — `sendEmail()` interface using @taiatiniyara/smtp-relay-client
- `packages/auth` — Magic link generation, JWT validation, session middleware
- `packages/shared` — Zod validation schemas, TypeScript types, revision fork detection

### Database: Multi-Tenant D1 per Division

One D1 database per SDA world division, with `congregation_id` on every row. The Hono
middleware injects `church_id` from the session JWT; no raw query runs without
it. Migrations run via a CI Worker that iterates division D1 bindings.

### Congregation Model

Local Churches, Companies, and Branch Sabbath Schools share a single
`congregation` table with a `type` discriminator and self-referencing
`parent_id`. This avoids schema migration on status changes (Branch → Company →
Local Church).

### API: Hybrid REST + Durable Object RPC

REST endpoints for reads (cacheable by the PWA Service Worker). Durable Object
RPC for writes and real-time collaboration (one DO per congregation,
multiplexing WebSocket channels for board, rota, AV sync, and notification
toasts).

### Real-Time & Notifications

WebSocket connection from PWA to congregation DO handles in-app toasts and
collaboration. Every notification also dispatches via email as guaranteed
delivery. The DO alarm API schedules timed notifications (duty reminders 24h
before Sabbath).

### Authentication

Email-based passwordless — magic link or one-time code. No passwords stored.
Short-lived JWT in httpOnly cookie. Two-factor (second email code) for
treasurer, clerk, and nominating committee roles.

### Offline-First

Three-tier CRDT strategy: last-writer-wins for scalar fields, OR-Set for duty
rota slots, revision-based merge for board minutes. The PWA maintains an
IndexedDB outbox; successful sync acknowledges, conflicts surface for
resolution.

### Outbound Email

Uses `@taiatiniyara/smtp-relay-client` to send emails via a stateless SMTP relay.
SMTP credentials are sent per-request from the Workers; the relay itself is
credential-free.

### Tech Stack Summary

- Frontend: SvelteKit (PWA) → Cloudflare Pages
- Backend: Hono → Cloudflare Workers
- Database: Cloudflare D1 (SQLite) + Drizzle ORM
- Real-Time: Cloudflare Durable Objects (WebSocket)
- Storage: Cloudflare R2 (receipt images, exports)
- Email: Cloudflare Email Routing (inbound) + micro VPS SMTP relay (outbound)
- Testing: Vitest + Miniflare 3

## Testing Decisions

Tests validate external behavior across five seams, never implementation
details:

1. **REST API seam.** Miniflare spins up the Hono Worker with a throwaway D1.
   Vitest calls `fetch()` on endpoints, asserts HTTP status + response shape +
   D1 state. Every endpoint test includes: valid request, missing auth, wrong
   `church_id` (RLS), and malformed input.

2. **DO RPC seam.** Miniflare creates DO stubs. Vitest calls RPC methods, asserts
   DO in-memory state and alarm scheduling. Tests cover: write RPC success, write
   RPC rejected by validation, WebSocket upgrade and channel multiplexing, alarm
   fire and notification dispatch, and DO wake-from-hibernation state reload.

3. **PWA offline seam.** Integration tests simulate connectivity toggle: write
   offline → outbox grows → reconnect → flush succeeds → IndexedDB and server
   agree. Conflict tests: two offline writes to same board minute produce a
   revision fork surfaced in UI.

4. **Auth seam.** End-to-end flow: request magic link → email dispatched (logged
   in test mode) → token extracted → token exchanged for JWT → JWT used on
   subsequent requests → JWT expiry → 401.

5. **Email seam.** Tests capture emails in a global array for assertion.
   The `createEmailSender` factory detects test mode via `globalThis.__testEmails`
   and skips actual relay calls.

### Test Environment

Miniflare 3 simulates the entire Cloudflare stack locally (Workers, D1, DO, R2).
No external services needed for the vast majority of tests.

## Out of Scope

- **Payment processing.** Theobase does not move money. It records declared
  intent and receipt images.
- **Native iOS/Android apps.** PWA-only. No Swift, no Kotlin, no app store
  submissions.
- **Real-time video/audio.** AV Sync coordinates slide changes, not media
  streaming.
- **SMS/WhatsApp notifications.** All out-of-app delivery is email.
- **Migration from third-party church software.** CSV templates for initial
  import only; no automated migration from competitors.
- **Multi-conference back-office coordination.** The Conference Report Generator
  exports data; it does not provide a conference-level administrative dashboard.
- **ADRA integration.** The Crisis Resilience Matrix is a local registry, not a
  connection to ADRA's internal systems.
- **Lesson study content hosting.** Links to the official Quarterly, does not
  embed or redistribute copyrighted content.
- **Full accounting (double-entry, general ledger).** The Volunteer Treasury
  Interface is a fund-balance dashboard, not a replacement for a professional
  accounting package.

## Further Notes

The platform is built in four phases matching the Rollout Plan:

- Phase 0: Pilot with 3–5 test churches, onboarding tooling, migration CSV
  templates
- Phase 1: Weekly essentials (auth, profiles, scheduling, board meetings, giving)
- Phase 2: Department tools (Pathfinders, Sabbath School, Dorcas, Health,
  baptisms, households)
- Phase 3: Broad coordination (nominating vault, district hub, crisis matrix,
  conference reporting, transfers, compliance)

The first tracer-bullet issue is Member Self-Service Portal + Authentication —
it touches every layer (Workers, D1, DO, Email, PWA offline cache) and
establishes the RLS pattern, auth flow, and monorepo structure that every
subsequent feature depends on. All 30 user stories are delivered as independent
vertical slices, each adding one complete user-facing capability end to end.
