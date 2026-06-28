# THEOBASE

## Table of Contents

1. [The Core Problem: Administrative Asymmetry](#1-the-core-problem-administrative-asymmetry)
2. [Architectural Strategy: Middleware vs. Replacement](#2-the-architectural-strategy-middleware-vs-replacement)
3. [Existing System Coverage Map](#3-existing-system-coverage-map)
4. [Gap Catalog](#4-gap-catalog)
   - 4.1 [Membership & Records](#41-membership--records)
   - 4.2 [Financial Stewardship](#42-financial-stewardship)
   - 4.3 [Governance & Leadership](#43-governance--leadership)
   - 4.4 [Ministry Operations & Reporting](#44-ministry-operations--reporting)
   - 4.5 [Communication & Coordination](#45-communication--coordination)
   - 4.6 [Safety, Risk & Compliance](#46-safety-risk--compliance)
   - 4.7 [Human Resources & Volunteer Management](#47-human-resources--volunteer-management)
   - 4.8 [Assets, Infrastructure & Logistics](#48-assets-infrastructure--logistics)
   - 4.9 [Technology, Security & Platform](#49-technology-security--platform)
   - 4.10 [Adoption, Training & Change Management](#410-adoption-training--change-management)
   - 4.11 [Data & Analytics](#411-data--analytics)
   - 4.12 [Legal, Regulatory & Ethics](#412-legal-regulatory--ethics)
5. [Priority Phasing Roadmap](#5-priority-phasing-roadmap)
6. [Gap-to-Metric Quick-Reference](#6-gap-to-metric-quick-reference)

---

## 1. The Core Problem: Administrative Asymmetry

The SDA Church follows a representative democracy where authority flows upward from the local church, yet its existing enterprise systems (ACMS, SunPlus) are built top-down for institutional compliance. This creates an **Administrative Asymmetry**: the global apex is data-rich, but the foundational local church is "data-blind" — forced to rely on disconnected, insecure tools like paper binders and spreadsheets.

This asymmetry has concrete consequences:
- Local officers spend ministry time on low-value data entry and paper shuffling rather than pastoral care.
- Institutional decisions are made on stale, incomplete, or error-prone data.
- Volunteer burnout is accelerated by administrative friction.
- Financial leakage and governance gaps go undetected for quarters or years.

---

## 2. The Architectural Strategy: Middleware vs. Replacement

Theobase does not aim to replace existing enterprise systems; it acts as a **middleware engine** that bridges the gap between grassroots operations and institutional reporting.

### Core Design Principles

**Encapsulation** — The system embeds complex global policies (e.g., General Conference Working Policy, safety requirements) directly into the local user interface. Volunteers follow a "user-friendly prompt" rather than needing to manually look up church policy. The policy lives in the workflow, not in a PDF.

**Telemetry as an Operational Byproduct** — Because local officers use the platform to perform their actual daily tasks (counting offerings, logging visits, recording board motions), the system generates high-fidelity, real-time data as a natural result of ministry — not as a separate, burdensome reporting exercise at year-end.

**Offline-First with Deterministic Sync** — Local churches in low-connectivity areas operate normally offline. When connectivity is restored, data syncs with deterministic conflict resolution rules. No officer ever stares at a spinner.

**Role-Anchored UX** — Every interface is scoped to a specific officer role (clerk, treasurer, deaconess, PM secretary, elder). The user sees only what they need, in the language and literacy level they need.

**Layered Access Governance** — Data flows upward in governed, auditable increments. A local clerk cannot see the district budget; a union auditor sees aggregated compliance dashboards, not individual member records.

---

## 3. Existing System Coverage Map

The SDA Church already operates two enterprise systems that serve the institutional tier:

| System | Scope | User | Coverage |
|---|---|---|---|
| **ACMS** (Adventist Church Management System) | Membership, transfers, statistical reports, some departmental reporting | Conference/mission/union clerks | Handles the *institutional* membership database — but local churches only contribute data; they do not operate the system. |
| **SunPlus** | General ledger, fund accounting, institutional budgeting, remittance intake, audit trails | Conference/mission/union treasury | Handles the *institutional* financial ledger — but local church treasurers work outside the system, submitting paper or spreadsheet reports. |

### What existing systems do NOT cover

Both systems were architected for top-down institutional compliance. They were never designed to serve the local church as a user. This leaves **every local-church operational workflow** uncovered:

- **Local financial counting and controls** — The offering-count process, petty cash, receipt generation, and local treasury operations happen entirely outside SunPlus. The local treasurer is a data provider, not a user.
- **Board governance and minutes** — No existing system touches local church governance workflows.
- **Ministry activity logging** — Department secretaries (AY, Sabbath School, PM, Health, Dorcas) have no digital tooling. ACMS receives only aggregated statistical summaries.
- **Officer training and onboarding** — No platform for structured onboarding, certification tracking, or renewal management.
- **Child safety and compliance** — Background checks, training records, and incident workflows are entirely manual.
- **Communication and coordination** — WhatsApp, Facebook, and paper announcements fill the gap.
- **Asset, inventory, and logistics management** — Church buildings, vehicles, equipment, and supplies are untracked.
- **Volunteer and HR management** — No roster, skills database, or workload visibility exists.
- **Offline-first operation** — Both ACMS and SunPlus require connectivity and institutional access; they are unusable in disconnected local-church settings.
- **Every technology, legal, adoption, and analytics concern** — Data residency, encryption, API governance, digital literacy support, funding models, and mission-impact measurement are platform-level concerns outside the scope of existing systems.

### The coverage pattern

```
                    ACMS                SunPlus
Membership DB        ████████            ░░░░░░░░
Transfers            ████████            ░░░░░░░░
Statistical reports  ████████            ░░░░░░░░
Institutional GL     ░░░░░░░░            ████████
Fund accounting      ░░░░░░░░            ████████
Institutional budget ░░░░░░░░            ████████
Remittance intake    ░░░░░░░░            ████████
─────────────────────────────────────────────────
Local counting       ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Board minutes        ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Ministry logging     ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Officer training     ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Child safety         ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Communication        ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Asset management     ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Volunteer mgmt       ░░░░░░░░            ░░░░░░░░  ← THEOBASE
Offline operation    ░░░░░░░░            ░░░░░░░░  ← THEOBASE
```

**The integration model:** Theobase sits below the institutional line. It empowers local officers to do their daily work digitally, then generates the reports and data extracts that ACMS and SunPlus expect — eliminating the manual re-keying step at the conference office and producing higher-fidelity data as a natural byproduct.

In the gap catalog and quick-reference table below, each entry is tagged with its existing system coverage:

| Tag | Meaning |
|---|---|
| `None` | No existing system addresses this at any level. |
| `ACMS (inst.)` | ACMS covers this at the institutional level, but the local church has no tooling. |
| `SunPlus (inst.)` | SunPlus covers this at the institutional level, but the local church has no tooling. |
| `Partially` | Some aspect has institutional tooling, but significant gaps remain at all levels. |

---

## 4. Gap Catalog

Each gap in the catalog is structured as:

| Field | Purpose |
|---|---|---|
| **Current Pain** | What the gap looks like on the ground today. |
| **Legacy Coverage** | Whether ACMS or SunPlus already addresses this gap (see [Section 3](#3-existing-system-coverage-map)). |
| **Theobase Response** | How the middleware architecture addresses this gap. |
| **Success Metric** | A measurable indicator that the gap has been closed. |
| **Phase** | When this capability should ship: **P1** (MVP — blocks basic operations), **P2** (Scaling — high-value for adoption), **P3** (Maturity — completes the vision). |

---

### 4.1 Membership & Records

#### 4.1.1 Membership Records
**Current Pain:** Baptisms recorded on paper scraps. Transfers lost between islands. Attendance tracked in WhatsApp groups. No single source of truth for who belongs to the church. Fragmented, duplicate, or lost records across clerks, pastors, and districts.

**Legacy Coverage:** ACMS (inst.)

**Theobase Response:** A **Membership Hub** — a local-first digital register with structured fields for baptisms, professions of faith, transfers-in, transfers-out, deaths, and disciplinary removals. Each event triggers an auditable log entry. Transfers generate a cryptographically-signed portable membership record that the receiving church can ingest. Attendance is captured via a low-friction check-in flow (QR, manual tick, or batch import) during Sabbath services.

**Success Metric:** >95% of churches maintain membership records within Theobase (no parallel paper/spreadsheet registers). Transfer latency drops from weeks to <48 hours.

**Phase:** P1

---

#### 4.1.2 Membership Identity Verification
**Current Pain:** No reliable, low-friction way to verify identity during transfers, sensitive actions, or membership restoration. Reliance on personal recognition alone.

**Legacy Coverage:** None

**Theobase Response:** Lightweight identity binding — associate each member record with a locally-verified identifier (phone number, government ID hash where appropriate, prior-church attestation). Portability tokens for transfers include attestation signatures from the sending clerk. Optional biometric binding for high-trust contexts.

**Success Metric:** Identity disputes on transfers drop by >80%. Time-to-verify for transfers <1 hour.

**Phase:** P2

---

#### 4.1.3 Discipleship and Retention Tracking
**Current Pain:** Baptisms celebrated but post-baptism engagement is invisible. No systematic way to know if new members are integrating, attending, or being discipled.

**Legacy Coverage:** None

**Theobase Response:** Post-baptism journey tracking — auto-enroll new members in a configurable discipleship pathway (mentor assignment, lesson completion, service involvement). The system flags members who show disengagement signals (attendance drop-off, no small-group participation) for pastoral follow-up.

**Success Metric:** First-year retention rate measurable per church. Intervention alerts triggered within 30 days of disengagement signals.

**Phase:** P2

---

#### 4.1.4 Cross-Border Membership Movement
**Current Pain:** Slow or lost transfers across islands, countries, and unions. Manual, paper-dependent processes break across jurisdictions.

**Legacy Coverage:** ACMS (inst.)

**Theobase Response:** Standardized portable membership records with union-recognized attestation. Theobase instances federate across unions via a lightweight membership-exchange protocol. A receiving church can "claim" a transfer with the sending church's assent, all recorded on an immutable ledger.

**Success Metric:** Cross-union transfer resolution <1 week. Lost-transfer incidents <1% of all transfers.

**Phase:** P3

---

### 4.2 Financial Stewardship

#### 4.2.1 Financial Transparency and Remittances
**Current Pain:** Inconsistent receipts, late remittances to the conference/mission, weak audit trails. Tithe and offerings counted on paper, recorded in spreadsheets, and reported weeks after the fact.

**Legacy Coverage:** SunPlus (inst.)

**Theobase Response:** A **Finance Ledger** — counting workflows that match the physical offering-count process (two-person verification, denomination breakdowns, earmarking). Receipts are generated digitally and can be printed or shared. Remittance calculations are automated per GC Working Policy rules. Every transaction has an immutable audit trail. Summary reports aggregate automatically for mission/conference submission.

**Success Metric:** Remittance latency <7 days from collection to submission. Audit trail completeness >99%. Discrepancy rate <1% between church-ledger and mission-ledger.

**Phase:** P1

---

#### 4.2.2 Budgeting and Local Financial Planning
**Current Pain:** No forecasting, variance tracking, or structured budget templates at the local church level. Budgeting is reactive or nonexistent.

**Legacy Coverage:** SunPlus (inst.)

**Theobase Response:** Budgeting module with templated line items (configurable by union/mission). Variance dashboards comparing actuals to budget in real time. Multi-year projections for capital campaigns and building projects. Scenario modeling for different tithe/offering trajectories.

**Success Metric:** >80% of churches adopt a formal annual budget within Theobase. Variance reporting is automated and reviewed quarterly.

**Phase:** P2

---

#### 4.2.3 Local Financial Controls and Petty Cash
**Current Pain:** Small cash handling, petty-cash reconciliation, and local expense policies are undocumented. Cash leakage is common and undetectable until an audit.

**Legacy Coverage:** None

**Theobase Response:** Petty-cash sub-ledger with receipt-capture (photo via mobile), approval workflows for disbursements, and automated reconciliation against the main treasury ledger. Configurable spending limits and dual-approval requirements reflect local policy.

**Success Metric:** Petty-cash discrepancies flagged within reporting period. Unreconciled cash balances <2% of total treasury.

**Phase:** P2

---

#### 4.2.4 Fundraising and Donor Management
**Current Pain:** Pledge tracking is ad hoc. Restricted funds (building, Dorcas, Pathfinders) are commingled. Donor receipts are manual.

**Legacy Coverage:** Partially

**Theobase Response:** Fund designation engine — every receipt can be split across multiple fund codes with automated allocation. Pledge tracking with progress dashboards. Donor receipts generated automatically per local tax requirements. Restricted funds tracked in segregated sub-accounts with spend-approval gates.

**Success Metric:** Restricted-fund compliance >99%. Donor receipt turnaround <48 hours.

**Phase:** P2

---

#### 4.2.5 Procurement and Vendor Management
**Current Pain:** No standardized procurement workflows, vendor records, contract-expiry tracking, or supplier performance metrics.

**Legacy Coverage:** None

**Theobase Response:** Procurement module with quote collection, approval chains (threshold-based), vendor registry, and contract-expiry alerts. Integrated with the budgeting module to enforce spend-before-approve controls.

**Success Metric:** Procurement cycle time measurable and reducible. No contracts renewed after expiry without explicit approval. Vendor spend visible per church and district.

**Phase:** P3

---

#### 4.2.6 Local Tax and Remittance Automation
**Current Pain:** Country-specific rules for remittance reporting and tax withholding are unknown or inconsistently applied.

**Legacy Coverage:** Partially

**Theobase Response:** Jurisdiction-aware tax rule engine. Configurable by union/mission with local tax tables. Automated withholding calculations and remittance-ready reports.

**Success Metric:** Tax compliance errors <0.5% of transactions. Automated withholding for all applicable transactions.

**Phase:** P3

---

### 4.3 Governance & Leadership

#### 4.3.1 Board Minutes and Governance
**Current Pain:** Missing agendas, incomplete minutes, unclear motions and voting records. Board decisions live in a notebook that may or may not be found later. No structured way to track action items or follow-through.

**Legacy Coverage:** None

**Theobase Response:** A **Governance Workspace** — structured board-meeting workflow: agenda builder, motion recording with voter tallies, action-item assignment with deadlines, and an immutable minutes archive. Meeting templates can embed constitutional and policy requirements (e.g., quorum checks, required agenda items). Previous-meeting action items auto-populate as agenda items until marked resolved.

**Success Metric:** Board minutes completeness >95% (all required fields populated). Action-item closure rate >80% between meetings.

**Phase:** P1

---

#### 4.3.2 Leadership Succession Planning
**Current Pain:** No officer history, no succession pipelines. When a clerk or treasurer leaves, institutional knowledge is lost. Successors are untrained and unprepared.

**Legacy Coverage:** None

**Theobase Response:** Officer registry with term tracking, role descriptions, and competency checklists. The system flags upcoming term expirations and unfilled roles. A succession pipeline view shows potential candidates (members who have completed training or expressed interest). Outgoing officers generate a structured handover packet (pending items, key contacts, recurrent tasks) for their successor.

**Success Metric:** Officer vacancy >30 days <5% of churches. Handover packets generated for >90% of officer transitions.

**Phase:** P2

---

#### 4.3.3 Conflict Resolution and Governance Accountability
**Current Pain:** No documented escalation or mediation workflows. Grievances are handled informally, inconsistently, or not at all.

**Legacy Coverage:** None

**Theobase Response:** Configurable grievance workflow — a member or officer can initiate a confidential concern that routes through the correct escalation path (local elder → district pastor → mission executive committee) per the Church Manual. Each step has timers and escalation triggers. The system tracks resolution status without exposing sensitive details to unauthorized roles.

**Success Metric:** Grievance-resolution timelines measurable. Escalation breaches (missed response deadlines) <10%.

**Phase:** P3

---

#### 4.3.4 District Strategic Planning
**Current Pain:** Lack of multi-year plans, KPIs, and forecasting at the district level. Districts operate reactively.

**Legacy Coverage:** None

**Theobase Response:** District planning dashboard aggregating local-church data into trend lines (membership growth, financial health, ministry activity). Goal-setting against benchmarks with progress tracking. Resource-allocation recommendations based on activity levels and gaps.

**Success Metric:** >60% of districts maintain a current multi-year plan in Theobase with quarterly progress reviews.

**Phase:** P3

---

### 4.4 Ministry Operations & Reporting

#### 4.4.1 Ministry Reporting (AY, Sabbath School, PM, Health, Dorcas)
**Current Pain:** Departmental reporting is ad hoc, inconsistent, and paper-based. AY secretaries, Sabbath School superintendents, and Health directors submit reports in different formats (if at all). Aggregation at the conference level is a manual nightmare.

**Legacy Coverage:** ACMS (inst.)

**Theobase Response:** A **Ministry Reporter** — role-specific dashboards for each department secretary. Instead of filling out a quarterly report form, the secretary logs activities as they happen (e.g., "AY program held — 25 attendees — topic: Relationships"). The quarterly report is then auto-generated from the activity log. Standardized ministry taxonomies (configurable by union) ensure consistent categorization.

**Success Metric:** Quarterly ministry report submission rate >90%. Report compilation time reduced by >80% at the conference level.

**Phase:** P1

---

#### 4.4.2 Event Planning and Resource Coordination
**Current Pain:** No booking system, no volunteer assignment, no budget tracking for events (camp meetings, AY rallies, health expos).

**Legacy Coverage:** None

**Theobase Response:** Event workspace — calendar integration, venue and equipment booking, volunteer sign-up with role assignment, budget envelope with actuals tracking, and post-event reporting. Recurring-event templates reduce setup time.

**Success Metric:** Event-planning administrative overhead reduced by >50%. Volunteer no-show rate reduced via automated reminders.

**Phase:** P2

---

#### 4.4.3 Inter-Department Coordination
**Current Pain:** Silos between Health, Education, PM, AY, Sabbath School, Dorcas. Departments duplicate effort, conflict on calendar, and never see each other's plans.

**Legacy Coverage:** None

**Theobase Response:** Shared church calendar with department-level overlays. Cross-department visibility into upcoming events, resource needs, and member participation. Collision detection flags scheduling conflicts. A "whole-church view" dashboard for the pastor and elder team.

**Success Metric:** Scheduling conflicts flagged and resolved <48 hours before event. Cross-department collaborative events increase year-over-year.

**Phase:** P2

---

#### 4.4.4 Pastoral Reporting and District Oversight
**Current Pain:** Inconsistent visit logs, no systematic church-visit documentation, district pastors operate with limited visibility into church health.

**Legacy Coverage:** None

**Theobase Response:** Pastor's mobile workspace — visit logging (member, purpose, duration, follow-up needed), church-visit checklists, anomaly alerts (attendance drop, financial irregularity, governance lapse). District dashboard aggregates health indicators across all churches in the district.

**Success Metric:** Visit-log completion >90% of pastoral visits. District-pastor time-to-awareness of local issues reduced from weeks to days.

**Phase:** P2

---

### 4.5 Communication & Coordination

#### 4.5.1 Communication and Coordination
**Current Pain:** Reliance on WhatsApp, Facebook, and informal channels — fragmented, insecure, and impossible to archive. No unified church calendar. Announcements scatter across platforms. Members miss critical information.

**Legacy Coverage:** None

**Theobase Response:** A **Communications Hub** — unified calendar (synced across all department modules), announcement broadcast with targeting (by role, department, or whole church), and an optional member-facing view. Integrates with existing channels (WhatsApp bridge for announcements) but provides a canonical source of truth. All official communications are archived and searchable.

**Success Metric:** Single source of truth for >90% of church announcements. Announcement reach (members who saw it) measurable. WhatsApp reliance for official communication drops >50%.

**Phase:** P1

---

#### 4.5.2 Language Localization and Literacy Design
**Current Pain:** Inconsistent translations. Low-literacy members and officers cannot use text-heavy interfaces. Multi-language churches lack unified tooling.

**Legacy Coverage:** None

**Theobase Response:** Built-in internationalization framework with union-curated translation packs. Low-literacy UX mode — icon-heavy interfaces, voice-input support, audio prompts, and step-by-step wizard flows. A member's language preference is stored in their profile and applied across all interfaces.

**Success Metric:** UI available in all union-official languages. Low-literacy-mode task-completion rate >90% in usability testing.

**Phase:** P2

---

#### 4.5.3 Cultural Sensitivity and Contextual Workflows
**Current Pain:** Local titles (e.g., "Elder" vs. "Lay Pastor" vs. culturally-specific leadership roles), customs, and organizational labels vary across regions. A one-size-fits-all UI alienates users.

**Legacy Coverage:** None

**Theobase Response:** Configurable localization not just of language but of organizational labels, workflows, and role names. Unions define their own role taxonomy and organizational hierarchy. The underlying data model is canonical; the surface layer is culturally adapted.

**Success Metric:** Cultural-adaptation requests resolvable via configuration (not code changes) in >95% of cases.

**Phase:** P2

---

#### 4.5.4 Community Moderation and Misuse Controls
**Current Pain:** No policies or tooling to prevent misuse of member data or to moderate sensitive communications.

**Legacy Coverage:** None

**Theobase Response:** Content-moderation flagging on broadcast announcements. Role-based communication scoping (e.g., treasurer cannot broadcast to whole church). Audit log of all mass communications. Member opt-out for non-essential announcements.

**Success Metric:** Zero unauthorized mass communications in rollout year. Moderation-flag response <24 hours.

**Phase:** P3

---

### 4.6 Safety, Risk & Compliance

#### 4.6.1 Child Safety and Compliance
**Current Pain:** Missing training records, no renewal reminders, no incident-reporting workflow. Background-check documentation lives in a filing cabinet or doesn't exist.

**Legacy Coverage:** None

**Theobase Response:** **Safety Vault** — volunteer-safety module tracking background-check status, child-protection training completion, and certification expiry. Automated renewal reminders 90/60/30 days before expiry. The system gates role assignments — a volunteer without current clearance cannot be assigned to children's ministry roles. Incident-reporting workflow with mandated-reporter escalation paths.

**Success Metric:** Child-protection training compliance >95% for all children's-ministry volunteers. Background-check expiry gap <30 days. Incident-reporting-to-escalation time <24 hours.

**Phase:** P1

---

#### 4.6.2 Risk Management and Incident Reporting
**Current Pain:** No standardized incident forms, no escalation paths, no trend analysis. Incidents (property damage, injuries, financial irregularities) are handled ad hoc.

**Legacy Coverage:** None

**Theobase Response:** Standardized incident-reporting forms configurable by union. Automatic routing to the correct escalation tier (local board → district → mission). Incident dashboard with trend analysis and recurrence detection. Post-incident review workflow with corrective-action tracking.

**Success Metric:** Incident-report completion >90% within 48 hours. Corrective-action closure rate >80% within 30 days.

**Phase:** P2

---

#### 4.6.3 Emergency Response Coordination
**Current Pain:** No disaster workflows, no contact trees, no incident-response plans. In natural disasters or crises, coordination is chaotic.

**Legacy Coverage:** None

**Theobase Response:** Emergency-response module — predefined crisis roles and contact trees, member-location mapping for accountability checks, communication templates for emergency broadcast, and post-crisis reporting. Offline-capable so it works when infrastructure is damaged.

**Success Metric:** Crisis-contact-tree activation <1 hour. Member-accountability check completion >90% within 24 hours of a declared emergency.

**Phase:** P3

---

#### 4.6.4 Policy Compliance Monitoring
**Current Pain:** No checklists, dashboards, or automated reminders to ensure local churches are operating within GC Working Policy, union policy, and local legal requirements.

**Legacy Coverage:** None

**Theobase Response:** Policy-compliance engine — configurable rule sets that map policy requirements to system behaviors. Examples: quorum validation before a board vote is recorded, dual-signature enforcement before a disbursement above a threshold, audit-committee approval before a financial export. A compliance dashboard shows each church's standing against required policies.

**Success Metric:** Policy-violation events >90% prevented by system gates (not caught after the fact). Compliance-dashboard review rate >80% quarterly by district pastors.

**Phase:** P2

---

#### 4.6.5 Audit Readiness and Documentation
**Current Pain:** Missing evidence, incomplete archives, poor provenance. When the auditor arrives, the church scrambles to find paper records and receipts.

**Legacy Coverage:** Partially

**Theobase Response:** Every transaction, motion, and report in Theobase carries a complete provenance trail — who did it, when, with what approvals. The audit workspace generates a structured audit packet (financial records, board minutes, compliance certificates) on demand. Immutable log ensures nothing can be altered or deleted after the fact.

**Success Metric:** Audit-preparation time reduced by >80%. Auditor-requested evidence available within the system for >95% of requests.

**Phase:** P1

---

### 4.7 Human Resources & Volunteer Management

#### 4.7.1 Officer Training and Onboarding
**Current Pain:** No structured onboarding for new clerks, treasurers, or department secretaries. No certification or renewal tracking. Training is ad hoc — a departing officer's verbal briefing, if you're lucky.

**Legacy Coverage:** None

**Theobase Response:** **Training Hub** — role-specific onboarding pathways with tracked-module completion. Certification issuance and renewal reminders. Integration with the officer registry so that an officer's training status is visible alongside their role assignment. Training content can be union-provided or linked from the GC Ministerial Association.

**Success Metric:** New-officer onboarding-pathway completion >80% within 30 days of appointment. Certification-expiry gap <60 days.

**Phase:** P1

---

#### 4.7.2 Volunteer Management and HR Tracking
**Current Pain:** No central roster, no skills database, no workload tracking. The same five people do everything until they burn out. New volunteers don't know where to plug in.

**Legacy Coverage:** None

**Theobase Response:** **Volunteer Registry** — member profiles with skills, spiritual gifts (self-identified), availability, and current assignments. Workload dashboard flags members carrying >3 concurrent roles. A "ministry-matching" tool suggests unfilled roles to members whose skills and availability align.

**Success Metric:** Volunteer-overload alerts actionable within 30 days. Role-vacancy duration reduced by >40%. Member-service participation rate measurable and trendable.

**Phase:** P2

---

#### 4.7.3 Volunteer Burnout and Workload Tracking
**Current Pain:** No rotation planning. No burnout indicators. The system doesn't see the volunteer until they resign or burn out silently.

**Legacy Coverage:** None

**Theobase Response:** Burnout-risk scoring based on role count, service duration without break, and attendance decline. Automated rotation suggestions. Mandatory sabbath-rest periods configurable by church policy. Wellness check-in prompts for volunteers flagged at risk.

**Success Metric:** Burnout-risk alerts triggered for all volunteers exceeding workload thresholds. Rotation-plan adoption >60% of flagged cases.

**Phase:** P3

---

#### 4.7.4 Digital Literacy Gaps
**Current Pain:** Low familiarity with digital tools among many officers, especially in rural or aging congregations. A powerful system is useless if officers can't operate it.

**Legacy Coverage:** None

**Theobase Response:** Built-in interactive tutorials ("show me, then let me try") for every role-specific workflow. Offline-accessible help content with illustrations and local-language voiceovers. A "practice mode" where officers can perform tasks with dummy data before going live. The interface itself is designed for progressive disclosure — basic tasks are simple, advanced features are discoverable but not in the way.

**Success Metric:** Task-completion rate >90% for first-time users on core workflows (count offering, record baptism, take minutes). Help-desk ticket volume from usability issues <10% of total tickets.

**Phase:** P1

---

### 4.8 Assets, Infrastructure & Logistics

#### 4.8.1 Asset and Property Management
**Current Pain:** Unclear ownership, missing maintenance records, expired insurance, no depreciation tracking. Church buildings, vehicles, and equipment are poorly catalogued.

**Legacy Coverage:** None

**Theobase Response:** **Asset Registry** — structured asset records with acquisition date, value, custodian, maintenance schedule, insurance policy linkage, and depreciation tracking. Maintenance alerts based on configurable schedules (e.g., "AC service due"). Insurance-expiry alerts at 90/60/30 days. Transfer-of-custody workflow when an asset changes hands.

**Success Metric:** Asset-registry completeness >90% of physical assets. Insurance-lapse incidents reduced to zero. Maintenance overdue <5% of scheduled tasks.

**Phase:** P2

---

#### 4.8.2 Inventory and Supplies Management
**Current Pain:** Literature stock, Dorcas supplies, communion supplies, and cleaning materials lack tracking. Reorders are reactive. Waste from over-ordering is common.

**Legacy Coverage:** None

**Theobase Response:** Inventory module with stock levels, reorder thresholds, and consumption tracking. Department-specific inventory views (Dorcas sees supplies; literature evangelist sees tracts and books). Consumption analytics help forecast needs and reduce waste.

**Success Metric:** Stock-out incidents for critical supplies <2 per year per church. Waste reduction measurable year-over-year.

**Phase:** P2

---

#### 4.8.3 Transportation and Logistics
**Current Pain:** Vehicle logs, fuel tracking, maintenance schedules, and travel claims are manual. Church-owned vehicles have no accountability.

**Legacy Coverage:** None

**Theobase Response:** Vehicle sub-module within the Asset Registry — trip logging, fuel-consumption tracking, maintenance scheduling, and travel-claim submission with approval workflow. Odometer readings can be captured via photo. Fuel-efficiency anomaly detection flags potential misuse.

**Success Metric:** Vehicle-log completeness >90% of trips. Fuel-anomaly alerts actioned within 7 days.

**Phase:** P2

---

#### 4.8.4 Physical Archive Digitization
**Current Pain:** Decades of paper records (membership, minutes, financials) in filing cabinets and boxes — deteriorating, unindexed, and unsearchable. No prioritized plan for digitization.

**Legacy Coverage:** None

**Theobase Response:** Digitization-playbook module — prioritized scanning workflow (what to scan first, at what resolution, with what metadata). Batch-import tools with validation rules. The system can ingest scanned membership registers, historical minutes, and legacy financial records into the relevant modules with provenance tags marking them as "imported historical."

**Success Metric:** Digitization-plan adoption by >50% of pilot churches. Critical records (baptisms, board minutes, property deeds) digitized within 2 years of onboarding.

**Phase:** P3

---

### 4.9 Technology, Security & Platform

#### 4.9.1 Records Migration and Legacy Import
**Current Pain:** Existing data in spreadsheets, paper, and legacy systems (ACMS extracts) must move into Theobase. No ETL pipelines, validation rules, or provenance tracking.

**Legacy Coverage:** None

**Theobase Response:** Import pipeline with structured templates, field-mapping wizards, and validation passes. Dry-run mode to preview before commit. Rollback capability if import errors are detected. Every imported record is tagged with provenance (source, date, operator).

**Success Metric:** Import error rate <1% of records. Import-completion time <1 week per church for existing digital records.

**Phase:** P1

---

#### 4.9.2 Offline Sync and Conflict Resolution
**Current Pain:** Many churches operate in low- or no-connectivity environments. A cloud-only system is useless when the internet is down — which is often.

**Legacy Coverage:** None

**Theobase Response:** Offline-first architecture — the full church instance runs locally on device(s) with a local database. When connectivity is available, data syncs to the cloud tier using CRDT-based or operational-transform conflict resolution. Deterministic merge rules handle concurrent edits (e.g., two clerks updating the same member record). A reconciliation UI surfaces unresolved conflicts for manual adjudication.

**Success Metric:** Offline operation with zero feature degradation for >72 continuous hours. Sync-conflict rate <0.1% of transactions. Unresolved-conflict backlog cleared within 7 days of connectivity restoration.

**Phase:** P1

---

#### 4.9.3 Data Privacy and Sovereignty
**Current Pain:** Per-country data-storage rules, consent-capture requirements, and export controls vary across the 200+ countries where the SDA Church operates. A centralized data model may violate local laws.

**Legacy Coverage:** None

**Theobase Response:** Jurisdiction-aware data-residency — union/mission administrators configure where their churches' data is stored (region, country, or on-premise). Consent-capture workflows at member onboarding and at each data-use boundary. Automated data-export tools for subject-access requests (SARs). Configurable retention and deletion policies per jurisdiction.

**Success Metric:** Data-residency compliance attestable per country. SAR-response time <30 days (GDPR-compliant). Zero data-residency violations detected in audits.

**Phase:** P2

---

#### 4.9.4 Encryption and Key Management
**Current Pain:** No clear encryption posture. Sensitive data (member records, financials) may be stored in plaintext. Key management is undefined.

**Legacy Coverage:** None

**Theobase Response:** Encryption at rest (AES-256) and in transit (TLS 1.3). Field-level encryption for highly sensitive fields (e.g., background-check results, disciplinary records). Key hierarchy with regular rotation. Documented key-recovery procedures. Union-level key escrow for disaster recovery.

**Success Metric:** Zero plaintext-sensitive-data incidents. Key-rotation compliance 100%. Key-recovery drill success rate 100%.

**Phase:** P1

---

#### 4.9.5 Identity Federation and SSO
**Current Pain:** Officers need yet another login. No integration with existing identity systems. Offline users face credential challenges.

**Legacy Coverage:** None

**Theobase Response:** Support for multiple identity providers (Google, Microsoft, Adventist Account if available). Offline credential fallback — local biometric or PIN unlock for already-authenticated sessions. Role-based access control (RBAC) with per-role scoping.

**Success Metric:** SSO adoption where identity providers exist. Offline-auth failure rate <1% of access attempts.

**Phase:** P2

---

#### 4.9.6 Interoperability and APIs
**Current Pain:** No documented APIs for unions, missions, or third-party systems. Data trapped in Theobase creates a new silo.

**Legacy Coverage:** None

**Theobase Response:** Public REST and GraphQL APIs with documented schemas. API-key lifecycle management. Rate limiting and usage quotas. Webhook subscriptions for event-driven integration. Union-level data-exchange endpoints for ACMS/SunPlus integration.

**Success Metric:** API documentation completeness 100%. API-uptime SLA >99.5%. Partner-integration time <2 weeks for documented use cases.

**Phase:** P2

---

#### 4.9.7 API Governance and Developer Portal
**Current Pain:** No API-keys lifecycle, no rate-limiting policy, no public developer documentation for unions and partners.

**Legacy Coverage:** None

**Theobase Response:** Developer portal with interactive API documentation, sandbox environments, API-key self-service, usage dashboards, and deprecation-notification channels. Rate limiting per key with graduated throttling.

**Success Metric:** Developer-portal time-to-first-successful-call <15 minutes. API-abuse incidents actionable within automated throttling.

**Phase:** P3

---

#### 4.9.8 Backup, Disaster Recovery, and Archival
**Current Pain:** No defined RTO/RPO. No automated exports. No independent archive for church data.

**Legacy Coverage:** None

**Theobase Response:** Automated backups with configurable frequency. Point-in-time recovery. Geo-redundant storage. Church-level data export in portable, open formats (CSV, JSON, PDF). Union-level archival with legal and ecclesial retention rules baked into the retention engine.

**Success Metric:** RTO <4 hours, RPO <1 hour. Backup-restore drill success 100% in quarterly testing. Export-portability verification automated and passing continuously.

**Phase:** P1

---

#### 4.9.9 Monitoring, Observability, and Incident Response
**Current Pain:** No metrics, alerts, runbooks, or on-call rotation for the platform. Issues are discovered by user reports.

**Legacy Coverage:** None

**Theobase Response:** Full observability stack — metrics (Prometheus), logging (structured JSON), tracing (OpenTelemetry). Proactive alerting on error-rate spikes, sync backlogs, and performance degradation. Public status page. Documented incident-response runbooks with on-call escalation.

**Success Metric:** Mean-time-to-detection (MTTD) <5 minutes for critical incidents. Mean-time-to-resolution (MTTR) <2 hours for P1 incidents. Status-page update within 15 minutes of incident declaration.

**Phase:** P2

---

#### 4.9.10 Testing, QA, and Release Management
**Current Pain:** No staging environment. No automated tests. Migration testing is manual. Releases are high-risk.

**Legacy Coverage:** None

**Theobase Response:** CI/CD pipeline with automated unit, integration, and end-to-end tests. Staging environment mirroring production topology. Canary deployments. Automated migration testing with production-data snapshots (anonymized). Rollback automation.

**Success Metric:** Test coverage >80% on critical paths. Zero P1 regressions reaching production. Release-cadence predictability ±1 day of scheduled date.

**Phase:** P2

---

#### 4.9.11 Device Management and Provisioning
**Current Pain:** No plan for how devices are issued, secured, and updated for clerks and treasurers, especially in low-connectivity areas.

**Legacy Coverage:** None

**Theobase Response:** Lightweight MDM strategy — Theobase can operate on church-owned tablets or officer-owned phones. A provisioning workflow guides first-time setup. Remote-wipe capability for lost devices (scoped to Theobase data only). Update-delivery via offline packages (USB/SD-card sideload) for no-connectivity environments. Device health dashboard for district IT champions.

**Success Metric:** Device-provisioning time <30 minutes per device. Security-patch latency <30 days for connected devices. Lost-device data-exposure incidents zero.

**Phase:** P2

---

#### 4.9.12 Cost Modeling and Operational Scaling
**Current Pain:** No predictable cost-per-church model. No burst-cost controls. No budget-alerting for unions paying for their churches.

**Legacy Coverage:** None

**Theobase Response:** Transparent cost model — per-active-member pricing or per-church flat rate. Usage dashboards for union administrators. Burst-cost caps and alerts. Cost-forecasting tools that project scaling costs as adoption grows.

**Success Metric:** Cost variance from forecast <10% per quarter. Union budget alerts triggered before overspend, not after.

**Phase:** P2

---

#### 4.9.13 Vendor Lock-In and Exit Strategy
**Current Pain:** Risk of lock-in to Cloudflare or other infrastructure providers. No defined migration path or exportable format.

**Legacy Coverage:** None

**Theobase Response:** Infrastructure-as-code (Terraform/Pulumi) for portability across cloud providers. Data in open, documented formats. Full church-level data export in structured, machine-readable formats. Documented migration playbook. Periodic portability testing.

**Success Metric:** Full data export <24 hours for any church. Migration to alternative provider demonstrated and documented. Portability test passing in every quarterly audit.

**Phase:** P3

---

#### 4.9.14 Fine-Grained Encryption Policy
**Current Pain:** No field-level encryption for the most sensitive fields. Key-recovery process undocumented.

**Legacy Coverage:** None

**Theobase Response:** Field-level encryption policy engine — administrators define which fields require FLE (e.g., background-check results, disciplinary notes, health information). Separate encryption keys per sensitivity tier. Documented, tested key-recovery procedure with dual-authorization.

**Success Metric:** All fields classified as "highly sensitive" are FLE-encrypted. Key-recovery drill success 100%. Recovery-access audit log complete and immutable.

**Phase:** P3

---

#### 4.9.15 Accessibility Compliance
**Current Pain:** No WCAG conformance. No low-literacy UX patterns. Visually-impaired and low-literacy users are excluded.

**Legacy Coverage:** None

**Theobase Response:** WCAG 2.1 AA compliance target. Screen-reader testing in CI pipeline. Low-literacy mode (icon + voice). High-contrast and large-text modes. Usability testing with target demographics.

**Success Metric:** WCAG 2.1 AA conformance for all core workflows. Usability-test success rate >90% for users with accessibility needs.

**Phase:** P3

---

### 4.10 Adoption, Training & Change Management

#### 4.10.1 Change Management and Adoption Incentives
**Current Pain:** No rollout playbook. No incentive for clerks and treasurers to abandon WhatsApp and spreadsheets. New systems fail because the human dimension is ignored.

**Legacy Coverage:** None

**Theobase Response:** Structured rollout playbook — pilot churches, champion training, parallel-run period, cutover, post-go-live support. Gamification and recognition for adoption milestones. The system must be demonstrably easier than the status quo — if a task takes longer in Theobase than on paper, volunteers will abandon it.

**Success Metric:** Pilot-to-full-adoption conversion rate >80%. User-reported "easier than before" satisfaction >70% in post-go-live surveys. WhatsApp/spreadsheet abandonment for covered workflows >80%.

**Phase:** P1

---

#### 4.10.2 Local Champion Accreditation Program
**Current Pain:** No formal recognition, micro-grants, or stipends for district champions who support rollouts. Champions burn out or go unrecognized.

**Legacy Coverage:** None

**Theobase Response:** Accredited Champion program — tiered certification (Bronze/Silver/Gold) with defined competencies. Stipend or micro-grant eligibility through union partnerships. Champion dashboard for tracking supported churches, issues resolved, and training delivered. Peer community (discussion forum, monthly calls).

**Success Metric:** Champion-to-church ratio <1:20. Champion retention rate >80% year-over-year. Champion satisfaction score >4/5.

**Phase:** P2

---

#### 4.10.3 Volunteer Support and Helpdesk
**Current Pain:** No tiered support. No SLAs. No local champions. When an officer gets stuck, they quit the tool.

**Legacy Coverage:** None

**Theobase Response:** Tiered support model — Tier 0 (in-app help, tutorials, FAQ), Tier 1 (local champion — trained super-user in the district), Tier 2 (union/mission helpdesk), Tier 3 (Theobase engineering). SLAs per tier. In-app support-ticket submission with screenshot and context capture. Offline ticket queuing.

**Success Metric:** Tier-0 resolution rate >60% of support requests. Tier-1 first-response <4 hours. Ticket-escalation rate to Tier 3 <10%.

**Phase:** P2

---

#### 4.10.4 Community Feedback and Product Governance
**Current Pain:** No structured feedback loops. No transparency into roadmap. Users feel unheard.

**Legacy Coverage:** None

**Theobase Response:** Public roadmap with voting. In-app feedback mechanism (" Was this helpful? What's missing?"). Union advisory board with rotating membership. Quarterly transparency reports (uptime, adoption numbers, top-requested features, what shipped).

**Success Metric:** Feedback acknowledged within 7 days. Advisory-board meeting cadence maintained. Roadmap-transparency survey score >4/5.

**Phase:** P2

---

#### 4.10.5 Leadership Buy-In and Governance of Theobase
**Current Pain:** No steering committee. No data-stewardship roles defined. Theobase itself needs governance.

**Legacy Coverage:** None

**Theobase Response:** Multi-level governance — Steering Committee (GC, union, mission representation), Data Stewardship Council (privacy, ethics, access policy), and Product Advisory Group (user representatives). Published terms of reference, meeting cadences, and decision-rights matrix.

**Success Metric:** Governance bodies constituted and meeting quarterly. Decision-rights matrix published and adhered to. Escalation paths documented and exercised.

**Phase:** P1

---

#### 4.10.6 Funding and Sustainability Model
**Current Pain:** Unclear recurring funding. Donor vs. subscription model unresolved. No long-term financial plan for the platform itself.

**Legacy Coverage:** None

**Theobase Response:** Transparent funding model — options include per-church subscription (sliding scale by size/region), union-level licensing, donor-funded core with paid premium features, or GC-funded public good. Published financial model with cost transparency and sustainability projections.

**Success Metric:** Funding model approved by governance body. Runway visibility >18 months at all times. Per-church cost predictability ±10%.

**Phase:** P1

---

### 4.11 Data & Analytics

#### 4.11.1 Data Integrity
**Current Pain:** Spreadsheets and paper create fragmentation, duplication, and data loss. No single source of truth. Reports built on stale, inconsistent data.

**Legacy Coverage:** Partially

**Theobase Response:** Canonical data model with validation rules, uniqueness constraints, and referential integrity. Duplicate-detection algorithms (fuzzy matching on name, birthdate, location). Data-quality dashboards showing completeness, freshness, and anomaly scores per church.

**Success Metric:** Duplicate-member-record rate <1%. Data-completeness score >90% for all required fields. Anomaly false-positive rate <5%.

**Phase:** P1

---

#### 4.11.2 Attendance and Engagement Analytics
**Current Pain:** No trend analysis, no retention metrics, no dashboards. A pastor cannot answer "Is our church growing or shrinking?" with data.

**Legacy Coverage:** ACMS (inst.)

**Theobase Response:** Attendance tracking (per service, per department) feeding into trend dashboards. Engagement scoring per member (attendance frequency, small-group participation, service involvement, giving patterns). Retention cohorts — track each baptism class through months 1/3/6/12. Automated anomaly detection for attendance dips.

**Success Metric:** Attendance-tracking adoption >80% of churches. Retention-cohort reports generated automatically. Anomaly alerts delivered to pastor/dashboard within 1 week of detection.

**Phase:** P2

---

#### 4.11.3 Cross-Church Data Consistency
**Current Pain:** Inconsistent formats, naming conventions, and reporting cycles across churches make aggregation impossible. "Sabbath School" vs. "SS" vs. "Sabbath school" — no standardization.

**Legacy Coverage:** None

**Theobase Response:** Canonical taxonomies for all data domains (ministry types, financial categories, member statuses). Union-level configuration of required taxonomies with per-church extensibility. Data-validation rules enforced at entry time, not at report time.

**Success Metric:** Cross-church aggregation accuracy >98%. Taxonomy-drift incidents (churches using nonstandard categories) <2%.

**Phase:** P2

---

#### 4.11.4 Measurement of Mission Impact
**Current Pain:** No standardized KPIs linking operational improvements to mission outcomes. We can't answer "Is this tool actually helping us make disciples?"

**Legacy Coverage:** None

**Theobase Response:** Mission-impact framework — a configurable set of KPIs that connect operational metrics (attendance, giving, service involvement) to mission outcomes (baptisms, retention, community impact). Dashboards at church, district, mission, and union levels. The framework is customizable per union while maintaining core-consistency for global aggregation.

**Success Metric:** Mission-impact dashboards reviewed quarterly by >50% of district pastors. Correlation analysis between operational health and mission outcomes published annually.

**Phase:** P3

---

### 4.12 Legal, Regulatory & Ethics

#### 4.12.1 Data Processing Agreements
**Current Pain:** No formal agreements between Theobase, missions, and unions for data stewardship. Ambiguous legal relationships.

**Legacy Coverage:** None

**Theobase Response:** Templated DPAs (Data Processing Agreements) for Theobase ↔ mission, mission ↔ union. Signoff workflow with version tracking. The system enforces data-access boundaries aligned with DPA terms.

**Success Metric:** Signed DPAs in place for 100% of operating jurisdictions. DPA-review cadence annual. Zero DPA-violation incidents.

**Phase:** P2

---

#### 4.12.2 Regulatory Compliance Across Jurisdictions
**Current Pain:** Tax, charitable-registration, and remittance rules vary per country. Noncompliance risks legal exposure.

**Legacy Coverage:** None

**Theobase Response:** Jurisdiction-aware compliance engine — union/mission administrators configure local tax rules, charitable-reporting requirements, and remittance formats. The system generates compliance-ready reports. Regulatory-change alerts when local law changes.

**Success Metric:** Compliance-report generation 100% automated. Regulatory-change adaptation <90 days from law change to system update.

**Phase:** P2

---

#### 4.12.3 Insurance and Liability Coverage
**Current Pain:** No legal review of liability for data breaches, incident-response costs, or pilot indemnities.

**Legacy Coverage:** None

**Theobase Response:** Legal-review workstream with published coverage summary — what is insured, what is not, and who bears liability at each tier (Theobase platform, union, mission, local church). Incident-response cost allocation defined in DPAs.

**Success Metric:** Insurance coverage documented and reviewed annually. Incident-response cost allocation tested in tabletop exercise.

**Phase:** P3

---

#### 4.12.4 Records Access Appeals and Dispute Resolution
**Current Pain:** No formal process for members to request corrections to their records, appeal denials, or escalate disputes.

**Legacy Coverage:** None

**Theobase Response:** Member-access portal — a member can view their own record and submit correction requests. Structured appeal workflow with escalation tiers. Every request, review, and decision is logged immutably. Configurable response SLAs.

**Success Metric:** Correction-request response <30 days for >95% of requests. Appeal-escalation breaches (missed response deadlines) <5%.

**Phase:** P3

---

#### 4.12.5 Ethical Use and Policy Guardrails
**Current Pain:** No limits on automation (e.g., automated disciplinary actions). No misuse-prevention framework.

**Legacy Coverage:** None

**Theobase Response:** Ethical-use policy embedded as system guardrails — automation cannot initiate disciplinary action, cannot revoke membership, cannot send mass communication without human approval. Audit log of all automated actions with human-review checkpoint for sensitive operations. Ethics-review board with veto power over new features.

**Success Metric:** Zero automated actions in prohibited categories. Ethics-review completion for 100% of new features before release. Guardrail-breach alerts triggered and resolved within 24 hours.

**Phase:** P2

---

#### 4.12.6 Archival and Retention Policy
**Current Pain:** Legal and ecclesial retention rules not codified. Data kept indefinitely or deleted prematurely.

**Legacy Coverage:** None

**Theobase Response:** Retention-policy engine — configurable rules per record type and jurisdiction (e.g., "membership records: retain for 100 years," "petty-cash receipts: retain for 7 years"). Automated archival and deletion workflows with review gates. Permanent archival for records of enduring ecclesial significance (baptisms, ordinations).

**Success Metric:** Retention-policy compliance >99%. Archival completeness for enduring records 100%. Deletion-policy audit passing in every annual review.

**Phase:** P3

---

#### 4.12.7 Data Access Governance
**Current Pain:** No approval workflows for sensitive data exports. No audit-committee oversight of who accessed what.

**Legacy Coverage:** None

**Theobase Response:** Sensitive-data access requires approval workflow with configurable approver chains (e.g., board chair + district pastor for a full membership export). All access events logged immutably. Periodic access-review reports for audit committees and data-stewardship councils.

**Success Metric:** Zero unauthorized sensitive-data accesses. Access-review cadence quarterly. Approval-workflow bypass incidents zero.

**Phase:** P2

---

#### 4.12.8 Child Protection and Consent Management
**Current Pain:** Consent capture is ad hoc. Background-check retention rules unclear. No systematic consent-renewal process.

**Legacy Coverage:** None

**Theobase Response:** Consent-management module — capture consent at member creation (or for existing members, at first login/onboarding). Consent versioning (when the privacy policy updates, consent is re-obtained). Parental-consent workflow for minors. Consent-expiry tracking. Integration with the Safety Vault for background-check consent.

**Success Metric:** Consent-capture rate >95% of members. Consent-renewal completion within 30 days of policy update. Minor-consent compliance 100%.

**Phase:** P2

---

## 5. Priority Phasing Roadmap

### Phase 1 — MVP: Operational Baseline *(Months 1–18)*
The minimum set of capabilities needed for a local church to replace paper and spreadsheets for core operations.

| Domain | Capability |
|---|---|
| Membership & Records | Membership Hub (records, transfers, attendance check-in) |
| Financial Stewardship | Finance Ledger (counting, receipts, remittances, audit trail) |
| Governance & Leadership | Governance Workspace (agendas, motions, minutes, action items) |
| Ministry Operations | Ministry Reporter (department activity logging, auto-generated reports) |
| Communication & Coordination | Communications Hub (calendar, announcements, archive) |
| Safety & Compliance | Safety Vault (child-protection training, background checks, incident reporting) |
| HR & Volunteer Mgmt | Training Hub (officer onboarding, certifications) + digital-literacy support |
| Technology & Security | Offline-first sync, encryption at rest/in transit, backup/DR, legacy import pipeline, records migration |
| Adoption & Change Mgmt | Rollout playbook, funding model, Theobase governance (steering committee) |
| Data & Analytics | Data integrity (validation, deduplication, quality dashboards) |

### Phase 2 — Scaling: Depth and Reach *(Months 12–36, overlapping with P1)*
Capabilities that significantly increase value, adoption, and the platform's ability to scale across unions.

| Domain | Capability |
|---|---|
| Membership & Records | Identity verification, discipleship/retention tracking |
| Financial Stewardship | Budgeting/planning, petty-cash controls, fundraising/donor management |
| Governance & Leadership | Succession planning, officer handover packets |
| Ministry Operations | Event planning, inter-department coordination, pastoral reporting |
| Communication & Coordination | Language localization, low-literacy UX, cultural-configuration engine |
| Safety & Compliance | Risk management, policy-compliance engine |
| HR & Volunteer Mgmt | Volunteer registry, workload tracking, champion accreditation |
| Assets & Logistics | Asset registry, inventory, transportation/vehicle management |
| Technology & Security | Data-residency, SSO/identity federation, APIs/interoperability, monitoring/observability, testing/QA, device management, cost-model transparency |
| Adoption & Change Mgmt | Champion program, tiered support/helpdesk, community feedback, product governance |
| Data & Analytics | Attendance/engagement analytics, cross-church data consistency |
| Legal & Regulatory | DPAs, regulatory compliance, ethical guardrails, data-access governance, child consent management |

### Phase 3 — Maturity: Completing the Vision *(Months 24–48)*
Capabilities that round out the platform for long-term sustainability, global coverage, and mission-level impact.

| Domain | Capability |
|---|---|
| Membership & Records | Cross-border membership movement protocol |
| Financial Stewardship | Procurement/vendor management, local tax automation |
| Governance & Leadership | Conflict-resolution workflows, district strategic planning |
| Safety & Compliance | Emergency-response coordination |
| HR & Volunteer Mgmt | Burnout risk scoring and rotation planning |
| Assets & Logistics | Physical-archive digitization playbook |
| Technology & Security | API governance/developer portal, vendor lock-in exit strategy, fine-grained encryption, accessibility compliance (WCAG 2.1 AA) |
| Legal & Regulatory | Insurance/liability coverage, records-access appeals, archival/retention policy engine |
| Data & Analytics | Mission-impact measurement framework |
| Communication & Coordination | Community moderation and misuse controls |

---

## 6. Gap-to-Metric Quick-Reference

| # | Gap | Legacy Coverage | Success Metric (Target State) | Phase |
|---|---|---|---|---|---|
| 1 | Membership records | ACMS (inst.) | >95% churches digital, transfer latency <48h | P1 |
| 2 | Financial transparency | SunPlus (inst.) | Remittance <7d, audit trail >99% | P1 |
| 3 | Board governance | None | Minutes >95% complete, action closure >80% | P1 |
| 4 | Ministry reporting | ACMS (inst.) | Report submission >90%, compilation time -80% | P1 |
| 5 | Communication & coordination | None | Single source >90% announcements, WhatsApp -50% | P1 |
| 6 | Officer training | None | Onboarding completion >80% in 30d | P1 |
| 7 | Child safety compliance | None | Training compliance >95%, background-check gap <30d | P1 |
| 8 | Audit readiness | Partially | Prep time -80%, evidence available >95% | P1 |
| 9 | Data integrity | Partially | Duplicates <1%, completeness >90% | P1 |
| 10 | Offline sync | None | Zero degradation for 72h offline, conflicts <0.1% | P1 |
| 11 | Encryption & security | None | Zero plaintext incidents, key rotation 100% | P1 |
| 12 | Backup & DR | None | RTO <4h, RPO <1h, restore drill 100% | P1 |
| 13 | Legacy data migration | None | Import error <1%, completion <1 week | P1 |
| 14 | Digital literacy | None | First-time task completion >90% | P1 |
| 15 | Adoption & change mgmt | None | Pilot conversion >80%, "easier than before" >70% | P1 |
| 16 | Leadership buy-in | None | Governance bodies active, decision rights published | P1 |
| 17 | Funding sustainability | None | Runway >18 months, cost predictability ±10% | P1 |
| 18 | Identity verification | None | Transfer disputes -80%, verify time <1h | P2 |
| 19 | Discipleship tracking | None | First-year retention measurable, alerts <30d | P2 |
| 20 | Budgeting & planning | SunPlus (inst.) | >80% churches with budget, variance automated | P2 |
| 21 | Petty cash controls | None | Discrepancies flagged in period, unreconciled <2% | P2 |
| 22 | Fundraising & donors | Partially | Restricted-fund compliance >99%, receipts <48h | P2 |
| 23 | Succession planning | None | Vacancy >30d <5%, handover packets >90% | P2 |
| 24 | Event planning | None | Overhead -50%, volunteer no-show reduced | P2 |
| 25 | Inter-department coordination | None | Collisions resolved <48h, collaborative events increase | P2 |
| 26 | Pastoral reporting | None | Visit-log >90%, time-to-awareness from weeks to days | P2 |
| 27 | Language & literacy | None | All union languages, low-literacy completion >90% | P2 |
| 28 | Cultural sensitivity | None | >95% adaptations configurable | P2 |
| 29 | Risk management | None | Incident-report completion >90% in 48h | P2 |
| 30 | Policy compliance | None | >90% violations prevented by system gates | P2 |
| 31 | Volunteer management | None | Overload alerts <30d, vacancy duration -40% | P2 |
| 32 | Asset management | None | Completeness >90%, insurance lapses zero | P2 |
| 33 | Inventory management | None | Stock-outs <2/yr, waste measurable | P2 |
| 34 | Transportation/logs | None | Trip-log >90%, fuel anomaly alerts <7d | P2 |
| 35 | Data privacy & sovereignty | None | Residency attestable, SAR <30d | P2 |
| 36 | Identity federation | None | SSO where available, offline-auth failure <1% | P2 |
| 37 | APIs & interoperability | None | Docs 100%, uptime >99.5%, partner integration <2wk | P2 |
| 38 | Monitoring & observability | None | MTTD <5min, MTTR <2h for P1 | P2 |
| 39 | Testing & QA | None | Coverage >80% critical, zero P1 regressions | P2 |
| 40 | Device management | None | Provisioning <30min, patch latency <30d | P2 |
| 41 | Cost modeling | None | Forecast variance <10%, alerts before overspend | P2 |
| 42 | Champion accreditation | None | Ratio <1:20, retention >80% | P2 |
| 43 | Support & helpdesk | None | Tier-0 >60%, Tier-1 <4h, escalation <10% | P2 |
| 44 | Community feedback | None | Acknowledged <7d, transparency score >4/5 | P2 |
| 45 | Attendance analytics | ACMS (inst.) | Adoption >80%, cohort reports automated | P2 |
| 46 | Cross-church consistency | None | Aggregation accuracy >98%, taxonomy drift <2% | P2 |
| 47 | Data processing agreements | None | Signed DPAs 100%, review annual | P2 |
| 48 | Regulatory compliance | None | Reports 100% automated, adaptation <90d | P2 |
| 49 | Ethical guardrails | None | Zero prohibited automated actions | P2 |
| 50 | Data access governance | None | Zero unauthorized accesses, review quarterly | P2 |
| 51 | Child consent management | None | Consent >95%, renewal <30d | P2 |
| 52 | Cross-border membership | ACMS (inst.) | Resolution <1wk, lost transfers <1% | P3 |
| 53 | Procurement & vendors | None | Cycle time measurable, no expired-contract renewals | P3 |
| 54 | Local tax automation | Partially | Errors <0.5%, withholding automated | P3 |
| 55 | Conflict resolution | None | Timelines measurable, escalation breaches <10% | P3 |
| 56 | District strategic planning | None | >60% districts with plan, quarterly reviews | P3 |
| 57 | Emergency response | None | Contact tree <1h, accountability >90% in 24h | P3 |
| 58 | Volunteer burnout | None | Alerts for all over-threshold, rotation >60% | P3 |
| 59 | Archive digitization | None | >50% churches with plan, critical records in 2yr | P3 |
| 60 | API governance portal | None | First-successful-call <15min, abuse actionable | P3 |
| 61 | Vendor lock-in exit | None | Full export <24h, migration demonstrated | P3 |
| 62 | Field-level encryption | None | All highly sensitive fields FLE, recovery drill 100% | P3 |
| 63 | Accessibility (WCAG) | None | AA conformance, usability >90% for accessibility needs | P3 |
| 64 | Insurance & liability | None | Coverage documented, tabletop exercise annually | P3 |
| 65 | Records access appeals | None | Correction response <30d >95%, escalation breaches <5% | P3 |
| 66 | Archival & retention | None | Compliance >99%, enduring records 100% archived | P3 |
| 67 | Mission impact measurement | None | Quarterly review >50% districts, annual correlation analysis | P3 |
| 68 | Community moderation | None | Zero unauthorized broadcasts, flag response <24h | P3 |

---

*Document version: v2.1 — added existing system coverage mapping (Section 3), Legacy Coverage tags on all gaps, and coverage column in quick-reference. All additions are grounded in Theobase's stated architectural strategy of middleware, policy encapsulation, and telemetry as an operational byproduct.*
