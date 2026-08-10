# Theobase

A global, offline-first church management platform for Seventh-day Adventist grassroots operations, built on Cloudflare. The system notices what's happening and surfaces it unprompted. Reports appear fully populated and ready for a single-tap approval. The platform does the work; humans stay informed and make decisions.

## Design Principle: System Does the Work

The platform takes away labour, not rearranges it. Humans review and approve; the system computes, generates, populates, detects, and suggests. If a human is copying numbers from one place to another, or assembling a report by hand from system data, the platform is failing its job.

This means every feature is designed in the **approve-don't-build** posture: the system produces the complete output, the human reviews and confirms it. The clerk doesn't compile the annual statistical report — the system derives it from live data and the clerk approves it. The treasurer doesn't remit tithe figures — the system computes them from committed giving records and the treasurer signs off.

## Design Principle: Self-Teaching

No one reads the manual. Every operation teaches the user how to do the next one. The interface uses progressive disclosure — show only what's relevant now, reveal more as the user's task grows — and inline guidance that explains *why* a step exists, not just *what* to do ("Two people must count the offering before it can be deposited — this protects you and the church").

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

- **Member** — a baptised or professed Seventh-day Adventist on the books of a local church. Belongs to exactly one owning church. Has a membership lifecycle: baptism → transfer in/out, death, removal, reinstatement.
- **Household** (also: family) — a grouping of members who live together as a family unit (spouses, children, dependents). A household has a single address, a primary contact, and a shared giving envelope. The system suggests household groupings based on shared surname, address, and explicit relationship links. The clerk confirms.
- **Church Clerk** — the officer responsible for membership records. Owns all state transitions on a member's record (baptisms, transfers, removals). Produces the annual statistical report to the Conference.
- **Church Treasurer** — the officer responsible for all church finances. Manages tithe and offering records, makes bank deposits, produces monthly financial statements for the church board, and remits tithe to the Conference.
- **Counter** — one of the two authorized persons who count the Sabbath offering. SDA policy requires dual-signoff: two counters must independently confirm each giving batch before it is committed.
- **Pastor** — the ordained minister serving a church or district. Sees aggregate reports. Does not directly handle money or membership state changes.
- **Department Head** — leads a departmental ministry (Sabbath School, Pathfinders, Health, Women's, Men's, Family, Personal Ministries, Publishing, etc.), coordinating volunteers and activities within that department.

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

### Communication

- **Announcement** — a message sent by the church to all members or a subset (households, department, Sabbath School class). Delivered as push notification, email, or SMS depending on member preference. The system suggests announcements based on upcoming events and deadlines.
- **Prayer Request** — a member-submitted prayer need, optionally shared with the congregation or kept private to the prayer team. The system surfaces active prayer requests to the pastor's dashboard.
- **Birthday & Milestone Reminder** — the system surfaces upcoming member birthdays, baptism anniversaries, and service milestones to the pastor and department heads for personal outreach.

### Onboarding & Identity

- **Magic Link** — email-based passwordless authentication. A user enters their email, receives a link, and is signed in. No password management, no forgotten credentials.
- **Church Registration** — the first clerk or pastor from a church registers the church in the system (name, location, Conference affiliation). The system auto-provisions the church's Durable Object and grants the registrant clerk-level access. The registrant then delegates roles to other officers.
- **Self-serve Migration** — the church uploads a CSV or photo of their membership roll or giving ledger. The system parses and imports it, flagging rows it can't resolve for human review. No manual data entry to recreate existing records.

### Reporting

- **Annual Statistical Report** — the mandatory report every church clerk submits to the Conference. The system derives it from live membership data (baptisms, transfers, deaths by quarter) and pre-fills the entire report. The clerk reviews and submits.
- **Tithe Remittance Statement** — the treasurer's monthly/quarterly report of tithe collected and remitted to the Conference. The system computes the figures from committed giving records. The treasurer reviews and approves.
- **Monthly Financial Statement** — an auto-generated income/expense summary for the church board. Derived from giving records and tracked expenses. No spreadsheet assembly required.

### Sabbath School

- **Sabbath School** — the weekly small-group Bible study ministry that runs during the Sabbath morning program before the worship service. The largest data-generating ministry in the church: class rosters, attendance, lesson study distribution, and offering.
- **Class Roster** — a group of members assigned to a Sabbath School class. The system suggests rosters based on age group, geography, and attendance patterns. The superintendent approves.
- **Check-in** — a member marks their Sabbath School attendance (QR code scan, tap in app, or self-report). Feeds into aggregate attendance statistics for the annual report.
- **Lesson Distribution** — Sabbath School quarterlies, study guides, and devotionals delivered digitally to each member based on their class assignment and language preference. The system matches the member to the right lesson material.

### Design System & UX

- **Brand Identity** — the Theobase logo is a geometric three-tier mountain peak in layered blue (`branding/logo-icon.svg`, `branding/logo-full.svg`). The mountain motif represents foundation, elevation, and stability. The palette defines the entire design system.
- **Brand Palette** — derived from the logo's layered blues:
  - `blue-300` `#93C5FD` — top peak (lightest)
  - `blue-400` `#60A5FA` — upper mid peak
  - `blue-500` `#3B82F6` — lower mid peak
  - `blue-600` `#2563EB` — bottom peak (darkest, primary action color)
