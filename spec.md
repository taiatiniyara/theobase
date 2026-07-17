## Problem Statement

Seventh-day Adventist churches worldwide manage operations through fragmented tools — spreadsheets, paper records, email chains, and legacy software that doesnt talk to each other. Church clerks and treasurers spend hours manually compiling reports, tracking attendance, recording tithes, and coordinating schedules. Members feel disconnected from their church community, with no easy way to access directory information, see upcoming events, track their spiritual journey, or contribute to ministry.

The denominational hierarchy (Local Church → Conference → Union → Division → General Conference) requires data to roll up for reporting and compliance, but this is done through manual aggregation, causing delays and errors. Conference administrators lack real-time visibility into church health across their territory.

The result: overwhelmed church staff, disengaged members, and leadership flying blind.

## Solution

Theobase is a global, offline-first Progressive Web App that unifies all church operations into a single, delightful platform. It serves as the single source of truth for church data while making every member feel connected to their church community.

Theobase eliminates tedious work through automation (instant reports, automated reminders, automatic compliance) and distributes work across the congregation (role rotation, volunteer sign-ups, shared stewardship) so no one person is overwhelmed.

Built on Cloudflare infrastructure (Workers, D1, KV, R2, Pages), Theobase works offline and syncs when connectivity returns, making it viable for churches in developing regions with poor internet. The platform serves the entire denominational hierarchy with hierarchical data roll-up, role-based access control, and conference-level reporting.

Theobase is lovable (delightful UX, personal, intelligent, community-focused), shareable (member invitations, church referrals, conference-driven adoption), and indispensable (single source of truth, automation, compliance, member expectations, mission effectiveness).

## User Stories

### Admin (Church Clerk/Treasurer/Pastor)

1. As a church clerk, I want to manage member profiles with contact info and spiritual status, so that I have an accurate directory
2. As a church clerk, I want to record member transfers (in/out), so that membership rolls stay current
3. As a church clerk, I want to generate membership reports instantly, so that I can submit conference reports without manual compilation
4. As a church treasurer, I want to record tithes and offerings per member, so that I can track stewardship
5. As a church treasurer, I want to generate giving statements for members, so that they have tax documentation
6. As a church treasurer, I want to generate financial reports (income, expenses, budget vs actual), so that I can manage church finances
7. As a pastor, I want to schedule Sabbath services and assign roles (greeter, usher, prayer leader), so that services run smoothly
8. As a pastor, I want to see attendance trends, so that I can understand church health
9. As a pastor, I want to send announcements to the congregation, so that everyone is informed
10. As a department leader, I want to schedule events for my ministry, so that members can participate
11. As a church clerk, I want the system to send automated reminders for upcoming events and deadlines, so that I dont have to manually track
12. As a church clerk, I want members to self-report their attendance, so that I dont have to manually record it
13. As a church treasurer, I want members to self-report their giving, so that I dont have to manually record it
14. As a church clerk, I want to assign roles to volunteers with rotation managed by the system, so that no one is overburdened
15. As a church clerk, I want to see who is responsible for each task, so that ownership is clear
16. As a church clerk, I want to hand off tasks to other team members easily, so that work continues when Im unavailable
17. As a church administrator, I want to set up the system in under 5 minutes, so that I can see value immediately
18. As a conference administrator, I want to see aggregated reports from all churches in my conference, so that I can monitor church health
19. As a conference administrator, I want to invite churches to join the platform, so that adoption grows
20. As a church clerk, I want the system to automatically compile conference-required reports, so that compliance is effortless

### Member

