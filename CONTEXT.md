# Theobase

An information system serving the grassroots of the Seventh-day Adventist Church's global hierarchy: raw data captured at the local level is aggregated upward through the organizational structure, with official church policy woven into the software so compliance is enforced by the system rather than by human diligence.

## Language

### The hierarchy

**Unit**:
A node in the Adventist organizational hierarchy — a governing body or a congregation. Every unit has a kind and, except the General Conference, exactly one parent unit. All data aggregation follows parent links upward.
_Avoid_: Organization, entity, node, body

**Unit kind**:
The type of a unit, drawn from a fixed vocabulary. A unit's kind determines whether it holds a membership roll and which kinds may legally be its parent.

### Unit kinds

**General Conference (GC)**:
World headquarters; the root of the hierarchy.

**Division**:
A regional body (thirteen worldwide) below the General Conference.

**Union**:
A national or regional body; subtypes Union Conference and Union Mission.

**Conference**:
A local administrative body; subtypes Conference, Mission, and Field.

**District**:
A pastor's cluster of congregations; a pastoral overlay that does not hold a membership roll.

**Church**:
An organized congregation with its own membership roll.

**Company**:
A congregation organized below full church status, holding its own membership roll.

**Group**:
A congregation not yet organized; does not hold its own roll.

**Branch**:
A satellite outreach point of a parent congregation; its people belong to the parent's roll.

### Membership

**Person**:
A human record, whether or not they hold membership — a member, a nonmember family member, or a contact.
_Avoid_: User, account, individual

**Family**:
A household of people who share an address and a head of household, and transfer between congregations as one unit.
_Avoid_: Household, home

**Member**:
A person whose membership is recorded on exactly one congregation's membership roll.
_Avoid_: Person, congregant, adherent

**Membership roll**:
The set of members recorded against a single membership-holding unit.
_Avoid_: Register, list, roster

**Membership event**:
An act that changes a person's membership state — baptism, re-baptism, profession of faith, transfer in/out, death, removal, or being marked missing. Each event carries its authorizing act — a church vote, a board vote, or a letter of transfer — except death, which the clerk records without one.

**Letter of transfer**:
The document by which a member or family moves membership from one congregation to another.

**Transfer**:
A two-sided membership event — the sending church votes and issues the letter, the receiving church votes and accepts it, and only then does the member settle on the new roll. Until the letter is accepted, the member remains on the granting church's roll.

### Events

**Event**:
The append-only record of something that happened — a membership event or a finance event — carrying its date, its author, and its evidence or authorizing act.
_Avoid_: Transaction, record, entry

**Correcting event**:
An event recorded to void or reverse an earlier event; corrections add to the log, they never edit it.
_Avoid_: Edit, undo, fix

### Offices and governance

**Office**:
An appointment a person holds at a single unit, which grants the ability to perform certain actions. Offices are scoped to the unit kind where held — a Church Treasurer and a Conference Treasurer are different offices. An office gates who may *act*; it does not record authorization.
_Avoid_: Role, position, job, permission

**Action**:
A granular thing a person can do in the system — record a baptism, sign a cash count, approve a disbursement. Actions are declared by the core and modules; policy maps each office to the actions it may perform.
_Avoid_: Capability, permission, operation

**Authorizing act**:
The recorded prerequisite that makes an action valid — a board vote, a session vote, a letter of transfer, or a dual signature. It rides as evidence on the event, not as a permission on the person.
_Avoid_: Approval, sign-off

**Appointment**:
The recorded event that places a person into an office at a unit, carrying its authorizing act (a board or session vote) and an effective period. A person's power to act flows only from a current appointment.
_Avoid_: Assignment, role grant

**Provisioning**:
Binding an officer's device key to their appointment at a unit, via a code or QR, so the officer can act. A device is just where a key lives — a shared church phone holds several keys, a personal phone holds one.
_Avoid_: Registration, sign-up

**Sync-lease**:
The policy-scoped period (default 90 days) a device's authority lasts without syncing; it renews on every sync and lapses — a warning first, then a block on writing — if the device stays offline too long.
_Avoid_: Session, token

**Church clerk**:
The office responsible for the congregation's membership records.

**Church treasurer**:
The office responsible for the congregation's money.

**Counter**:
The office responsible for counting tithe and offerings in the counting room; a cash count requires two unrelated counters to sign (dual signature).
_Avoid_: Teller, cashier

**Church board**:
The body that authorizes certain actions — recording resignations, approving budgets.

**Church in session**:
The congregation voting in business meeting; authorizes baptisms, transfers, removals, and marking members missing.

