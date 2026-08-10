# ADR-0007: MVP Scope — Fiji Mission v1.0

## Status

Accepted (2026-08-10)

## Context

Theobase was triggered by the Fiji Mission's financial tracking problems. The first release must solve their concrete pain while establishing the platform core that all future modules extend.

## Decision

### v1.0 — ships to Fiji Mission

**Platform foundations:**
- Cloudflare multi-tenant architecture (one DO per church, D1 for cross-church analytics)
- Magic link auth + JWT role enforcement (clerk, treasurer, counter, pastor)
- Church registration + DO auto-provisioning
- Role invite system
- PWA with offline sync (IndexedDB + WebSocket write-ahead log)
- Design system: light/dark mode, system font, three canonical layouts, component catalog
- English + Fijian Hindi

**Membership:**
- Member CRUD with Zod-validated fields
- Full membership lifecycle: baptism, profession of faith, transfer in/out, death, removal, reinstatement
- Membership audit trail (every state change logged with timestamp and actor)
- Household grouping with system-suggested links
- Self-serve CSV migration (upload membership roll, system parses and flags unresolved rows)
- Member directory with TanStack Table (sort, filter, search)
- Member self-service: login to view own giving history, update contact info (clerk approval required)
- Visitor QR self-registration
- Church board member read-only access
- 14 role types with full permission matrix: clerk, treasurer, counter, pastor, department-head, board-member, member, interest, visitor, conference-treasurer, conference-secretary, conference-president, auditor, operator

**Giving & Finance:**
- Counting room: dual-signoff giving batch workflow
- Custom numeric keypad for amount entry
- Giving records per member: tithe + offerings by category
- Batch lifecycle: open → counter1-confirmed → counter2-confirmed → committed (immutable)
- Counting dispute detection and reconciliation workflow
- Smart defaults (pre-populated members and categories from previous weeks)

**Reporting:**
- Annual statistical report (auto-derived from membership data, one-tap approve and submit)
- Tithe remittance statement (auto-computed from committed giving records)
- Monthly financial statement (auto-generated income/expense summary)

**Conference view:**
- Fiji Mission admin dashboard with aggregate analytics across all activated churches
- Per-church reporting drill-down

**Intelligence:**
- Proactive surface: giving decline alerts, missing members, reports ready for review
- Every surfaced insight includes a clear next action

### Out of scope (v2+)

- Sabbath School (class rosters, check-in, lesson distribution)
- Communication module (announcements, prayer requests, birthday reminders)
- Photo-to-record / voice counting room
- SMS notifications (push notifications only in v1)
- Pathfinders, Health, and other department modules
- Extended Yearbook integration
- eAdventist/ACMS data bridge
- Additional languages beyond English + Fijian Hindi
- Mobile money payment integration (M-PAiSA)

## Consequences

- v1.0 is a complete solution for the Fiji Mission's core problems: membership records and financial accountability.
- Every module deferred to v2+ has a clear dependency on the v1.0 core (they all reference membership).
- The counting room workflow is the riskiest feature — getting the dual-signoff UX and sync protocol right on a 3G connection in a sunlit church hall. This should be the first thing prototyped and tested with real users.