21. As a member, I want to see a personalized welcome when I open the app, so that I feel connected to my church
22. As a member, I want to see the church directory, so that I can connect with other members
23. As a member, I want to see upcoming events and services, so that I can plan to attend
24. As a member, I want to see announcements and prayer requests, so that I can stay informed and pray for others
25. As a member, I want to track my attendance, so that I can see my engagement pattern
26. As a member, I want to track my giving (tithes and offerings), so that I can be a faithful steward
27. As a member, I want to see my spiritual journey milestones (baptism, membership, service), so that I can reflect on my growth
28. As a member, I want to receive personalized notifications about events I care about, so that I dont miss important things
29. As a member, I want to sign up for volunteer opportunities, so that I can serve in my church
30. As a member, I want to see my role assignments (Sabbath duties, ministry team), so that I know when its my turn to serve
31. As a member, I want to join the church via an invitation link or church code, so that I can easily get started
32. As a member, I want to use the app offline, so that I can access my data even without internet
33. As a member, I want my data to sync automatically when I reconnect, so that everything stays up to date
34. As a member, I want to share testimonies or prayer requests with the church, so that I can connect spiritually
35. As a member, I want to see small group information, so that I can participate in community
36. As a member, I want to access devotionals and spiritual resources, so that I can grow in my faith
37. As a member, I want to use the app on my phone, so that I can access it anytime, anywhere
38. As a member, I want the app to be intuitive and require no training, so that I can start using it immediately
39. As a member, I want to invite other members to join, so that our church community grows on the platform
40. As a member, I want to see my churchs mission impact, so that I can feel part of something bigger

### Department Leader (Sabbath School, AY, Pathfinders, etc.)

41. As a Sabbath School superintendent, I want to manage class rosters and attendance, so that I can track participation
42. As a Sabbath School superintendent, I want to assign teachers to classes, so that each class has leadership
43. As an AY leader, I want to plan weekly programs and assign participants, so that services are engaging
44. As a Pathfinders director, I want to track member advancements and awards, so that I can recognize achievements
45. As a Pathfinders director, I want to manage camp registrations and payments, so that events run smoothly
46. As a department leader, I want to communicate with my team via the app, so that coordination is easy
47. As a department leader, I want to see participation trends in my ministry, so that I can improve engagement

### Conference/Union/Division Administrator

48. As a conference president, I want to see aggregated membership and financial reports across all churches, so that I can make informed decisions
49. As a conference treasurer, I want to track remittances from churches, so that I can manage conference finances
50. As a union president, I want to see reports from all conferences in my union, so that I can monitor regional health
51. As a division officer, I want to see global statistics, so that I can report to General Conference
52. As a conference administrator, I want to manage the organizational hierarchy (add/remove churches, restructure), so that the system reflects reality
53. As a conference administrator, I want to enforce compliance requirements, so that churches submit required reports
54. As a conference administrator, I want to communicate with all church clerks in my conference, so that information flows efficiently

### General Conference Administrator

55. As a GC officer, I want to see global church statistics, so that I can report to the world church
56. As a GC officer, I want to manage the global organizational structure (divisions, unions), so that the system is accurate

### Collaboration & Work Distribution

57. As a church clerk, I want to assign tasks to team members with clear deadlines, so that work is distributed
58. As a team member, I want to see my assigned tasks on a personal dashboard, so that I know whats expected
59. As a team member, I want to receive notifications when a task is assigned to me, so that I can act promptly
60. As a team member, I want to mark tasks as complete, so that the team knows the work is done
61. As a church clerk, I want to see task progress across the team, so that I can identify bottlenecks
62. As a team member, I want to hand off a task to someone else if Im unavailable, so that work continues
63. As a church clerk, I want to set up role rotation (e.g., monthly greeter schedule), so that the system manages it automatically
64. As a team member, I want to see my upcoming role assignments, so that I can prepare
65. As a team member, I want to swap shifts with another volunteer, so that we can accommodate each others schedules

### Automation & Intelligence

66. As a church clerk, I want the system to automatically generate monthly membership reports, so that I dont have to manually compile them
67. As a church treasurer, I want the system to automatically calculate quarterly giving totals for each member, so that tax statements are accurate
68. As a pastor, I want the system to suggest optimal service schedules based on volunteer availability, so that I dont have to manually coordinate
69. As a church clerk, I want the system to send automated reminders to members with upcoming role assignments, so that theyre prepared
70. As a church clerk, I want the system to flag members who havent attended in 3 months, so that I can reach out pastorally
71. As a church treasurer, I want the system to flag unusual giving patterns (sudden drop), so that I can check in with the member
72. As a pastor, I want the system to surface key insights (attendance trends, giving patterns, member engagement), so that I can focus on ministry
73. As a conference administrator, I want the system to automatically compile conference reports from church data, so that I dont have to chase clerks

