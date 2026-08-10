## Problem Statement

Fiji Mission local churches track membership and finances on paper and spreadsheets. The church clerk manually compiles the annual statistical report. The treasurer assembles tithe remittance statements from counting-room paper records. Counting-room offerings are counted on paper with no structured audit trail. The Conference receives inconsistent, delayed data from its churches and has no real-time visibility into church health.

## Solution

Theobase: a global, offline-first, mobile-first church management PWA built entirely on Cloudflare. v1.0 ships to Fiji Mission with membership lifecycle management and a dual-signoff counting-room workflow that produces auto-generated reports requiring only human approval. The platform does the work; church officers review and confirm.

Key design pillars: System Does the Work (approve-dont-build posture), Proactive Intelligence (system surfaces trends unprompted), Self-Teaching Interface (no training required), Zero-Assembly Reporting (no Excel, no copying numbers), SDA Policy Encoded in Software (dual-signoff, 14 roles, immutable event log).

Deployed at theobase.app. SaaS: $3/church/month billed to the Conference. Free for local churches.

## User Stories

### Authentication and Onboarding

1. As a church clerk, I want to register my church on the platform, so that I can start managing membership and finances digitally.
2. As a user, I want to sign in with a magic link sent to my email, so that I never need to remember a password.
3. As a church clerk, I want to send role invites to my treasurer and counters via email, so that they can access the platform with the correct permissions.
4. As a Conference treasurer, I want to sign up my Conference and activate churches, so that my churches can start using the platform.
5. As a new Conference admin, I want to explore a fully populated demo church immediately after signup, so that I understand the platform's value before activating real churches.
6. As a user, I want my session to work offline and re-authenticate transparently when I reconnect.
7. As a treasurer, I want to be required to enable MFA (TOTP), so that financial operations have a second layer of security.
8. As a church clerk, I want to upload a CSV of my membership roll during onboarding, so that I do not need to manually type in every member.

### Membership Management

9. As a church clerk, I want to add a new member with name, contact info, date of birth, baptism date, and household, so that our membership roll is complete and accurate.
10. As a church clerk, I want to record a member's baptism, so that the membership lifecycle begins correctly.
11. As a church clerk, I want to transfer a member to another church, so that the sending and receiving churches have accurate records.
12. As a church clerk, I want to record a member's death or removal, so that the membership roll reflects current reality.
13. As a church clerk, I want a member transfer to require acceptance from the receiving church, so that no member is transferred without both churches agreeing.
14. As a church clerk, I want every membership state change to be recorded in an immutable audit log, so that the Conference and auditor can verify the membership history.
15. As a church clerk, I want the system to suggest household groupings based on shared surname, address, and relationships.
16. As a clerk, I want to see a member's full timeline: baptism, offices held, spiritual growth milestones.
17. As a member, I want to log in and see my own giving history and tax receipt, so that I can track my tithe and offerings without asking the treasurer.
18. As a member, I want to update my own contact information, so that the church always has my current phone number and email.
19. As a church clerk, I want to approve or reject contact updates submitted by members.
20. As a church board member, I want read-only access to member directory and financial reports, so that I can prepare for board meetings.
21. As a church clerk, I want a searchable, sortable, filterable member directory.
22. As a first-time visitor, I want to scan a QR code at the church entrance and see welcome information, so that I can learn about the church and request follow-up.
23. As a Bible study interest, I want my contact info tracked and my progress visible to the pastor.

### Counting Room and Giving

