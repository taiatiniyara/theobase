# Theobase

A global church utility platform for local Seventh-day Adventist congregations — a
digital filing cabinet that automates weekly operations without acting as a bank
or payment system.

## Language

### Organizational Structure

**Congregation**:
Any worship community regardless of organizational status.
_Avoid_: Church (ambiguous), Group, Assembly

**Local Church**:
An organized congregation with full governance rights (elected officers, own
board, can ordain elders).
_Avoid_: Church, Main Church, Organized Church

**Company**:
An unorganized congregation that reports directly to a Conference/Mission. Has a
subset of officers but cannot ordain its own elders.
_Avoid_: Church Plant, Unorganized Church, Mission Group

**Branch Sabbath School**:
A small outreach group operating under a parent Congregation or District. May
graduate into a Company, then a Local Church.
_Avoid_: Branch, Outreach Post, House Church

**Organization**:
Any denominational body above the local congregation level — Conference,
Mission, Union Conference, Division, or General Conference.
_Avoid_: Conference (ambiguous), Admin Body, Regional Office

**Conference / Mission**:
The denominational body directly above Districts and Congregations. Receives
quarterly statistical reports, holds tithe in trust, assigns pastors. "Mission"
is used in some world divisions in place of "Conference."
_Avoid_: Regional Body, Field Office

**District**:
A group of 3–8 Congregations sharing one pastoral charge. A District Pastor
oversees them.
_Avoid_: Pastoral Charge, Circuit, Zone

### People

**Person**:
Any individual recorded in the system — member, officer, volunteer, or community
contact.
_Avoid_: User, Contact, Record

**Member**:
A Person who has been baptized or accepted into membership by profession of
faith at a specific Congregation.
_Avoid_: Believer, Adherent, Attendee

**Household**:
A family unit linking multiple Persons. Used for giving summaries, pastoral
visits, and children's ministry tracking.
_Avoid_: Family, Home, Residence

**Officer**:
An elected role within a Congregation: Clerk, Treasurer, Elder, Deacon,
Deaconess, or Department Leader.
_Avoid_: Leader (ambiguous), Official, Staff

**Clerk**:
The Officer responsible for membership records, board minutes, and conference
statistical reports.
_Avoid_: Secretary, Church Clerk

**Treasurer**:
The Officer responsible for local church finances — receipt verification, fund
splits, audit preparation.
_Avoid_: Accountant, Bookkeeper

**Department Leader**:
An Officer leading a specific auxiliary ministry (Pathfinder Director, Sabbath
School Superintendent, Dorcas Coordinator, Health Ministries Leader).
_Avoid_: Department Head, Ministry Lead

**District Pastor**:
An ordained pastor overseeing multiple Congregations within a District.
_Avoid_: Pastor (ambiguous), Minister, Shepherd

**Volunteer**:
Any Member who serves in a non-officer capacity — platform duty, youth
assistance, AV operation, pantry work.
_Avoid_: Helper, Worker

**Candidacy**:
A progression from Bible study interest through baptismal preparation to a
recorded decision (baptism or profession of faith).
_Avoid_: Interest, Prospect, Baptism Pipeline

**Decision**:
A recorded spiritual commitment — baptism, profession of faith, or re-baptism —
tied to a specific date, officiating pastor, and Congregation.
_Avoid_: Conversion, Commitment, Altar Call

### Departments & Ministries

**Department**:
An auxiliary ministry within a Congregation: Pathfinders, Adventurers, Sabbath
School, Dorcas, Health Ministries.
_Avoid_: Ministry, Auxiliary, Group

**Department Membership**:
The assignment of a Person to a Department with an optional role (leader,
member, instructor).
_Avoid_: Department Roster, Ministry Assignment

**Pathfinders**:
A scouting-style youth ministry for ages 10–15+ with progressive class ranks
(Friend, Companion, Explorer, Ranger, Guide) and honors/merit badges.
_Avoid_: Youth Club, Scouts

**Adventurers**:
A scouting-style club for ages 6–9, feeding into Pathfinders.
_Avoid_: Junior Pathfinders, Little Lambs

**Sabbath School**:
The weekly Bible study program divided into age-tiered divisions (Beginners,
Kindergarten, Primary, Juniors, Earliteen, Youth, Adult).
_Avoid_: Sunday School, Bible Class

**Sabbath School Division**:
An age-grouped class within Sabbath School (e.g. Adult Division, Primary
Division).
_Avoid_: Class, Group, Sabbath School Department

**Dorcas / Community Welfare**:
A society managing charitable assistance — food pantries, financial aid,
clothing distribution.
_Avoid_: Welfare Department, ADRA (ADRA is a separate global entity), Charity

**Health Ministries**:
A department organizing health expos, cooking schools, and community health
screenings.
_Avoid_: Health Department, Medical Ministry

### Governance

**Board Meeting**:
A convened session of the Congregation's board, requiring a quorum, with an
agenda, minutes, and recorded decisions.
_Avoid_: Committee Meeting, Elder's Meeting

**Board Agenda**:
An ordered list of items to be discussed or voted on at a Board Meeting.
_Avoid_: Schedule, Docket

**Board Minute**:
A written record of discussions and decisions from a Board Meeting.
_Avoid_: Note, Record, Proceedings

