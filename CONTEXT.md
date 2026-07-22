# Theobase

A platform for Seventh-day Adventist church administration covering operations from Conference down to Member, with read-only aggregated reporting up to General Conference level. Modular by design: Finance, Membership, Organization Structure, Auth/Roles, and Audit/Reports as initial modules.

## Organization

**Conference**:
The administrative unit that owns churches, employs pastors, and receives tithe from local churches. The tenant boundary — all data lives in a per-Conference database.
_Avoid_: Mission, Field (technically synonyms in SDA polity, but "Conference" is canonical for this platform)

**District**:
A pastoral assignment grouping multiple churches under one pastor. Not a legal entity — has no treasury, bank account, or separate membership roll. A convenience for organizing churches and routing the district pastor's dashboard.
_Avoid_: Circuit, group

**Church**:
A local congregation. Has subtypes:

- **Organized Church**: A fully chartered congregation with its own treasury, bank account, membership roll, and church board.
- **Company**: A pre-church entity under direct Conference supervision. Has its own treasury and membership but hasn't yet met the requirements for full church status.
- **Branch**: A sub-group operating under a parent Organized Church. Shares the parent's treasury but maintains its own membership roll for tracking.
  _Avoid_: Congregation, assembly, parish

**Member**:
A baptized Seventh-day Adventist belonging to exactly one church at a time. Has a membership status — active, transferred (in/out), deceased, or removed. Joined via baptism (immersion) or profession of faith (previously baptized in another denomination). Belongs to a household and may hold one or more church positions.
_Avoid_: Parishioner, congregant, attendee

**Household**:
A family grouping of members within a church. One member is designated as head. Used for reporting, visitation, and directory organization.
_Avoid_: Family unit, home

**Position / Office**:
A role a member holds within their church (e.g., Elder, Treasurer, Clerk, Deacon). Per-member, many-to-many — a member can hold multiple positions simultaneously. Conference-level roles (President, Secretary, Treasurer, Auditor) are system roles, not church positions.
_Avoid_: Role (roles are system-level permissions; positions are church-level offices)

## Finance

**Tithe**:
Ten percent of a member's income, given as a sacred offering. Recorded at the local church but immediately forwarded to the Conference — the local church never spends tithe. Conference distributes it for pastoral salaries and remits portions to Union, Division, and General Conference.
_Avoid_: Church tax, contribution

**Local Church Budget**:
Offerings designated by members for running the local church — utilities, maintenance, supplies, local ministry. Stays at the church level. Expensed against budgeted categories authorized by the church board.
_Avoid_: Church spending, operating fund

**Sabbath School Offering**:
Weekly offering collected during Sabbath School classes, designated for world mission. Recorded at the local church and forwarded to the Conference.
_Avoid_: Mission offering, world budget (a distinct downstream category)

**Fund**:
A category that segregates financial transactions — Tithe, Local Church Budget, or Sabbath School. Each fund has a forwarding rule: stays local or forwards to Conference. Designated Offerings (building fund, ADRA, World Budget) are deferred to post-MVP.
_Avoid_: Account, ledger, bucket

**Offering Batch**:
A group of envelope-based contributions recorded together for a single Sabbath service. Requires dual-custody confirmation: entered by the Treasurer and confirmed by the Assistant Treasurer. Once dual-confirmed, the batch is locked and immutable.
_Avoid_: Deposit slip, collection record

**Dual-Custody**:
The Church Manual requirement that all church funds must be counted by at least two people. In the platform: the Treasurer submits an offering batch; the Assistant Treasurer (or another authorized second person) reviews and confirms it before it posts.
_Avoid_: Two-person rule, double-entry (accounting concept, not custody)

**Expense Category**:
A classification for church spending configured by the Conference — e.g., Utilities, Maintenance, Supplies, Evangelism. Used for budget tracking and reporting.
_Avoid_: Account code, cost centre

**Budget**:
An annual plan (January–December fiscal year) setting planned spending amounts per expense category. Voted by the church board. Conferences can define a default budget template that new churches inherit. Immutable once approved for the fiscal year.
_Avoid_: Forecast, spending plan

**Forwarding**:
The automatic movement of tithe and Sabbath School offerings from the church to the Conference. Happens silently upon dual-custody confirmation — no separate "forward" action required from the Treasurer. The Conference Treasurer reconciles forwarded amounts against bank deposits.
_Avoid_: Remittance, transfer (refers to member movement)

## Membership

**Baptism**:
The act by which a person joins the SDA church. Two types: immersion (new convert) and profession of faith (previously baptized in another denomination, affirming SDA beliefs). Recorded with date, officiating minister, and previous denomination if applicable.
_Avoid_: Christening, dedication

**Transfer**:
A multi-step workflow moving a member from one church to another. The sending church Clerk initiates; the Conference Secretary approves; the receiving church Clerk accepts at a church business meeting vote. During the workflow, the member's status reflects the current stage.
_Avoid_: Move, relocation

**Removal**:
A member leaving the church roll. Three paths: death (automatic), missing (flagged by Clerk, voted by church board), or apostasy (voluntary renunciation). All require appropriate authority.
_Avoid_: Deletion, expulsion

**Activity Log**:
The timeline of all changes to a member record — baptisms, transfers, office changes, status changes, contact updates. Surfaced on the member detail view and also feeds the audit trail.
_Avoid_: History, changelog

## Reporting

**Monthly Treasurer Report**:
An auto-generated report showing income by fund, expenses by category, opening/closing balances, and budget vs. actual. Presented by the Treasurer to the church board. Opening balance is auto-derived from the previous month's closing.
_Avoid_: Financial statement, monthly statement

**Quarterly Business Meeting Report**:
A combined membership + finance + officers report auto-generated from system data for presentation to the full congregation. The Clerk presents the membership section; the Treasurer presents finance. Zero manual compilation.
_Avoid_: Quarterly report, church report

**Audit Trail**:
An immutable log of every data change — who did what, when, before/after state (JSON), and which device. Append-only. Enables annual church audit and Conference-level review by the Auditor role.
_Avoid_: Change log, revision history

**Reconciliation**:
The act of comparing system-calculated balances against real bank balances. Happens at two levels: the Church Treasurer reconciles the Local Budget bank account monthly; the Conference Treasurer reconciles tithe forwarded by churches against deposits received.
_Avoid_: Balancing, matching