24. As a counter, I want to open a new giving batch after the Sabbath service, so that I can start recording the offering.
25. As a counter, I want a large, custom numeric keypad for entering amounts, so that I can enter figures quickly and accurately without the tiny phone keyboard.
26. As a counter, I want smart defaults that pre-populate member names from last week's giving pattern, so that I enter less data each week.
27. As a counter, I want to swipe-left to undo a giving record in the current batch, so that mistakes are corrected without confirmation dialogs.
28. As a counter, I want to confirm my batch when done counting, so that my portion of the dual-signoff is recorded.
29. As a second counter, I want to see that the first counter has confirmed and add my own independent confirmation.
30. As a counter, I want the system to detect when my tally does not match the other counter's, so that disputes are caught before the money leaves the counting room.
31. As both counters, I want a side-by-side diff view of the disputed amounts so that we can jointly reconcile the difference.
32. As both counters, I want the batch locked until we jointly reconcile a dispute.
33. As a treasurer, I want to see committed batches and enter them as official giving records.
34. As a treasurer, I want to record additional giving entries (non-batch, electronic transfers) after reviewing committed batches.
35. As a treasurer, I want to record the bank deposit against a committed batch, so that the physical money trail is complete.
36. As a treasurer, I want committed batches to be immutable: no edits, no deletions.
37. As a treasurer, I want to see a member's full giving history including tithe and all offering categories.
38. As a counter or treasurer, I want my phone to vibrate briefly when I confirm a batch.

### Reporting

39. As a church clerk, I want the annual statistical report to be automatically populated from our membership data, so that I approve it with one tap instead of spending days compiling it.
40. As a church treasurer, I want the tithe remittance statement to be automatically computed from committed giving records, so that I approve it with one tap instead of manually calculating it.
41. As a church treasurer, I want a monthly financial statement auto-generated from giving records and expenses.
42. As a member, I want to download my year-end tax receipt, so that I can file my taxes.
43. As a Conference secretary, I want to review submitted annual statistical reports from all my churches and approve or return them.
44. As a Conference treasurer, I want to review tithe remittance statements from all my churches.
45. As a Conference president, I want a top-level read-only dashboard showing membership growth and financial health across all churches.
46. As a Conference treasurer, I want to see aggregate giving trends across all churches, so that I can spot declines or anomalies early.
47. As an auditor, I want read-only access to all giving records and batches for the churches I am assigned to audit.

### Proactive Intelligence

48. As a pastor, I want the dashboard to surface members who have not attended in four weeks.
49. As a treasurer, I want the dashboard to surface when giving is down significantly this quarter.
50. As a clerk, I want the dashboard to surface when the annual statistical report is ready for review.
51. As a treasurer, I want the dashboard to surface when the tithe has not been remitted to the Conference this month.
52. As a clerk, I want the dashboard to surface overdue baptismal candidates.
53. As a Conference admin, I want the dashboard to surface which churches have not submitted their annual reports.

### Offline and Sync

54. As a counter, I want to record giving entries even when the church has no internet connection.
55. As a clerk, I want to edit member records offline, so that I can work in remote areas without interruption.
56. As any user, I want a clear sync status indicator showing whether I am online, pending sync, or offline.
57. As any user, I want to see a badge count of pending sync operations.
58. As any user, I want stale data warnings when my view is more than 24 hours out of sync.
59. As any user, I want my offline changes to sync automatically when I reconnect, without manual intervention.
60. As a user running an older PWA version, I want my PWA to force-reload when the DO has a major version bump.

### Data Integrity and Security

61. As an auditor, I want every giving batch and member state change recorded in an append-only event log with a cryptographic hash chain, so that tampering is detectable.
62. As a church member, I want my personal details visible only to my church officers and pastor.
63. As a Conference admin, I want to see only aggregate statistics, never individual member details.
64. As a member, I want to request deletion of my personal data, so that my right to erasure is respected.
65. As a Conference admin, I want to deactivate a church and have its officers retain read-only access for 90 days.
66. As any user, I want to export my church's full membership roll, giving history, and audit trail as CSV/JSON at any time.

### I18n and Accessibility

67. As a Fijian Hindi-speaking church officer, I want the entire interface in my language.
68. As a blind counter, I want the counting room to work with a screen reader: every amount read back, every confirmation announced.
69. As a low-vision user, I want all text to meet 4.5:1 contrast and all touch targets to be at least 48px.
70. As a keyboard-only user, I want to Tab through the entire member directory, counting room, and report submission flow.

### Observability and Platform Health

71. As a platform operator, I want every DO crash, sync failure, and React error captured with stack traces, breadcrumbs, and device info.
72. As a platform operator, I want a monthly automated restore drill that picks a random church DO, replays its event log, and verifies the state hash matches.
73. As a platform operator, I want a cost dashboard showing Cloudflare billing per church per month.

