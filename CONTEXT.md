# Theobase

A platform for local Seventh-day Adventist churches and companies to run daily operations — membership, finances, governance, ministry, and communication.

## Language

**Organisation**:
The top-level entity in Theobase. Types include: local church, company, conference/mission, union, division, general conference. Churches and companies are the operational units; conferences and above are the reporting and oversight tiers that consume remittances and aggregated data.
_Avoid_: Account, tenant, group, congregation

**Member**:
A person with a membership record at an organisation.
_Avoid_: User, contact, person

**Officer**:
A member appointed to hold one or more roles for a term. Officers perform the daily operations of the church: recording baptisms, counting offerings, taking minutes, etc.
_Avoid_: Admin, staff, leader, volunteer

**Role**:
A named position with defined responsibilities: clerk, treasurer, pastor, elder, deaconess, department secretary, etc.
_Avoid_: Permission group, title, job, function

**Membership Event**:
A point-in-time change to a member's status — baptism, profession of faith, transfer-in, transfer-out, death, or disciplinary removal. Each event is immutable and generates an auditable log entry.
_Avoid_: Record update, status change, lifecycle event

**Transaction**:
A single entry in the church financial ledger — income (tithe, offerings), expense (supplies, bills, petty cash), or transfer (remittance to the conference). Every transaction carries an immutable audit trail.
_Avoid_: Payment, entry, line item

**Meeting**:
A scheduled gathering of the church board (or committee) with an agenda. Produces motions and action items. Minutes are the compiled export of a meeting's record.
_Avoid_: Session, gathering, board

**Motion**:
A formal proposal put to a vote during a meeting. Records the text, mover, seconder, vote tally, and outcome (carried/defeated).
_Avoid_: Resolution, proposal, vote

**Action Item**:
A task assigned to an officer during a meeting, with a deadline and completion status. Carried forward to future agendas until resolved.
_Avoid_: Task, to-do, follow-up

**Department**:
A ministry area within the church — Sabbath School, AY, Health, Dorcas, Pathfinders, etc. Each has a department secretary (officer role) responsible for logging activities.
_Avoid_: Ministry, program, group

**Activity**:
A logged ministry event for a department — date, attendee count, topic, and any notes. Activities are the raw input; the quarterly ministry report is compiled from them. Subtypes include department programs (AY, Health) and Sabbath attendance check-in.
_Avoid_: Event, program, session

**Visit**:
A pastoral visit logged by a pastor or elder — which member was visited, purpose, duration, and follow-up needed. Feeds the district oversight dashboard.
_Avoid_: Call, check-in, appointment

**Clearance**:
A verified safety check for a member — background check, child-protection vetting, or equivalent. Carries an expiry date. A member without current clearance cannot be assigned to children's ministry roles.
_Avoid_: Background check, vetting, screening

**Training**:
A member's completion of a training module or certification pathway (e.g., officer onboarding, child-safety course). Tracks completion date and expiry. Linked to role eligibility.
_Avoid_: Course, certification, module

**Incident**:
A safety or risk event requiring a report — injury, property damage, financial irregularity, child-safety concern. Follows a configurable escalation path with mandated deadlines.
_Avoid_: Accident, issue, report

**Remittance**:
A batch of tithe and offering funds sent from the church to the conference or mission. Aggregates multiple income transactions, carries its own audit trail, and is calculated from the church ledger.
_Avoid_: Transfer, payment, submission

**Receipt**:
A document generated on demand for a member who gave (tithe or offering). Compiled from income transactions when requested — not a standalone record.
_Avoid_: Voucher, slip, acknowledgment

**Announcement**:
A broadcast message targeted to a department or the whole church. Archived and searchable. May be bridged to WhatsApp during transition.
_Avoid_: Notice, bulletin, message, post

**Calendar Event**:
A scheduled event on the shared church calendar — service, camp, training, rally. Can be scoped to one or more departments. Collision detection flags scheduling conflicts.
_Avoid_: Appointment, booking, meeting

**Fund**:
A designated account within the church ledger — tithe, local budget, building, Dorcas, Pathfinders, etc. A transaction may be split across multiple funds. Each fund has its own earmarking rules.
_Avoid_: Account, category, pot, bucket

**Audit Trail**:
An immutable, append-only log of every significant action in the system — who did what, when, with what approvals. Applies to membership events, transactions, motions, and incident reports. Enables audit-readiness without manual record-gathering.
_Avoid_: Log, history, journal

**Volunteer**:
A member who serves in a non-officer capacity — e.g., children's ministry helper, event staff, maintenance. Tracked separately from officers; may hold informal assignments rather than formal roles.
_Avoid_: Helper, worker, servant

**Budget**:
A planned allocation of funds per fund and category, approved by the church board. Variance is tracked against actual transactions in real time.
_Avoid_: Forecast, estimate, plan

**Asset**:
Church-owned property, equipment, or vehicle. Carries an acquisition date, value, custodian, maintenance schedule, and insurance linkage.
_Avoid_: Item, property, resource

**Policy Rule**:
A configurable requirement derived from the GC Working Policy or union policy, enforced by the system as a gate — e.g., quorum before voting, dual-signature for large disbursements.
_Avoid_: Validation, check, constraint

**Grievance**:
A confidential concern initiated by a member or officer, routed through a configurable escalation path (local elder → district pastor → mission committee). Each step has timers and escalation triggers.
_Avoid_: Complaint, dispute, issue

**Emergency**:
A declared crisis (natural disaster, security incident) that activates predefined response roles, contact trees, accountability checks, and broadcast templates.
_Avoid_: Disaster, crisis, alert

**Locale**:
A member's preferred language and cultural context — determines UI language, role labels, and workflow configuration. Stored per member, applied across all interfaces.
_Avoid_: Language, region, territory
