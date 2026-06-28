# Theobase Pilot Proposal — Fiji Mission of Seventh-day Adventists

**Prepared by:** Taia Tiniyara  
**Prepared for:** Pastor Epeli Saukuru (President), Pastor Senitiki Waqa (General Secretary), Apisalome Seru (CFO)  
**Date:** June 2026  
**Status:** Draft — for discussion

---

## 1. Executive Summary

Theobase is a global platform being built to help local Seventh-day Adventist churches run their daily operations — membership records, finances, board minutes, ministry reporting, safety compliance, and communication — in a single tool that works on a phone or tablet, online and offline. It is intended to serve churches across every division, but its launch will begin here in Fiji.

This proposal invites the Fiji Mission to be the platform's first field — to advise on its development and, when it is ready, to pilot it in one or two churches at no cost. The goal is to build something that genuinely serves the realities of Pacific island churches, shaped by the people who work in them, and then to take what is proven in Fiji to the wider Pacific and beyond.

---

## 2. The Problem

Local church officers — clerks, treasurers, pastors, department secretaries — are the administrative foundation of the denomination. But the tools they have been given do not match the work they do.

The denomination's institutional systems (ACMS for membership, SunPlus for finances) were built for conferences, unions, and the General Conference — not for the local church. A local clerk is not a user of ACMS; they are a data provider. They record baptisms and transfers on paper, and someone at the mission or union office types that data into ACMS later. A local treasurer counts offerings by hand, records them in a spreadsheet, and prepares a remittance — a process that the institutional system sees only after the fact, as a summary.

The result is that the local church — the foundation of denominational structure — operates with the weakest tools. Officers spend ministry time on paperwork. Data is reconstructed from memory at quarter-end. Errors go undetected. When an officer steps down, their knowledge walks out the door.

This is not a Fiji-specific problem. It is global. But in Fiji it is compounded by geography: churches scattered across islands, unreliable internet in outer areas, and congregations operating in four different languages.

---

## 3. What Theobase Is

Theobase is a single platform for local church operations. Instead of juggling paper binders, spreadsheets, and WhatsApp groups, every officer works in one place, with an interface designed for their specific role.

### Core capabilities

| Area | What it does |
|---|---|
| **Membership** | Digital register. Baptisms, professions of faith, transfers in/out, deaths, disciplinary removals. Each event creates an auditable log entry. Transfers generate a portable record the receiving church can ingest. Attendance captured via check-in during services. |
| **Finances** | Guided offering-count workflow with two-person verification. Digital receipt generation. Automated remittance calculation. Petty cash sub-ledger. Budget with variance tracking. Immutable audit trail on every transaction. |
| **Governance** | Structured board-meeting workflow: agenda builder, motion recording with vote tallies, action-item assignment with deadlines. Previous-meeting items auto-populate as unresolved agenda items. Minutes archive. |
| **Ministry reporting** | Department secretaries (Sabbath School, AY, Health, Dorcas, etc.) log activities as they happen. The quarterly report compiles itself from the activity log. No end-of-quarter scramble. |
| **Safety** | Child-protection training and background-check expiry tracked with automated renewal reminders. The system prevents assigning a lapsed volunteer to children's ministry. Incident-reporting with escalation paths. |
| **Communication** | Shared church calendar with department overlays. Announcements broadcast by role, department, or whole church. Archived and searchable. Optional bridge to existing WhatsApp groups during transition. |
| **Training** | Role-specific onboarding pathways. Officer certification and renewal tracking. Interactive tutorials for every workflow. |

### Design principles

**Offline-first.** The platform runs fully on a local device. A clerk on Rotuma or a treasurer in the outer Lau group can record a baptism or count an offering without internet. When a connection becomes available, data syncs. No officer ever stares at a spinner waiting for a network.

**Role-scoped.** The clerk sees only membership and attendance tools. The treasurer sees only the ledger and counting workflows. A department secretary sees only their ministry area. Each interface is simple and focused.

**Policy-embedded.** The platform knows Adventist polity. It enforces quorum before a board vote is recorded. It requires dual-signature approval for disbursements above a configurable threshold. The policy lives in the workflow — officers do not need to look it up separately.

**Reporting as a byproduct.** Because officers use Theobase to perform their actual daily work, the quarterly statistical report and the remittance to the mission are not separate tasks. They are the natural output of work already done.

**Multi-lingual.** The interface can be presented in iTaukei, Fiji Hindi, Rotuman, Rabi, and English — not just with translated labels, but with workflows and role names adapted to each congregation's cultural context. A low-literacy mode uses icon-heavy interfaces and audio prompts for officers who find text-dense screens difficult.

---

## 4. Relationship With Existing SDA Systems

Theobase does not replace ACMS, SunPlus, or AdventistGiving. It is designed to fit into the existing system landscape.

