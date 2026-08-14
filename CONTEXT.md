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
An act that changes a person's membership state — baptism, re-baptism, profession of faith, transfer in/out, death, removal, or being marked missing. Each event requires its authorizing act (a church vote, a board vote, or a letter of transfer) to be recorded before the roll changes.

**Letter of transfer**:
The document by which a member or family moves membership from one congregation to another.

**Transfer**:
A two-sided membership event — the sending church votes and issues the letter, the receiving church votes and accepts it, and only then does the member settle on the new roll. Cancellable back to `Missing` if the member never arrives.

### Offices and governance

**Office**:
A role a person is appointed to, which gates what they can do in the system.
_Avoid_: Role, position, job

**Church clerk**:
The office responsible for the congregation's membership records.

**Church treasurer**:
The office responsible for the congregation's money.

**Church board**:
The body that authorizes certain actions — marking members missing, approving budgets.

**Church in session**:
The congregation voting in business meeting; authorizes baptisms, transfers, and removals.

**Dual signature**:
The requirement that two distinct, unrelated appointed people sign a cash count before it is valid.

### Finance

**Tithe**:
One-tenth of a member's income, given to the church; remitted almost entirely up the hierarchy.
_Avoid_: Tithing, dues

**Offering**:
A voluntary contribution beyond tithe, usually to a specific fund or purpose.

**Fund**:
A named category money is given to, with a policy-defined remittance split (local versus upward). The set of funds is the fund chart.
_Avoid_: Account, category, bucket

**Remittance**:
The money a lower unit sends up to its parent unit, according to policy-defined splits.

**Tithe & Offerings report**:
The monthly financial report a church submits to its conference or mission.

**Cash count sheet**:
The record of counting an offering, signed by two unrelated people.

**Donation**:
Money given to the church, optionally linked to a named giver (a Person or Family) via an envelope.
_Avoid_: Gift, contribution

**Envelope**:
A named tithe or offering envelope from a giver.

**Receipt**:
The record given to a donor for their donation, generated automatically.

**Disbursement**:
Money spent by the church, drawn from a fund or budget line; requires its authorizing approval and dual signature.
_Avoid_: Expense, payment, outlay

**Deposit**:
The record of banking counted cash — amount, date, bank reference, and a photo of the deposit slip as evidence — linking one or more cash counts to the bank.

### Policy

**Policy**:
The versioned rules a unit operates under — fund chart, offering calendar, remittance percentages, and reporting schedule — scoped to the unit tree with inheritance and overrides.

### Commercial

**Subscriber**:
A Conference or Mission that pays Theobase a recurring fee for access. The paying boundary is the same as the tenant boundary.
_Avoid_: Customer, client, payer, account, user

**Subscription**:
A Subscriber's recurring, paid access to Theobase, covering every module.
_Avoid_: License, plan, seat

**Subscription fee**:
The recurring charge for a Subscription — a flat monthly amount per Church. Only organized Churches are counted; Companies, Groups, and Branches are not.
_Avoid_: Price, rate, tariff

**Operated service**:
The hosted Theobase that a Subscriber pays for — hosting, backups, updates, sync aggregation, evidence storage, the policy-data feed, and support. The software itself is free and open.
_Avoid_: Cloud, hosted platform

**Self-hosting**:
Running Theobase on a Subscriber's own infrastructure at no subscription cost, instead of the operated service.
_Avoid_: On-premise