**Board Decision**:
A voted resolution within a Board Meeting, recorded in the minutes with the
mover, seconder, and vote outcome.
_Avoid_: Resolution, Ruling, Action Item

**Quorum**:
The minimum number of board members required to be present for a Board Meeting
to conduct binding business, as defined by the Church Manual.
_Avoid_: Minimum Attendance, Threshold

**Nominating Committee**:
A confidential committee convened annually or biennially to select candidates
for all elected Officer positions.
_Avoid_: Election Committee, Nomination Board

**Ballot**:
A confidential vote cast within the Nominating Committee process.
_Avoid_: Vote, Selection

### Finance

**Tithe**:
10% of a member's income, given through the local Congregation but forwarded to
the Conference/Mission. Theobase does not process tithe — it records the
member's declared intent on their receipt.
_Avoid_: Donation (ambiguous), Contribution

**Offering**:
A voluntary gift designated to a specific fund: Church Budget, Pathfinders,
Sabbath School, ADRA.
_Avoid_: Donation (ambiguous), Gift, Contribution

**Fund Split**:
The breakdown of a single bank transfer into its designated allocations (e.g.
$70 Tithe, $20 Church Budget, $10 Pathfinders).
_Avoid_: Allocation, Breakdown, Envelope Split

**Digital Tithe Envelope**:
The member-facing metaphor for uploading a bank transfer receipt with a declared
Fund Split.
_Avoid_: Virtual Envelope, E-Envelope, Digital Offering Bag

**Receipt**:
A screenshot or photo of a confirmed bank transfer uploaded by a Member.
_Avoid_: Proof of Payment, Screenshot, Bank Confirmation

**Receipt Verification**:
The Treasurer's act of cross-referencing a Receipt image against the official
bank statement and approving or rejecting the submitted Fund Split.
_Avoid_: Approval, Reconciliation, Audit Check

**Audit**:
A periodic review of a Congregation's financial records by a Regional Auditor
from the Conference, requiring linked Receipt images, bank statements, and Board
Decisions.
_Avoid_: Review, Inspection, Financial Check

### Sabbath Operations

**Service Platform**:
The main worship service — includes preaching, music, scripture reading, and AV
presentation. Coordinated via a Duty Rota.
_Avoid_: Service, Program, Divine Service

**Duty Rota**:
The schedule assigning Volunteers and Officers to specific Service Platform
duties for a given Sabbath.
_Avoid_: Roster, Schedule, Platform Plan

**Duty Slot**:
A single assignable role on a Duty Rota: elder of the day, preacher, deacon,
musician, AV operator.
_Avoid_: Assignment, Position, Task

**Duty Swap**:
The reassignment of a Duty Slot from a Volunteer who declines to a
pre-qualified substitute.
_Avoid_: Substitution, Trade, Exchange

**Pulpit-to-AV Sync**:
A real-time connection between the Service Platform order of service at the
pulpit and the presentation software in the AV booth.
_Avoid_: Slide Sync, Worship Sync, AV Link

**Communion Service**:
The quarterly Ordinance of Humility including venue splits, towel inventories,
bread/wine preparation, and room transitions.
_Avoid_: Lord's Supper (ambiguous across denominations), Ordinance Service

### Membership

**Membership Roll**:
The official list of Members for a Congregation.
_Avoid_: Member List, Church Register

**Letter of Transfer**:
A formal request from a Member's current Congregation to a receiving
Congregation to transfer membership.
_Avoid_: Transfer Request, Membership Move

**Transfer Reception**:
The receiving Congregation's formal acceptance of an incoming Member via Letter
of Transfer.
_Avoid_: Acceptance, Receiving, Welcome

**Membership Discipline**:
A confidential process for addressing member conduct under Church Manual policy,
requiring specific record-keeping.
_Avoid_: Church Discipline (too broad), Censure, Removal

### Welfare

**Welfare Case**:
A confidential record of assistance provided to an individual or Household —
food, financial aid, or other support.
_Avoid_: Assistance Record, Charity Case

**Pantry Inventory**:
Tracked food and supply stock managed by the Dorcas / Community Welfare
department.
_Avoid_: Stock, Supplies, Food Bank

### Events & Outreach

**Health Expo**:
A community event offering health screenings and lifestyle education. Generates
contact data for follow-up.
_Avoid_: Health Fair, Screening Event

**Campout**:
An overnight Pathfinder/Adventurer event requiring permission slips, uniform
lists, and activity rosters.
_Avoid_: Camp, Camping Trip, Camporee (a larger regional event)

**Evangelistic Series**:
A multi-day public outreach event (often with a visiting speaker) where Bible
study interests are collected and Decisions are recorded.
_Avoid_: Crusade, Campaign, Series

### Safety & Compliance

**Safety Clearance**:
A background check or child protection certification required for Volunteers
working with minors. Has an expiration date.
_Avoid_: Background Check, Screening, Vetting

**Church Manual**:
The official SDA denominational governance document specifying officer duties,
quorum requirements, financial controls, and membership procedures.
_Avoid_: Manual, Policy Book

**Working Policy**:
The operational policy document for a specific Division or Union, extending the
Church Manual with regional requirements.
_Avoid_: Policy, Regional Rules
