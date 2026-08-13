# Theobase — theobase.app

A global, offline-first church management platform for Seventh-day Adventist grassroots operations, built on Cloudflare. The system notices what's happening and surfaces it unprompted. Reports appear fully populated and ready for a single-tap approval. The platform does the work; humans stay informed and make decisions.

## Design Principle: System Does the Work

The platform takes away labour, not rearranges it. Humans review and approve; the system computes, generates, populates, detects, and suggests. If a human is copying numbers from one place to another, or assembling a report by hand from system data, the platform is failing its job.

This means every feature is designed in the **approve-don't-build** posture: the system produces the complete output, the human reviews and confirms it. The clerk doesn't compile the annual statistical report — the system derives it from live data and the clerk approves it. The treasurer doesn't remit tithe figures — the system computes them from committed giving records and the treasurer signs off.

## Design Principle: Self-Teaching

No one reads the manual. Every operation teaches the user how to do the next one. The interface uses progressive disclosure — show only what's relevant now, reveal more as the user's task grows — and inline guidance that explains _why_ a step exists, not just _what_ to do ("Two people must count the offering before it can be deposited — this protects you and the church").

Every screen makes the next action obvious. Empty states tell the user what to do first, not just that something is empty ("No members yet — upload your membership roll or add the first person"). Error states explain what happened and what to do next, in plain language, never a stack trace.