### Virality & Adoption

74. As a church clerk, I want to invite members via email or SMS, so that they can join the platform easily
75. As a member, I want to invite other members via a shareable link, so that our church community grows
76. As a church clerk, I want to generate a church code that members can use to self-join, so that onboarding is frictionless
77. As a conference administrator, I want to recommend Theobase to other conferences, so that the platform spreads
78. As a member, I want to share my spiritual milestones (baptism anniversary, service achievements), so that I can inspire others
79. As a church clerk, I want the platform to showcase our church to visitors (public directory, event pages), so that we can attract new members

### Mobile & Offline

80. As a member, I want the app to work on my phone without installing from an app store, so that its easy to access
81. As a member, I want the app to work offline, so that I can access my data in areas with poor connectivity
82. As a member, I want the app to sync automatically when I reconnect, so that my data is always current
83. As a church clerk, I want to use the app on my phone during Sabbath services, so that I can record attendance on the go
84. As a member, I want push notifications for important updates, so that I dont miss critical information

### Spiritual Formation

85. As a member, I want to track my spiritual journey (baptism, membership, service milestones), so that I can reflect on my growth
86. As a pastor, I want to see the spiritual health of my congregation (baptisms, members serving, etc.), so that I can focus on discipleship
87. As a member, I want to set spiritual growth goals, so that I can intentionally grow in my faith
88. As a pastor, I want to connect members with discipleship resources based on their journey stage, so that they grow effectively

### Compliance & Reporting

89. As a church clerk, I want the system to automatically generate Annual Church Report data, so that compliance is effortless
90. As a conference administrator, I want to see which churches have submitted required reports, so that I can follow up
91. As a church treasurer, I want the system to generate tax-compliant giving statements, so that members have proper documentation
92. As a conference treasurer, I want to track remittances from each church, so that I can manage conference finances
93. As a union administrator, I want to see aggregated reports from all conferences, so that I can report to the division

### Data Management

94. As a church clerk, I want to bulk-import members from a spreadsheet, so that initial setup is fast
95. As a church clerk, I want to export data (member directory, financial reports) to spreadsheet format, so that I can work with it offline
96. As a conference administrator, I want to merge or split churches in the system, so that the org structure stays accurate
97. As a system administrator, I want to manage the organizational hierarchy (add divisions, unions, conferences), so that the system reflects the denomination

## Implementation Decisions

### Architecture

- **Stack:** Cloudflare Workers + D1 + KV + R2 + Pages
- **Database:** Single D1 database with materialized path hierarchy for multi-tenancy
- **Org Hierarchy:** GC → Division → Union → Conference/Mission → Church → Branch (variable depth, levels can be skipped)
- **Org Types:** general_conference, division, union, conference, mission, church, branch, institution
- **Districts:** Not org nodes — pastoral relationships (many-to-many: pastor ↔ churches)
- **Multi-tenancy:** Row-level isolation via org_id + org_path columns on all data tables
- **Hierarchical Queries:** Materialized path with LIKE queries (e.g., WHERE org_path LIKE /gc/division/union/conference/%)
- **Scaling:** Escape hatch to hybrid (shared metadata DB + per-church data DBs) if approaching 10 GB

### Authentication & Authorization

- **Auth Provider:** Better Auth (self-hosted, Cloudflare Workers + D1 compatible)
- **Session Management:** JWE cookie cache + IndexedDB session snapshot for offline
- **Role Taxonomy:** System-defined roles per org level (fixed set)
- **Role Scope:** Hierarchical inheritance — higher-level roles grant access to all descendant orgs
- **Permission Model:** Role + resource-type (e.g., Treasurer grants read/write finances at assigned org + descendants)
- **Delegation:** Supported with explicit grants + full audit trail
- **Audit Logging:** Full field-level — who, when, what record, before/after values, delegation context

### Offline-First Sync