| System | Theobase's posture |
|---|---|
| **ACMS** (membership) | Theobase is where the local clerk does the work. ACMS is the institutional store. Theobase generates clean membership data that feeds into ACMS — replacing the paper-to-data-entry pipeline. |
| **SunPlus** (finances) | Theobase is where the local treasurer counts offerings and manages the church ledger. SunPlus is the institutional general ledger. Theobase generates remittance data that feeds SunPlus. |
| **AdventistGiving** (online giving) | Completely complementary. AdventistGiving lets members return tithe from their phone. Theobase helps the treasurer count the physical offering envelopes and balance the books. |
| **MD / MD Lite** (pastoral reporting, SPD) | Theobase covers the same pastoral-activity-logging and ministry-reporting workflows. It would import historical MD data for any church that transitions. During a pilot, the two could run in parallel. |
| **Thrive** (member engagement, SPD) | Theobase's discipleship and retention tracking covers similar ground. Same approach as MD — data import, parallel running if desired. |
| **Adsafe** (child safety training, SPD) | Theobase links to Adsafe's training portal to verify completion. It does not re-host Adsafe's accredited course content. |
| **Adventist Learning Community** (training) | Theobase tracks officer completion of ALC courses. It links to ALC; it does not duplicate the content. |

---

## 5. Relevance to the Fiji Mission

The Fiji Mission context presents several realities that the platform is specifically designed to address.

**Geography.** Fiji comprises over 300 islands. Churches on Rotuma, in the Lau group, and in other outer areas may have intermittent or no internet. An online-only platform is useless in those settings. Theobase's offline-first architecture means the platform works the same whether there is a connection or not.

**Languages.** The Mission serves congregations in at least four languages. Most church software is English-only. Theobase's localization framework is designed so that the Mission can configure the interface in each of its operational languages. This is a core part of the architecture, not an afterthought.

**Mission status.** As a mission rather than a conference, the Fiji Mission operates with limited resources and depends on TPUM and SPD support. Theobase's $3 USD/church/month price is designed to be affordable even for resource-constrained fields. It costs less per year than what a single church typically spends on photocopying, printer ink, and postage for the paper forms it replaces.

**Reporting burden.** The quarterly statistical report and the remittance to TPUM are non-negotiable institutional requirements. Theobase generates both as a natural output of daily work, reducing the reporting burden on officers and improving the timeliness and accuracy of the data the Mission receives.

---

## 6. Proposed Pilot

We propose a two-phase engagement.

### Phase 1: Listening (immediate)

Before writing any code specific to the Fiji context, we want to understand how things actually work on the ground:

- How does a clerk currently record a baptism or a transfer?
- How does a treasurer count the offering and prepare a remittance?
- What does the quarterly reporting process look like, end to end?
- What frustrates officers most about the current tools?
- What language do officers prefer to work in?
- What connectivity constraints do outer-island churches actually face?

This phase requires one or two conversations — with mission staff who oversee local church administration, and ideally with a clerk or treasurer who does the work daily. No commitment beyond that.

### Phase 2: Pilot (when the platform is ready)

When the core modules (membership, finances, board minutes, ministry reporting) are stable enough for field use:

- One or two churches, selected by the Mission, receive free access.
- Officers are walked through setup and trained on their workflows.
- The platform is used for daily operations over a defined period (suggested: 3–6 months).
- Regular check-ins capture what works, what does not, and what is missing.
- At the end of the pilot, the Mission decides whether to continue, expand, or stop.

**Scope of pilot churches:** Ideally one urban church (Suva area, with reliable connectivity) and one outer-island church (to test offline operation in earnest). The Mission would select which churches.

---

## 7. What the Pilot Would Involve — Per Church

| Role | What they would do in Theobase |
|---|---|
| **Clerk** | Maintain the membership register. Record baptisms, transfers, and attendance. Generate the quarterly statistical report. |
| **Treasurer** | Count weekly offerings using the guided workflow. Generate receipts. Manage the church ledger. Prepare and submit remittances. |
| **Pastor / first elder** | Run board meetings with the governance workspace. Record motions and action items. Log pastoral visits. |
| **Department secretaries** | Log ministry activities as they happen. Generate quarterly department reports. |
| **Safety officer** | Track child-protection training and background-check status. Receive renewal alerts. |

Officers would continue using their existing methods in parallel during the first month, to ensure nothing is lost during transition.

---

## 8. Costs

| Phase | Cost to the Fiji Mission |
|---|---|
| **Phase 1 (Listening)** | None. |
| **Phase 2 (Pilot)** | None. Full access at no charge for the duration of the pilot. |
| **Post-pilot (if continued)** | $3 USD per church per month. One price, everything included. No setup fees, no per-user charges, no premium tiers, no transaction fees. |

