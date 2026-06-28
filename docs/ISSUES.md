# ISSUES — Backlog Dependency Graph

## Tracer Bullet

**#1 — Foundation — Org + Auth + PWA Shell (+ cross-slice integration):** Schema migration sync, auth + JWT + roles, common UI components, TanStack Query patterns, PWA lifecycle, R2 binding, widget grid, email delivery, first sync proof, shared type system (@theobase/shared), route assembly pattern, migration ordering with FK constraints, and E2E workflow validation harness.

## P1 Issues

| # | Title | Dependencies |
|---|-------|-------------|
| 1 | TB: Foundation — Org + Auth + PWA Shell | — |
| 2 | S1: Membership Hub (+ consent, self-view, duplicate detection) | #1 |
| 3 | S2: Finance Ledger (+ dual-sig) | #1, #19 |
| 4 | S3: Remittance | #3 |
| 5 | S4: Board Governance (+ quorum) | #1, #2, #19 |
| 6 | S5: Ministry Activities (+ union taxonomies) | #1 |
| 7 | S6: Communications (+ role target, opt-out, archive, WhatsApp bridge) | #1, #19 |
| 8 | S7: Safety + Training + Incidents | #1, #2, #19 |
| 9 | S8: Import + Offline Hardening | #2–#8, #19 |
| 10 | S9: Security Hardening | #2–#8, #12–#18 |
| 11 | S10: Onboarding + Learnability (+ voiceovers, Impact Tab) | #2, #3, #4, #5, #6, #8 |
| 12 | S11: Quarterly Statistical Report | #2, #3, #4, #5, #6 |
| 13 | S12: ACMS/SunPlus Data Exports | #2, #3, #4, #6, #12 |
| 14 | S13: Conference Dashboards (+ data-quality, anomaly detection) | #2, #3, #4, #5, #6, #12 |
| 15 | S14: Transfer Crypto-Signing | #2 |
| 16 | S15: Denomination Counting | #3 |
| 17 | S16: Audit Packet Generation | #2, #3, #4, #5, #8, #10 |
| 18 | S17: Data Export | #2, #3, #4, #5, #6, #7, #8 |
| 19 | S18: Notification System | #1 |
| 20 | S19: Support Tickets | #1 |

## P2 Issues

| # | Title | Dependencies |
|---|-------|-------------|
| 21 | S20: Identity + Discipleship + Succession | #2, #8 |
| 22 | S21: Budgeting + Petty Cash + Fundraising | #3, #4 |
| 23 | S22: Event Planning + Inter-Dept Coordination | #6, #7 |
| 24 | S23: Pastoral Reporting + Attendance Analytics | #2, #6, #14 |
| 25 | S24: Language + Literacy + Cultural Adaptation | #1 |
| 26 | S25: Risk Management + Policy Compliance Engine | #8, #1 |
| 27 | S26: Volunteers + Assets + Inventory + Transport | #2 |
| 28 | S27: Data Privacy + SSO + Public APIs | #1 |
| 29 | S28: Monitoring + Testing + Device + Cost (+ ops) | #1 |
| 30 | S29: Champions + Support + Community + Legal | #1, #11, #20 |

## P3 Issues

| # | Title | Dependencies |
|---|-------|-------------|
| 31 | S30: Cross-Border + Procurement + Tax + District Planning | #2, #3, #14 |
| 32 | S31: Conflict Resolution + Records Appeals | #2 |
| 33 | S32: Emergency Response | #2, #7 |
| 34 | S33: Burnout + Digitization + Moderation | #2, #27 |
| 35 | S34: API Portal + Vendor Exit + FLE + Retention | #28, #10 |
| 36 | S35: Accessibility + Insurance + Mission Impact | #1, #14 |

All labeled `ready-for-agent`. Covers all 68 gaps from theobase.md §6.