- **Sync Protocol:** Operation log + last-write-wins (timestamp-based conflict resolution)
- **Local Storage:** SQLite via WASM (mirrors D1 schema exactly)
- **Change Tracking:** Database triggers automatically log all INSERT/UPDATE/DELETE to sync_log table
- **Sync Handshake:** Batch upload/download on connect (client uploads local ops, server applies, sends back remote ops)
- **Offline Data:** Everything works offline except org structure (admin-only, requires connectivity)
- **Bandwidth:** Selective sync by user org scope (only sync data relevant to users church + conference reference data)

### Data Model

- **Persons:** Global entity (name, contact info, email, phone)
- **Memberships:** Person ↔ Church (status, dates, transfer history)
- **Role Assignments:** Person ↔ Org node + role (at any org level)
- **Organizations:** Hierarchical with materialized path, core fields + JSON metadata for type-specific attributes
- **Membership Transfers:** Keep old membership as history, create new membership (full audit trail)

### Phasing

**Phase 0 - Technical Foundation:**
- Cloudflare Pages + Workers deployment
- Better Auth integration (D1 adapter)
- D1 schema (organizations, persons, memberships, role_assignments, roles, permissions)
- SQLite WASM + sync infrastructure
- PWA shell (routing, auth, navigation)
- RBAC middleware

**Phase 1 - MVP:**
- Org structure management (online-only, admin)
- Membership management (offline-capable)
- Finance (tithes, offerings, basic reports — offline-capable)
- Basic church-level reporting

**Phase 2 - Core Operations:**
- Scheduling & Events
- Attendance tracking
- Communications (announcements)

**Phase 3 - Department Modules:**
- Sabbath School management
- AY / Youth ministries
- Pathfinders / Adventurers

**Phase 4 - Specialized:**
- Church board / business meetings
- Spiritual life / ordinances
- Camp meeting management

**Phase 5 - Advanced:**
- Hierarchical reporting & dashboards
- SMS / email communications
- Payment processing

### Product Design Principles

**Lovable:**
- Delightful UX — beautiful, fast, not a bureaucratic form-fest
- Personal & contextual — remembers preferences, surfaces what matters
- Intelligent & proactive — tells you what you need before you ask
- Community & connection — members see each other, belong
- Spiritual formation — tracks discipleship journey
- Intuitive & self-service — minimal training needed

**Shareable:**
- Member-to-member invitations
- Church-to-church referrals
- Conference-driven top-down adoption

**Indispensable:**
- Single source of truth — all operations in one place
- Automation — reports, giving statements, attendance in seconds
- Compliance — conference reporting built-in
- Member expectations — digital access to church life
- Mission effectiveness — helps churches fulfill their calling

**Work Elimination (Automation):**
- Auto-generate reports (hours → seconds)
- Automated reminders (events, deadlines)
- Automatic compliance (conference reporting, tax statements)
- Self-service data entry (members report own attendance, giving)
- Smart scheduling (auto-suggest based on availability)

**Work Distribution (Collaboration):**
- Role rotation (Sabbath roles, managed by app)
- Volunteer sign-ups (events, no clerk coordination)
- Member care distribution (visits/calls to small group leaders)
- Content collaboration (team contributes, not just pastor)
- Shared data stewardship (team reviews, not single clerk)

**Collaboration UX:**
- Visible ownership (who is responsible for what)
- Smart notifications (when it is your turn)
- Easy handoffs (pass tasks between people)
- Personal dashboards (see only your responsibilities)
- Mobile-first (volunteers act from phone)

**Aha Moments:**
- Admin (5 min): sign up → add members → instant report (hours → seconds)
- Member: invitation or self-join → personalized welcome → feel connected

**Onboarding:**
- Admin: frictionless 5-minute path to value
- Member: invite flow OR church code self-join

### API Design

- **Worker API:** RESTful endpoints for all CRUD operations
- **Auth Middleware:** Every request validated for tenant isolation + role permissions
- **Sync Endpoint:** POST /sync for batch upload/download of operations
- **Hierarchical Queries:** API supports org_path filtering for roll-up reports

## Testing Decisions

### Testing Philosophy