This applies to onboarding too: a new church officer who has never used the platform should be able to complete their first real task (count today's offering, add a new member) without prior training, guided entirely by the interface.

## Design Principle: Zero-Assembly Reporting

Reports are never assembled by hand. The system derives every report from live data and presents it pre-filled. The human's job is review, not compilation.

- The annual statistical report appears on the clerk's screen fully populated from membership records. One tap to submit to the Conference.
- The tithe remittance statement appears pre-computed from committed giving records. The treasurer reviews and approves.
- The monthly financial statement is generated, not assembled. No export to Excel, no copying numbers.

## Design Principle: Surface, Don't Wait to Be Asked

The system notices and surfaces trends unprompted. The human doesn't query — the system presents.

- "Giving is down 12% this quarter compared to last quarter."
- "Five members haven't attended in the past four weeks."
- "Three baptismal candidates are overdue for class — reach out?"
- "The annual statistical report is ready for your review."
- "The tithe hasn't been remitted to the Conference this month."

The dashboard is proactive intelligence, not a passive rear-view mirror. Every surfaced insight includes a clear next action.

## Domain Glossary

### Organisational

- **Local Church** (also: congregation) — the atomic unit of operation. A local worshipping community with its own membership roll, officers, and finances. Every entity in the system belongs to exactly one local church.
- **District** — a group of local churches served by one pastor. A pastor may serve multiple churches in a district.
- **Conference** (also: Mission, Field) — the next level up from the local church. Receives tithe remittances, employs pastors, and oversees church governance within a defined territory. Fiji Mission is a conference-level entity.
- **Union** — a collection of conferences/missions within a broader geographical area.
- **Division** — one of the 13 world regions of the General Conference.
- **General Conference** (GC) — the global headquarters of the SDA Church.

### People & Roles

**SDA-defined church officers:**

- **Member** — a baptised or professed Seventh-day Adventist on the books of a local church. Belongs to exactly one owning church. Has a membership lifecycle: baptism → transfer in/out, death, removal, reinstatement. A member with an account can log in to: view their own giving history (tithe + offerings, tax receipts), update their contact info (phone, email, address — changes go to clerk for approval), and submit prayer requests (v2+).
- **Church Clerk** — the officer responsible for membership records. Owns all state transitions on a member's record (baptisms, transfers, removals). Produces the annual statistical report to the Conference. Invites other officers to their roles.
- **Church Treasurer** — the officer responsible for all church finances. Manages giving records (enters tithe/offering after batches are committed by counters), makes bank deposits, produces monthly financial statements for the church board, and remits tithe to the Conference. Reviews and approves the auto-generated tithe remittance statement.
- **Counter** — one of the two authorized persons who count the Sabbath offering. SDA policy requires dual-signoff: two counters must independently confirm each giving batch before it is committed. Only the counting room screens are visible. No access to full member giving history.
- **Pastor** — the ordained minister serving a church or district. Sees aggregate reports, member directory, and proactive intelligence. Does not handle money or membership state changes. In v2+: pastoral visitation log, bible study interest tracking.
- **Department Head** — leads a departmental ministry (Sabbath School, Pathfinders, Health, Women's, Men's, Family, Personal Ministries, Publishing, etc.). Manages volunteer rosters and activity coordination within their department. (Department management is v2+; v1 definition exists for role assignment.)
- **Church Board Member** — an elder, deacon, deaconess, or elected board member. Read-only access to financial statements and member directory for board meeting preparation. No write access.

**Non-officer users:**

- **Bible Study Interest** — a person (not yet a member) showing interest through evangelistic meetings, Bible studies, or community outreach. Can self-register via a church QR code. Tracked by the clerk/pastor. Only sees their own contact info and Bible study progress.
- **Visitor** — a first-time attendee who scanned the church QR code. Gets a "Welcome to theobase" screen with basic church info (service times, contact). Becomes a Bible Study Interest if they request follow-up.

**Organisational roles:**

- **Conference Admin** — manages the Conference subscription. Activates and deactivates churches.
- **Conference Treasurer** — reviews tithe remittance statements from all churches, monitors aggregate giving trends across the Conference, manages billing. The primary financial user at the Conference level.
- **Conference Secretary** — reviews submitted annual statistical reports from all churches, tracks membership trends, approves or returns reports to clerks. Oversees church clerk activity across the Conference.
- **Conference President** — top-level read-only dashboard: financial health, membership growth, church activity metrics across the entire Conference.
- **Auditor** — Conference-appointed financial reviewer. Read-only access to all giving records, batches, and financial reports for the churches assigned to them. Not a member of those churches. Scoped per-audit — access is temporary (expires after a set period).
- **Theobase Operator** — the platform maintainer (us). Access to observability dashboard (error lists, cost dashboard, restore drill results). Can impersonate any role for support debugging. No access to member PII.

#### Permission Matrix

|                           | Clerk  | Treasurer | Counter | Pastor   | Board  | Dept Head | Member   | Interest | Visitor | Conf Tres. | Conf Sec.      | Conf Pres. | Auditor  | Operator |
| ------------------------- | ------ | --------- | ------- | -------- | ------ | --------- | -------- | -------- | ------- | ---------- | -------------- | ---------- | -------- | -------- |
| **Scope**                 | Church | Church    | Church  | District | Church | Church    | Self     | Self     | Self    | Conference | Conference     | Conference | Assigned | Platform |
| **Member: view detail**   | All    | All       | ✗       | All      | All    | All       | Self     | Self     | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Member: CRUD**          | ✓      | ✗         | ✗       | ✗        | ✗      | ✗         | Contact* | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Member: lifecycle**     | ✓      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Household: manage**     | ✓      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Giving: view history**  | All    | All       | ✗       | ✗        | ✗      | ✗         | Self     | ✗        | ✗       | ✗          | ✗              | ✗          | All      | ✗        |
| **Giving: enter records** | ✗      | ✓         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Giving: count batch**   | ✗      | ✗         | ✓       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Reports: view**         | All    | All       | ✗       | All      | All    | ✗         | Self     | ✗        | ✗       | Remittance | Annual         | All        | All      | All      |
| **Reports: submit**       | ✓      | ✓         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✓          | Approve/Return | ✗          | ✗        | ✗        |
| **Role invites**          | ✓      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✗        |
| **Church: activate**      | ✗      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✓          | ✓              | ✗          | ✗        | ✓        |
| **Billing: manage**       | ✗      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✓          | ✗              | ✗          | ✗        | ✗        |
| **Observability**         | ✗      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✓        |
| **Support: impersonate**  | ✗      | ✗         | ✗       | ✗        | ✗      | ✗         | ✗        | ✗        | ✗       | ✗          | ✗              | ✗          | ✗        | ✓        |

\* Contact updates submitted by the member go to the clerk for approval before applying.

- **Household** (also: family) — a grouping of members who live together as a family unit (spouses, children, dependents). A household has a single address, a primary contact, and a shared giving envelope. The system suggests household groupings based on shared surname, address, and explicit relationship links. The clerk confirms.

### Giving & Finance

- **Tithe** — 10% of income given to God, recorded per member. The church treasurer collects, deposits, and remits tithe to the Conference (which pays pastor salaries from it).
- **Offering** — voluntary giving above and beyond tithe. Categorised by purpose: Sabbath School, Local Church Budget, Conference Advance, World Budget, building fund, ADRA, etc.
- **Giving Record** — a single giving entry attributed to a member, with type (tithe/offering), amount, date, offering category, and payment method (envelope, cash, cheque, electronic).
- **Giving Batch** — a group of giving records from one service, counted together. Must be confirmed by two authorized counters before commit. Committed batches are immutable.
- **Counting Room** — the physical space (usually at the church after Sabbath service) where deacons deposit the offering and two counters count and reconcile cash, cheques, and envelopes together.
- **Year-end Tax Receipt** — an annual statement of total giving per member, for tax purposes where applicable.

### Spiritual Growth

- **Baptismal Class** — a course of study preparing candidates for baptism, also called baptismal preparation.
- **Bible Study Interest** — a person (not yet a member) showing interest through Bible studies, evangelistic meetings, or community outreach who is being followed up.
- **Visitation** — a pastoral or lay visit to a member or interest, logged with date, purpose, and notes.

### Communication (v2+)

- **Announcement** — a message sent by the church to all members or a subset (households, department, Sabbath School class). Delivered as push notification or email depending on member preference (SMS in v2+). The system suggests announcements based on upcoming events and deadlines.
- **Prayer Request** — a member-submitted prayer need, optionally shared with the congregation or kept private to the prayer team. The system surfaces active prayer requests to the pastor's dashboard.
- **Birthday & Milestone Reminder** — the system surfaces upcoming member birthdays, baptism anniversaries, and service milestones to the pastor and department heads for personal outreach.

### Onboarding & Identity

- **Magic Link** — email-based passwordless authentication. Worker generates a signed RS256 JWT (10-min expiry, single-use), Cloudflare Email Routing delivers the login link. Session JWT (7-day) stored as both httpOnly cookie (server-side) and non-httpOnly cookie (client-side for offline header attachment). Role assignment via grant invite. See `docs/adr/0006-authentication.md`.
- **JWT Payload** — carries `sub` (userId), `churchId`, `role` (clerk / treasurer / counter / pastor / department-head / board-member / member / interest / visitor / conference-treasurer / conference-secretary / conference-president / auditor / operator), `tokenVersion`, plus `unitId` (the active grant's org unit, ADR-0018) and `isSuperAdmin`. RS256 signed. Worker middleware validates on every request. DO enforces role on every mutation — defence in depth. On role or grant change, token version increments, invalidating all existing JWTs for that user.
- **Token Version** — a monotonically incrementing integer per user. Every JWT carries the version at issue time. The DO rejects tokens with a version lower than the current version. Role changes and forced logout bump the version, instantly revoking all existing sessions.
- **MFA (TOTP)** — time-based one-time passcode as a second authentication factor. The TOTP primitives and setup/verify endpoints exist (`/auth/setup-mfa`, `/auth/verify-mfa`), but enforcement is not wired up: it is currently **not required** for any role, and the secret is not persisted server-side. Making it required for treasurer and counter roles is planned. See `docs/adr/0010-soc2-readiness.md`.
- **Data Classification** — every field is classified at definition: `PII` (name, address, phone, email, DOB, photo), `Financial` (amounts, batch totals), `Governance` (membership status, offices), `Public` (church name, aggregates). Determines logging, export, and retention rules.
- **Data Retention** — giving records: 7 years (SDA policy). Member records: membership duration + 3 years after removal. Access logs: 1 year. Login logs: 90 days.
- **Right to Erasure** — a member can request deletion. PII fields are anonymized to `redacted-member-<uuid>`. Financial records retain amounts (regulatory requirement) but are disassociated from the individual. The audit trail remains intact.
- **Event Log** — an append-only, immutable log in each DO. Every state mutation emits an event with operation, payload, actor, timestamp, and a SHA-256 hash of the previous event. The DO's current state is a materialised view of the log. Tampering is detectable: modifying any event breaks the hash chain. D1 derives reports from the same log.
- **PII Isolation** — Conference and above see aggregates only (member counts, giving totals, trends). Individual member details are visible only to their local church officers and pastor. No PII leaves the church-level DO except via structured reports.
- **Church Registration** — the first clerk or pastor from a church registers the church in the system (name, location, Conference affiliation). The system auto-provisions the church's Durable Object and grants the registrant clerk-level access. The registrant then delegates roles via invites.
- **Self-serve Migration** — the church uploads a CSV or photo of their membership roll or giving ledger. The system parses and imports it, flagging rows it can't resolve for human review. No manual data entry to recreate existing records.
- **Visitor QR** — a printed QR code at the church entrance. A first-time visitor scans it → lands on a welcome screen with church info (service times, contact) → optionally requests follow-up, becoming a Bible Study Interest in the system.

### Reporting

- **Annual Statistical Report** — the mandatory report every church clerk submits to the Conference. The system derives it from live membership data (baptisms, transfers, deaths by quarter) and pre-fills the entire report. The clerk reviews and submits.
- **Tithe Remittance Statement** — the treasurer's monthly/quarterly report of tithe collected and remitted to the Conference. The system computes the figures from committed giving records. The treasurer reviews and approves.
- **Monthly Financial Statement** — an auto-generated income/expense summary for the church board. Derived from giving records and tracked expenses. No spreadsheet assembly required.

### Sabbath School (v2+)

- **Sabbath School** — the weekly small-group Bible study ministry that runs during the Sabbath morning program before the worship service. The largest data-generating ministry in the church: class rosters, attendance, lesson study distribution, and offering.
- **Class Roster** — a group of members assigned to a Sabbath School class. The system suggests rosters based on age group, geography, and attendance patterns. The superintendent approves.
- **Check-in** — a member marks their Sabbath School attendance (QR code scan, tap in app, or self-report). Feeds into aggregate attendance statistics for the annual report.
- **Lesson Distribution** — Sabbath School quarterlies, study guides, and devotionals delivered digitally to each member based on their class assignment and language preference. The system matches the member to the right lesson material.

### Design System & UX

- **Brand Identity** — the Theobase logo is a geometric three-tier mountain peak in layered blue. Variants:
  - `logo-icon.svg` — mountain icon only, for favicons and app icons (in `packages/web/public/`)
  - `logo-full.svg` — icon + "Theobase" wordmark (dark text), for light backgrounds (in `branding/` and `packages/web/public/`)
  - `logo-full-light.svg` — icon + "Theobase" wordmark (light text), for dark backgrounds (email templates, onboarding assets) (in `branding/` and `packages/web/public/`)
    The mountain motif represents foundation, elevation, and stability. The palette defines the entire design system.
- **Typography** — Figtree is the primary brand typeface, loaded via Google Fonts in `packages/web/index.html` (Lexend is used for headings on the landing/marketing page). Falls back through the system font stack (ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans) for full Unicode coverage (Arabic, Devanagari, CJK).
- **Brand Palette** — defined in `docs/design-system.md`. Derived from the logo's layered blues: `brand-300` `#93C5FD`, `brand-400` `#60A5FA`, `brand-500` `#3B82F6`, `brand-600` `#2563EB`.
- **Design System** — single source of truth for all UI decisions at `docs/design-system.md`. Defines brand tokens (from logo palette), typography, spacing, motion, three canonical layouts (Dashboard, Detail, Form), and a component catalog of shadcn/ui primitives styled with Theobase tokens. AI agents must read this file before building any UI. See `docs/adr/0005-design-system.md`.
- **Clear Sync Status** — a small header indicator: green dot (synced), amber dot (pending), red dot (offline), with a badge count of queued changes. Tap for details. No intrusive modals.
- **Marketing Landing Page** — the public-facing landing page at `/` for unauthenticated visitors. Explains the platform, surfaces the value proposition, and provides "Sign in" and "Register your church" call-to-action buttons. See `packages/web/src/components/features/landing-page.tsx`.
- **Toast System** — a toast notification layer (`ToastProvider` + `Snackbar`) for transient feedback. Supports success, error, and warning variants with optional undo actions. Only one toast visible at a time; new toasts replace the current one. See `packages/web/src/lib/toast.tsx` and `packages/web/src/components/features/snackbar.tsx`.
- **Role-Based Route Protection** — the `RequireAuth` component gates routes by role (`allowedRoles` prop). Unauthenticated users are redirected to login. Users whose role is not in the allowed list see an "Access Denied" screen. The operator role bypasses all role checks. See `packages/web/src/lib/auth-guard.tsx`.
- **Skeleton Screen** — a placeholder UI that mimics the layout of loading content (grey blocks where text will appear). Feels faster than a spinner. All list views, member profiles, and report screens use skeleton loading states.
- **Optimistic Update** — the UI updates immediately on a user action (e.g. adding a giving record), assuming success. If the sync layer later fails, the UI rolls back gracefully with an undo prompt. The user never waits for the server.
- **Custom Numeric Keypad** — a large-tap calculator-style keypad for entering financial amounts, replacing the tiny system keyboard. Reduces entry errors in the counting room. Includes quick-access buttons for common denominations.
- **Smart Defaults** — the system pre-populates repeating patterns: member names from last week's batch, offering categories from last month's distribution, class rosters from last quarter. The user adjusts, not rebuilds.
- **Haptic Feedback** — on mobile, the device vibrates briefly to confirm a committed action (batch confirmed, report submitted, member transferred). Physical acknowledgement builds trust.
- **Swipe-to-Undo** — every entry in a giving batch can be removed by swiping left. No confirmation dialog. A snackbar appears: "Record removed. Undo?" for 5 seconds. Reversible actions need no warnings.
- **Stale Data Warning** — a subtle banner when viewing data last synced more than 24 hours ago: "Last synced Friday. Pull to refresh."

### Platform

- **Tech Stack** — React 19 + TypeScript strict + Vite + Tailwind CSS v4 + shadcn/ui + Drizzle ORM + TanStack Query v5 + TanStack Table v8 + TanStack Router v1 + Zod + i18next + ESLint + Prettier + Vitest + Playwright. See `docs/adr/0004-tech-stack.md`.
- **i18n** — `i18next` + `react-i18next` with JSON namespaces (`common`, `membership`, `giving`, `reporting`) in `packages/web/src/i18n/`. v1: English + Fijian Hindi. Locale resolution: saved preference → browser → English fallback. Numbers/currencies via `Intl.NumberFormat`, dates via `Intl.DateTimeFormat`. RTL support via `dir="rtl"` (no RTL locale ships yet). See `docs/adr/0011-i18n.md`.
- **Monorepo** — pnpm workspaces: `packages/shared` (Drizzle schema, Zod, types), `packages/worker` (DO + Worker), `packages/web` (PWA), `packages/observability` (error/sync reporting client). One tsconfig base. See `docs/adr/0004-tech-stack.md` and `docs/adr/0008-cicd.md`.
- **Accessibility** — WCAG 2.2 AA enforced at two tiers. Automated (PR gate): `eslint-plugin-jsx-a11y` (lint stage) + `@axe-core/react` (component tests). Manual (release gate): screen reader (VoiceOver/NVDA/TalkBack), keyboard-only, 200% zoom, high contrast, reduced motion, focus trapping. Playwright axe integration (`@axe-core/playwright`) is planned but not yet shipped. Checklist in `docs/accessibility-checklist.md`. See `docs/adr/0012-accessibility.md`.
- **Domain** — `theobase.app` (production), `staging.theobase.app` (Fiji beta), `<pr>.theobase.pages.dev` (preview per PR).
- **CI/CD** — GitHub Actions: lint → typecheck → test (Vitest + `@cloudflare/vitest-pool-workers`) → E2E (Playwright) → deploy. Squash merge to main. See `docs/adr/0008-cicd.md`.
- **Drizzle Schema** — the single source of truth for all data types, constraints, and defaults. D1 migrations and Zod validators are both derived from the same Drizzle schema file via `drizzle-zod`. No drift between the DO's internal state, the D1 reporting layer, and the PWA's form validation.
- **Offline-first** — the app works without internet. The local PWA stores data in IndexedDB and syncs with the church's Durable Object when connectivity returns.
- **PWA** (Progressive Web App) — installable, mobile-first frontend that works offline, receives push notifications, and syncs via WebSocket.
- **Durable Object (DO)** — one per local church. Holds authoritative state for that church. Handles the sync protocol and conflict resolution without a central database.
- **D1** — Cloudflare's SQL database for cross-church analytics and reporting at the Conference/Union/Division level.
- **R2** — Cloudflare's object storage for member photos, documents, bulletin PDFs, and audit logs.
- **Dual-signoff** — SDA policy encoded in software: two authorized counters must each independently confirm a giving batch before it is committed. The system enforces this as a hard constraint.
- **Role-based access** — each user sees and mutates data matching their church office role, enforced by the DO on every request. Full permission matrix defined in the People & Roles section. The clerk owns membership state; the treasurer owns finances; counters co-sign batches; the pastor and board see aggregate reports; the member sees their own record; Conference admin sees aggregates across churches; Operator has platform observability. The DO rejects any mutation that the caller's role does not permit.
- **Sync Protocol** — DO-as-authority with a write-ahead log. The PWA appends intents (not state deltas) to a local IndexedDB queue. When online, intents flush to the DO via WebSocket. The DO validates each intent sequentially (single-threaded — no race conditions) and broadcasts the new state to all connected clients. TanStack Query manages the client-side cache: optimistic update on intent, invalidate on DO confirmation, rollback on rejection. Offline queue visible as a badge with pending count.
- **Counting Dispute** — when two counters' batch tallies don't match. The system locks the batch, surfaces a side-by-side diff of the discrepancy, and requires both counters to jointly reconcile before either can confirm.
- **Transfer Dispute** — when a receiving church claims a transfer the sending church hasn't approved. The system surfaces the mismatch to both clerks with membership history and requires explicit accept/reject with reason.
- **Sync Conflict** — when two officers offline-edit the same record. The system detects the conflict, presents both versions with timestamps, and prompts the last writer to resolve. The clerk has final authority on membership records.
- **Cost Dashboard** (v1.5) — Cloudflare billing per church per month, per operation type, projected monthly bill. Validates the $3/church/month price against real usage data. Built into the observability UI.
- **Adventist Yearbook** (v2+) — the annual global directory of churches, workers, and institutions. Theobase generates each church's Yearbook entry from its live data and the clerk approves it for submission, replacing manual form-filling.
- **Conference Reporting Bridge** (v2+) — where a Division's existing church management system (eAdventist, ACMS) expects data in a specific format, Theobase exports the required fields. The platform is the source of truth at the church level; upstream systems receive accurate, timely data automatically.

### Commercial Model

- **Customer** — the Conference/Mission. They subscribe and activate their churches. Individual local churches never receive a bill.
- **Unit** — per local church activated on the platform.
- **Price** — $3 USD per church per month, or $30 USD per church per year ($2.50/month equivalent).
- **Billing** — monthly or annual subscription, invoiced to the Conference. Payment via card, bank transfer, or mobile money.
- **What's included** — the full platform as defined in v1.0 scope (`docs/adr/0007-mvp-scope.md`): membership lifecycle, counting room & dual-signoff, reporting suite, self-serve migration, Conference analytics. No feature gates. Communication, Sabbath School, Yearbook, and Conference Reporting Bridge are v2+ (included in subscription when they ship).
- **Optional add-ons** — SMS credits (pass-through cost per message), extended data retention beyond 7 years, custom integrations.
- **Cancellation** — if a Conference cancels, their churches retain read-only access to their data for 90 days. Export is always available. Churches belong to their Conference, not to the platform.
- **Data portability** — every church can export its full membership roll, giving history, and audit trail as structured data (CSV/JSON) at any time. No lock-in.
- **Demo Seed** — `POST /church/seed-demo` (or `pnpm --filter @theobase/worker seed:demo`) provisions "Suva Central SDA Church" under Fiji Mission with 120 synthetic members, 6 months of giving records, 24 committed batches, 2 active demo batches (one pending counter2, one disputed), and 6 demo user accounts. See `docs/adr/0013-demo-seed.md`.
- **Conference Onboarding** — planned: self-serve signup for the Conference admin, entering billing details, with a guided product tour in the demo church. Not yet shipped — placement is currently operator-confirmed via a `placement_request` queue (see `docs/adr/0019-conference-onboarding.md`).
- **In-app Help** — `?` button on every screen opens contextual help from `help.theobase.app` (Cloudflare Pages static site). Relevant to the current screen. "Still stuck?" → email the Conference admin. No chatbot, no ticket system in v1.
- **Restore Drill** — a Worker Cron trigger runs monthly: replays the demo church's event log into a fresh DO, verifies state hash matches. Failure → P1 alert. The drill currently targets the seeded demo church; "pick a random church" is planned. See `docs/adr/0016-restore-drill.md`.
- **Terms & Privacy** — placeholder docs at `theobase.app/terms` and `theobase.app/privacy` with "DRAFT" watermark. Lawyer-reviewed before production launch. See `docs/adr/0017-legal.md`.

## Architecture Constraints

1. Runs entirely on Cloudflare (Workers, Durable Objects, D1, R2, Queues, Pages, Email Routing).
2. Offline-first PWA — must function without internet and sync when connectivity returns.
3. Multi-tenant — one DO per local church with strict data isolation between churches.
4. Mobile-first UI — designed for the counting room and the clerk's desk, responsive up to desktop.
5. SDA polity and policies are enforced in software, not documentation. 14 role types with full permission matrix — the DO enforces every access rule.
6. Global deployment — supports 215+ countries, multiple languages (including right-to-left), multiple currencies.
7. System does the work, humans approve — every feature operates in an approve-don't-build posture: the system produces the complete output from live data, the human reviews and confirms.
8. Self-teaching interface — progressive disclosure, inline guidance explaining why, empty states that direct action, plain-language errors. A first-time user completes their first real task without training.
9. Zero-assembly reporting — every report is derived from live data and pre-filled. Humans review and approve; no manual compilation, no Excel export-and-copy cycle.
10. Proactive intelligence — the system surfaces trends and ready-for-action items unprompted. Every surfaced insight includes a clear next action. Don't wait to be asked.
11. Resolve in software — every dispute (counting mismatch, transfer contention, sync conflict) has a structured resolution workflow built into the platform. No side-channel phone calls or WhatsApp threads to clear a blocker.
12. Feed upstream, don't duplicate (v2+) — Theobase is the source of truth for church data. When shipped, generates Yearbook entries and exports to existing Conference/Division systems (eAdventist, ACMS) automatically. No double-entry.
13. World-class UX — consumer-grade interface, not enterprise software. Design system with token-based theming (light mode today; dark and high-contrast planned). WCAG 2.2 AA compliance. 48px minimum touch targets. Custom numeric keypad for financial entry. Optimistic updates with rollback. Skeleton loading states, never spinners. Haptic feedback for confirmations. Swipe-to-undo for reversible actions.
14. Fast on 3G — Time to Interactive < 2s, First Contentful Paint < 1.5s on a 3G connection in Fiji. Code-split by route. Service worker with stale-while-revalidate caching.
15. Sustainable SaaS — $3/church/month billed to the Conference, not individual churches. Free local church access drives adoption. Data portability (CSV/JSON export at any time) means no lock-in. Cancelled Conferences retain read-only access for 90 days.
16. Secure by design — append-only event log with cryptographic hash chain (SHA-256) in every DO. Tampering detectable by construction. JWT with 10-min magic link expiry, single-use tokens, key rotation, token version invalidation on role change. Conference sees aggregate stats only — no member PII above the church level. Rate limiting on auth endpoints. See `docs/adr/0009-security.md`.
17. Build secure, certify later — SOC 2 and other compliance deferred until a Conference requires it. Architecture is SOC2-ready: event log immutability, PII isolation, data classification and retention policies, privacy rights workflow. TOTP MFA for financial roles is planned (primitives shipped, enforcement not wired). See `docs/adr/0010-soc2-readiness.md`.
18. RTO < 1 hour, RPO < 5 minutes — DO state reconstructable from event log replay. D1 point-in-time recovery. R2 cross-region replication. Monthly automated restore drill proves backup integrity.
19. Locale-first — every string in an i18next JSON namespace. v1: English + Fijian Hindi. Numbers, dates, and currencies localised via `Intl`. RTL support via `dir` attribute.
20. Accessible by default — WCAG 2.2 AA enforced in CI (axe-core) and manual release gate (screen reader, keyboard, zoom, contrast, motion, focus trapping). A PR that fails automated checks cannot merge.
21. Observability built-in — v1 ships the client pipeline (`@theobase/observability` posts errors/sync-health to the Worker; the Worker currently logs them). D1 `error_log` + `sync_health` tables exist; persistence wiring, the Queue/R2 pipeline, and the v1.5 observability UI are planned. See `docs/adr/0014-observability.md`.
22. Self-healing versioning — DO returns `X-DO-Version` header on every response. PWA checks on sync: major bump → force-reload to latest build (offline queue preserved). Minor/patch → transparent. No breaking migrations without a major bump. See `docs/adr/0015-do-versioning.md`.