**Auditor**:
A person granted read-only access to the giving records and cash counts of the churches they are assigned to audit.

**Dual signature**:
The requirement that two distinct, unrelated appointed people sign a cash count before it is valid. _Distinct_ means two different people; _unrelated_ means not members of the same Family. The system enforces both at signing time.

### Finance

**Tithe and Offerings**:
The two kinds of money a member gives to the church — tithe (returned) and offerings (voluntary gifts) — recorded together. A giver's combined record is their giving history.
_Avoid_: Donation, contribution

**Tithe**:
One-tenth of a member's income, returned to the church; remitted almost entirely up the hierarchy.
_Avoid_: Tithing, dues

**Offering**:
A voluntary gift beyond tithe, usually designated to a specific fund or purpose. A giver's offerings are their gifts.
_Avoid_: Donation

**Fund**:
A named category money is given to, with a policy-defined remittance split. Tithe is remitted 100% upward; offerings split between local and upward per the offering plan. The set of funds is the fund chart.
_Avoid_: Account, category, bucket

**Fund chart**:
The set of funds a unit operates under, each with a type (tithe or offering) and a remittance split (local versus upward). Policy data, versioned and tree-scoped.
_Avoid_: Account list, category list

**Remittance**:
The money a lower unit sends up to its parent unit, according to policy-defined splits.

**Tithe & Offerings report**:
The monthly financial report a church submits to its conference or mission.

**Cash count**:
The session of counting tithe and offerings: opened by a counter, tallied independently by two counters, committed when both confirm — or after a joint reconcile on a mismatch — and later deposited. The two confirmations are the events; the cash count sheet is its projection.
_Avoid_: Giving batch, batch

**Cash count sheet**:
The record of counting tithe and offerings, signed by two unrelated people.

**Envelope**:
A named tithe or offering envelope from a giver.

**Receipt**:
The record given to a giver for their tithe and offerings, generated automatically.

**Disbursement**:
Money spent by the church, drawn from a fund or budget line; requires its authorizing approval and dual signature.
_Avoid_: Expense, payment, outlay

**Deposit**:
The record of banking counted cash — amount, date, bank reference, and a photo of the deposit slip as evidence — linking one or more cash counts to the bank.

### Policy

**Policy**:
The versioned rules a unit operates under — fund chart, offering calendar, remittance percentages, and reporting schedule — scoped to the unit tree with inheritance and overrides.

**Obligation**:
A policy-defined requirement on a unit — a monthly report due, an offering to be counted, a vote to be held — satisfied by recording its matching event in the log.
_Avoid_: Task, duty, to-do

**Policy package**:
The versioned, tree-scoped bundle of policy data — fund chart, offering calendar, remittance split, reporting schedule, and office-to-action map — distributed as a data feed, separate from the code.
_Avoid_: Config, settings

### Commercial

**Subscriber**:
A Conference or Mission that pays Theobase a recurring fee for access. The paying boundary is the same as the tenant boundary.
_Avoid_: Customer, client, payer, account, user

**Tenant**:
A Conference or Mission whose data, policy, and officers are isolated from every other tenant; levels above the Conference read aggregates across tenants.
_Avoid_: Account, workspace

**Subscription**:
A Subscriber's recurring, paid access to Theobase, covering every module.
_Avoid_: License, plan, seat

**Subscription fee**:
The recurring charge for a Subscription — a flat monthly amount per Church. Only organized Churches are counted; Companies, Groups, and Branches are not.
_Avoid_: Price, rate, tariff

**Operated service**:
The hosted Theobase that a Subscriber pays for — hosting, backups, updates, sync aggregation, evidence storage, the policy-data feed, and support. The software itself is free and open.
_Avoid_: Cloud, hosted platform

**Operator**:
Taia Tiniyara's own staff, who run the operated service — placing conferences, seeding demo data, purging churches, watching cost and health. The operator is not a church office.
_Avoid_: Admin, superuser

**Placement request**:
A Conference's claim to be placed in the hierarchy before billing activates it — name, territory, and a suggested parent. No unit is created until an operator places it.
_Avoid_: Application, sign-up

**Constituted**:
A unit's state after placement but before billing activation — registered, not yet operational.
_Avoid_: Pending, draft

**Organized**:
A unit's activated state; only an organized Conference may add churches.
_Avoid_: Active, live

**Tenant lifecycle**:
The path a Conference or Mission walks from claim to operation: placement request, operator placement (constituted), billing activation (organized), and church provisioning.
_Avoid_: Onboarding flow, funnel

**Self-hosting**:
Running Theobase on a Subscriber's own infrastructure at no subscription cost, instead of the operated service.
_Avoid_: On-premise