Tests verify external behavior, not implementation details. The goal is to ensure the system works correctly from the users perspective, not to test internal mechanics.

### Testing Seams

**Seam 1: Sync Engine**
- Test the SQLite WASM ↔ D1 synchronization logic
- Verify operation log capture (triggers fire correctly)
- Verify batch sync upload/download
- Verify conflict resolution (last-write-wins by timestamp)
- Verify selective sync (user only gets data for their org scope)
- Test offline scenarios (no connectivity, then reconnect)

**Seam 2: API Boundary**
- Test all Worker API endpoints for CRUD operations
- Verify tenant isolation (user A cannot access user Bs data)
- Verify role-based access control (user cannot perform unauthorized actions)
- Verify hierarchical queries (conference admin sees all churches data)
- Test auth flows (login, logout, token refresh, offline token caching)

**Seam 3: PWA End-to-End**
- Test full app flows (install, login, create member, record giving, generate report)
- Test offline scenarios (disconnect, make changes, reconnect, verify sync)
- Test mobile responsiveness
- Test onboarding flows (admin setup, member invitation, self-join)
- Test collaboration features (task assignment, handoff, role rotation)

### Testing Frameworks

- **Unit/Integration:** Vitest (for Workers and sync engine)
- **E2E:** Playwright (for PWA flows)
- **Visual Regression:** Playwright screenshots (for UI consistency)

### Test Coverage Priorities

1. **Sync correctness** — data must not be lost or corrupted
2. **Tenant isolation** — security critical
3. **Role-based access** — security critical
4. **Offline behavior** — core value proposition
5. **Aha moment flows** — admin 5-minute setup, member onboarding

## Out of Scope

- **Legacy data migration:** Fresh start, no migration from existing systems
- **Native mobile apps:** PWA only (no iOS/Android native apps)
- **Payment processing integration:** Phase 5+ (not in MVP or early phases)
- **Multi-language support:** Phase 5+ (English-only initially)
- **Advanced analytics:** Phase 5+ (basic reporting only in early phases)
- **Third-party integrations:** No integration with external church management systems
- **Custom workflows:** System-defined workflows only, no custom business logic per church
- **Video streaming:** No live streaming of services
- **Chat/messaging:** No real-time chat between members (announcements only)
- **Background sync:** Sync only on explicit connect, not continuous background sync
- **Biometric auth:** No fingerprint/FaceID (password + email for now)
- **Offline-first for org structure:** Org structure changes require connectivity

## Further Notes

### Virality Strategy

The platform spreads through three channels:
1. **Member-to-member invitations:** Members invite other members, creating network effects within a church
2. **Church-to-church referrals:** Satisfied churches recommend to other churches
3. **Conference-driven adoption:** Conferences mandate use, driving church-level adoption

### Work Distribution Model

Theobase transforms church operations from "one overwhelmed clerk" to "distributed team effort":
- **Automation** eliminates tedious work (reports, reminders, compliance)
- **Self-service** lets members handle their own data (attendance, giving)
- **Collaboration** distributes work across volunteers (role rotation, task assignment)
- **Visibility** makes ownership clear (who is responsible for what)

### Spiritual Formation

The platform supports spiritual growth by:
- Tracking baptism, membership, service milestones
- Providing devotionals and spiritual resources
- Surfacing insights about congregational spiritual health
- Connecting members with discipleship pathways

### Compliance & Reporting

Theobase makes compliance effortless:
- Automatic compilation of conference-required reports
- Tax-compliant giving statements
- Annual Church Report data generation
- Real-time visibility for conference administrators

### Mobile-First for Volunteers

Volunteers (greeters, ushers, prayer leaders, department workers) primarily use the app on their phones:
- See their role assignments
- Receive notifications when it is their turn
- Mark tasks complete
- Access the app offline

### Success Metrics

- **Admin aha moment:** <5 minutes from sign-up to first report
- **Member aha moment:** Personalized welcome → feeling connected
- **Adoption:** Member invitation acceptance rate, church-to-church referrals
- **Engagement:** Daily active members, attendance tracking rate, giving self-reporting rate
- **Retention:** Churches continuing to use after 6 months, member retention rate