- **Design Token** — a named design value (color, spacing, typography, radius, shadow, motion curve) defined once and referenced everywhere. The system supports light, dark, and high-contrast themes from the same tokens. Changing a token value propagates to every component.
- **Theme Variants** — light mode (white backgrounds, blue-600 actions), dark mode (slate-900 backgrounds, blue-400 accents), high-contrast mode (for outdoor counting-room light on low-end screens).
- **Clear Sync Status** — a small header indicator: green dot (synced), amber dot (pending), red dot (offline), with a badge count of queued changes. Tap for details. No intrusive modals.
- **Skeleton Screen** — a placeholder UI that mimics the layout of loading content (grey blocks where text will appear). Feels faster than a spinner. All list views, member profiles, and report screens use skeleton loading states.
- **Optimistic Update** — the UI updates immediately on a user action (e.g. adding a giving record), assuming success. If the sync layer later fails, the UI rolls back gracefully with an undo prompt. The user never waits for the server.
- **Custom Numeric Keypad** — a large-tap calculator-style keypad for entering financial amounts, replacing the tiny system keyboard. Reduces entry errors in the counting room. Includes quick-access buttons for common denominations.
- **Smart Defaults** — the system pre-populates repeating patterns: member names from last week's batch, offering categories from last month's distribution, class rosters from last quarter. The user adjusts, not rebuilds.
- **Haptic Feedback** — on mobile, the device vibrates briefly to confirm a committed action (batch confirmed, report submitted, member transferred). Physical acknowledgement builds trust.
- **Swipe-to-Undo** — every entry in a giving batch can be removed by swiping left. No confirmation dialog. A snackbar appears: "Record removed. Undo?" for 5 seconds. Reversible actions need no warnings.
- **Stale Data Warning** — a subtle banner when viewing data last synced more than 24 hours ago: "Last synced Friday. Pull to refresh."

### Platform

- **Offline-first** — the app works without internet. The local PWA stores data in IndexedDB and syncs with the church's Durable Object when connectivity returns.
- **PWA** (Progressive Web App) — installable, mobile-first frontend that works offline, receives push notifications, and syncs via WebSocket.
- **Durable Object (DO)** — one per local church. Holds authoritative state for that church. Handles the sync protocol and conflict resolution without a central database.
- **D1** — Cloudflare's SQL database for cross-church analytics and reporting at the Conference/Union/Division level.
- **R2** — Cloudflare's object storage for member photos, documents, bulletin PDFs, and audit logs.
- **Dual-signoff** — SDA policy encoded in software: two authorized counters must each independently confirm a giving batch before it is committed. The system enforces this as a hard constraint.
- **Role-based access** — each user sees and mutates data matching their church office role. The clerk owns membership state; the treasurer owns finances; counters co-sign batches; the pastor sees aggregate reports.
- **Counting Dispute** — when two counters' batch tallies don't match. The system locks the batch, surfaces a side-by-side diff of the discrepancy, and requires both counters to jointly reconcile before either can confirm.
- **Transfer Dispute** — when a receiving church claims a transfer the sending church hasn't approved. The system surfaces the mismatch to both clerks with membership history and requires explicit accept/reject with reason.
- **Sync Conflict** — when two officers offline-edit the same record. The system detects the conflict, presents both versions with timestamps, and prompts the last writer to resolve. The clerk has final authority on membership records.
- **Adventist Yearbook** — the annual global directory of churches, workers, and institutions. Theobase generates each church's Yearbook entry from its live data and the clerk approves it for submission, replacing manual form-filling.
- **Conference Reporting Bridge** — where a Division's existing church management system (eAdventist, ACMS) expects data in a specific format, Theobase exports the required fields. The platform is the source of truth at the church level; upstream systems receive accurate, timely data automatically.

## Architecture Constraints

1. Runs entirely on Cloudflare (Workers, Durable Objects, D1, R2, Queues, Pages, Email Routing).
2. Offline-first PWA — must function without internet and sync when connectivity returns.
3. Multi-tenant — one DO per local church with strict data isolation between churches.
4. Mobile-first UI — designed for the counting room and the clerk's desk, responsive up to desktop.
5. SDA polity and policies are enforced in software, not documentation.
6. Global deployment — supports 215+ countries, multiple languages (including right-to-left), multiple currencies.
7. System does the work, humans approve — every feature operates in an approve-don't-build posture: the system produces the complete output from live data, the human reviews and confirms.
8. Self-teaching interface — progressive disclosure, inline guidance explaining why, empty states that direct action, plain-language errors. A first-time user completes their first real task without training.
9. Zero-assembly reporting — every report is derived from live data and pre-filled. Humans review and approve; no manual compilation, no Excel export-and-copy cycle.
10. Proactive intelligence — the system surfaces trends and ready-for-action items unprompted. Every surfaced insight includes a clear next action. Don't wait to be asked.
11. Resolve in software — every dispute (counting mismatch, transfer contention, sync conflict) has a structured resolution workflow built into the platform. No side-channel phone calls or WhatsApp threads to clear a blocker.
12. Feed upstream, don't duplicate — Theobase is the source of truth for church data. It generates Yearbook entries and exports to existing Conference/Division systems (eAdventist, ACMS) automatically. No double-entry.
13. World-class UX — consumer-grade interface, not enterprise software. Design system with token-based theming (light, dark, high-contrast). WCAG 2.2 AA compliance. 48px minimum touch targets. Custom numeric keypad for financial entry. Optimistic updates with rollback. Skeleton loading states, never spinners. Haptic feedback for confirmations. Swipe-to-undo for reversible actions.
14. Fast on 3G — Time to Interactive < 2s, First Contentful Paint < 1.5s on a 3G connection in Fiji. Code-split by route. Service worker with stale-while-revalidate caching.