## Implementation Decisions

### Platform
Runs entirely on Cloudflare: Workers, Durable Objects, D1, R2, Queues, Email Routing, Pages. Monorepo with pnpm workspaces: packages/shared, packages/worker, packages/web. Domain: theobase.app (production), staging.theobase.app (beta).

### Tech Stack
React 19 + TypeScript strict + Vite + Tailwind CSS v4 + shadcn/ui. TanStack Query v5, TanStack Table v8, TanStack Router v1. React Hook Form + Zod. Drizzle ORM + drizzle-zod. i18next + react-i18next (v1: English + Fijian Hindi). Vitest + @cloudflare/vitest-pool-workers + Playwright. ESLint + Prettier.

### Data Model
Drizzle schema is source of truth. Core entities: Member, Household, GivingRecord, GivingBatch, Church, Conference, User, RoleAssignment. Append-only event log with SHA-256 hash chain per DO. DO state is materialized view of log. D1 derives reports from log. DO-as-authority sync protocol: PWA write-ahead log flushes to DO via WebSocket.

### Authentication
Magic link flow with RS256 JWTs (10-min expiry, single-use). Session JWT 7-day with transparent refresh. 14 roles with DO-enforced permission matrix. MFA (TOTP) required for treasurer and counter roles. Worker middleware validates JWT; DO validates churchId + role on every mutation.

### PWA and Offline
Service worker with stale-while-revalidate caching. IndexedDB for local state + write-ahead log. DO version via X-DO-Version header: major bump forces PWA reload. TTI less than 2s on 3G, FCP less than 1.5s.

### Design System
Brand palette from logo. System font stack, tabular numbers on financial data. Three canonical layouts: Dashboard, Detail, Form. WCAG 2.2 AA: automated CI checks + manual release gate checklist.

### Counting Room UX
Custom numeric keypad (calculator layout, 56px tap targets). Live amount display. Swipe-left to undo. Haptic feedback. Batch summary with dual-signoff progress. Smart defaults. Dispute: locked batch, side-by-side diff, joint reconcile.

### Generative Features
Demo seed: Suva Central SDA Church with 120 members, 6 months giving, 24 committed batches, 2 active demo batches. Self-serve CSV migration. Household suggestions. Smart defaults. Auto-populated reports. Proactive intelligence dashboard.

### Commercial Model
Conference subscription: $3/church/month or $30/church/year. Self-serve signup with Stripe Checkout. Immediate demo church with guided tour. 90-day read-only on cancellation. Full CSV/JSON export.

### Observability
v1 data pipeline: @theobase/observability client, D1 errors + sync_health tables, R2 raw payloads. v1.5 UI: errors list, church health cards, alert rules, cost dashboard. Monthly automated restore drill.

### Testing Seams
Five seams: E2E (Playwright), DO interface (Vitest + @cloudflare/vitest-pool-workers), Worker middleware (Vitest), PWA components (Vitest + RTL), Drizzle schema (Vitest). Tests external behavior at the highest possible seam.

### SOC 2 Readiness
Architecture is SOC2-ready; certification deferred. Data classification at field level. Retention: giving 7 years, membership + 3 years. Right to erasure. RTO less than 1 hour, RPO less than 5 minutes.

## Out of Scope (v1)
- Sabbath School: class rosters, check-in, lesson distribution
- Communication module: announcements, prayer requests, birthday reminders
- Photo-to-record / voice counting room
- SMS notifications
- Pathfinders, Health, other department modules
- Extended Yearbook integration
- eAdventist/ACMS data bridge
- Additional languages beyond English and Fijian Hindi
- Mobile money payment integration
- Observability UI (data pipeline ships, UI in v1.5)
- Community translation workflow
- Union/Division admin roles

## Further Notes
- Counting-room dual-signoff UX is highest-risk feature. Prototype first with Playwright E2E to validate sync protocol under 3G latency.
- Demo seed data doubles as integration test.
- Fiji Mission should beta test on staging.theobase.app before production.
- Design system must be built out before feature work so AI agents have concrete components.
- 22 architecture constraints in CONTEXT.md are build rules checked in code review.