**Payment options (post-pilot):**
- **Mission-covered:** The Mission pays for its churches. Monthly invoice: number of churches × $3. Payment method to be agreed — we will accommodate what works for the Fiji Mission (bank transfer, card payment, or other Fijian payment infrastructure).
- **Church-direct:** Individual churches subscribe directly if the Mission does not opt into bulk coverage.

**Cancellation:** A church may cancel at any time with no penalty. On cancellation, data becomes read-only — viewable and exportable, but no new records can be created. Full data export is always available in open, portable formats (CSV, JSON, PDF). Data is never held hostage.

**Price guarantee:** Any future price change applies only to new subscribers. Churches that join at $3/month keep that rate.

---

## 9. Data and Privacy

**Data ownership.** The local church owns its data. The Mission has access to aggregated reporting data for its churches. Theobase is a custodian, not an owner.

**Data residency.** For the Fiji Mission, church data would be stored in a region that complies with applicable data-protection requirements — configurable to the Asia-Pacific region or, eventually, on-premise if required.

**Consent.** Members are asked for consent at onboarding and at each data-use boundary. The platform logs all consent events.

**Export.** Data can be exported at any time in open formats. No lock-in.

**Encryption.** Data encrypted at rest (AES-256) and in transit (TLS 1.3). Highly sensitive fields (background-check results, disciplinary records) receive field-level encryption.

**Audit trail.** Every significant action — who did what, when, with what approvals — is recorded in an immutable, append-only log. This supports audit readiness without manual record-gathering.

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Officers are unfamiliar with smartphones. | Low-literacy mode; interactive "show me, then let me try" tutorials; practice mode with dummy data before going live. |
| Internet is unreliable. | Offline-first architecture. Platform works fully without a connection. Syncs when one is available. No feature degradation offline. |
| Officers are volunteers with limited time. | Pilot churches are self-selected — only churches whose officers want to participate. No mandatory adoption. |
| Data loss. | Automated backups. Point-in-time recovery. Church can export its data at any time. |
| The platform does not fit local workflows. | Phase 1 listening ensures the platform is adapted before the pilot. During the pilot, regular check-ins catch misfits early. |
| This is a new, unproven platform. | Honesty about development status. The ask is modest — advice today, a small pilot tomorrow. No large-scale commitment. |

---

## 11. Timeline

| Milestone | Indicative timing |
|---|---|
| Initial conversation with Mission leadership | At the Mission's convenience |
| Phase 1: Listening — conversations with admin staff and officers | Within 1–2 months of initial conversation |
| Platform reaches pilot-readiness (core modules stable) | To be communicated — platform is in active development |
| Phase 2: Pilot churches onboarded | At the Mission's discretion, once platform is ready |
| Pilot review | After 3–6 months of use |

All timelines are flexible and subject to the Mission's priorities and the platform's development progress.

---

## 12. What We Are Asking of the Fiji Mission

1. **A conversation.** We would like to speak with someone who understands how local church administration works in Fiji — what the workflows look like, what the pain points are, what language the officers work in.

2. **An introduction to one or two church officers**, when the time comes — a clerk or treasurer willing to talk through their daily work.

3. **Permission to pilot**, when the platform is ready, in one or two churches selected by the Mission.

4. **Honest feedback** on what does and does not work for the Fiji context.

There is no financial commitment, no timeline pressure, and no obligation to continue beyond the pilot.

---

## 13. What the Fiji Mission Gets

1. **Global-first status.** Fiji will be the launch site for a global platform. What is built and proven here will set the standard for churches across the Pacific and beyond.

2. **A platform shaped by its context**, not a generic tool retrofitted for the Pacific.

3. **Cleaner, faster reporting** from pilot churches — quarterly reports and remittances generated automatically from daily work.

4. **Influence over the product roadmap.** Feedback from Fiji officers during development means their needs are built in, not added later as patches.

5. **First access.** Pilot churches use the platform before any other field in the world.

6. **No cost.** The pilot is free. If the Mission chooses to continue, the price is $3/church/month — less than what churches currently spend on photocopying and postage for paper forms.

---

## 14. About the Platform

Theobase is built by Taia Tiniyara, a software engineering studio based in Fiji. It is not a division, union, or General Conference project. It is built on Cloudflare's infrastructure (Workers, D1, R2) and uses modern web standards (React, TypeScript). The codebase is designed to be maintainable with low operational overhead, which is what makes the $3/church price sustainable.

Theobase is a global platform launching first in Fiji. We chose the Fiji Mission as the starting point because the realities of Pacific island churches — scattered geography, intermittent connectivity, multiple languages — represent the right proving ground for a platform that must work anywhere. See [taiatiniyara.com](https://taiatiniyara.com) for more about the studio building it.

---

*This proposal is a starting point for conversation. All details are open to adjustment based on the Mission's needs, constraints, and priorities.*

**Contact:** [Name], Taia Tiniyara | [Email] | [Phone / WhatsApp] | [taiatiniyara.com](https://taiatiniyara.com)
