# Competitor UI/UX Analysis: Church Management Software

## Research Date: August 2026

---

## 1. Planning Center

**URL:** planningcenter.com | **Founded:** 2008 | **Churches:** 80,000+

### Navigation Structure

- **"Product picker" top-level design** — each product (People, Groups, Calendar, Registrations, Check-Ins, Services, Giving, Publishing, Music Stand) is a separate but interconnected mini-app
- Global header with a dropdown product switcher; each product has its own left sidebar navigation
- **Church Center** acts as the unified member-facing app — white-labeled, congregation-facing hub
- Admin uses Planning CenterApp for task management from mobile
- Module-based pricing: you pay only for what you use, with a free-tier People module

### Membership Records

- **People is completely free** — unlimited profiles, custom fields, lists, workflows, automations
- Profile page shows **ministry activity** (attendance, giving, volunteering, group membership) aggregated from all modules
- Custom tabs and fields (baptism date, spiritual gifts, communication preferences)
- **Lists** with boolean rule engine (all/any/none conditions), auto-refresh
- **Workflows** — multi-step tracking for membership processes, visitor follow-up, volunteer onboarding
- **Automations** — profile updates, welcome emails, task creation triggered by events
- Household-aware profiles linking family members
- **CSV import**, duplicate merging, background check integration

### Financial/Giving Workflows

- **Stripe-powered** with lowest available processing rates (2.15% + $0.30 credit, 0% + $0.30 ACH)
- Subscription cost based on donation count (10 free → $15/mo for 75 → $239/mo unlimited)
- Multiple giving methods: ACH, Apple/Google Pay, text-to-give, embedded forms, QR codes, NFC tags
- **Cash/check batch entry** with check-scanning auto-match
- **Pledge campaigns** with progress tracking
- Recurring donation forecasting
- In-kind donation tracking
- Donor statements (email or mail, joint or individual)
- **Donor-covered fees option**
- Automatic card updater for expired cards
- Giving data syncs with People module for unified donor profiles

### Visual Design Language

- Modern, clean, flat design with vibrant gradient accents
- **Phoenix design system** (recent visual refresh) — rounded cards, soft shadows, generous whitespace
- Product-specific brand colors in iconography (green for Giving, blue for People, purple for Services)
- Mobile-responsive with dedicated iOS/Android apps
- Church Center has theming/customization for each church's brand

### What They Do Well

- **Modular architecture** — buy only what you need; People is free
- **Tightest cross-module integration** — attendance from Check-Ins, giving from Giving, groups from Groups all visible on one profile
- No outside investors, no acquisition risk — privately held with a public commitment
- SOC 2 certified (only ChMS with this certification)
- ~1 hour support response time, even for non-customers
- Weekly product updates (58 features in last 90 days)
- "Ask AI" feature for instant answers
- API and developer community

### What They Do Poorly

- **Not a full accounting system** — no general ledger, no AP/AR (must export CSV to QuickBooks)
- No native payroll
- No true denomination-specific features (no district/conference hierarchy, no SDA-specific membership transfer workflows)
- Module-based pricing can become expensive at scale if you use everything
- Worship planning module centerpiece means non-worship-heavy traditions (like SDA Sabbath School) are an awkward fit
- No built-in room booking conflicts that handle Sabbath + Sunday patterns well
- Limited offline/mobile sync for field use in areas with poor connectivity

---

## 2. Church Community Builder (CCB) → Now Pushpay ChMS

**Note:** CCB was acquired by Pushpay. The product now lives as **Pushpay ChMS** within the ChurchStaq suite. The legacy CCB brand is retired.

### Navigation Structure

- **ChurchStaq** is the all-in-one umbrella: Giving + ChMS + Apps + Insights + Resi (streaming)
- Separate admin portal (admin.pushpay.com) vs donor-facing app
- Solutions-oriented navigation: Giving, ChMS, Apps, Insights organized by function
- **LEAD App** — dedicated mobile ChMS for staff/ministry leaders to manage processes on the go

### Membership Records

- **AI-powered People Search** — natural language queries (e.g., "show me families who haven't attended in 3 months")
- **Process Queues** — automate follow-up steps, visitor connections, membership pipelines
- Profile unifies giving history, group involvement, attendance, and communication history
- **SacramentTracker** (Catholic-focused: baptism, confirmation, marriage milestones)
- Household/family grouping
- Customizable forms for signups and registrations with multi-participant and payment support

### Financial/Giving Workflows

- **Everygift® proprietary technology** — prevents transaction failures, recovers missed gifts, converts offline donors ($210M in at-risk donations secured annually)
- QuickGive — sub-6-second giving with Apple Pay, no account creation required
- AI for giving data — ask questions in natural language about trends
- Stock & crypto giving via Engiven integration
- Text-to-give, kiosk giving, embedded forms
- Tap-to-Give (NFC) via VisitorTap
- Statements, recurring giving, donor-covered fees
- Owns the payment processing infrastructure (not just a Stripe wrapper)

### Visual Design Language

- Bold, modern aesthetic — navy/dark backgrounds with warm accent colors
- Large hero sections with product screenshots in device frames
- Clay-style 3D device frames (iPhone, tablet, laptop) used extensively
- Clean sans-serif typography, generous whitespace
- Card-based layouts for feature showcases

### What They Do Well

- **Own payment infrastructure** — Everygift proactively recovers failed donations (unique in market)
- Strong analytics — Insights unifies giving, attendance, serving data across the platform
- Processes $210M+ in at-risk donations annually with recovery tech
- 14,000+ churches, 7 of top 10 US churches, 84 of Outreach top 100
- 100+ integrations including Gusto (payroll), MortarStone (analytics), Resi (streaming)
- Catholic-specific ParishStaq variant shows ability to adapt to denominations
- AI features rolled out across product: AI search, AI for giving data

### What They Do Poorly

- **Price opacity** — plans are "call for pricing" for many tiers
- Legacy CCB users report clunky UI in the admin ChMS (though undergoing "Staq Transformation" rebuild)
- Heavy focus on large/mega churches; SMB churches may feel underserved
- No SDA denomination support
- No built-in general ledger/true fund accounting — still relies on exports
- The platform's complexity can be overwhelming for small-staff churches
- Migration from CCB and MAS systems has been painful historically

---

## 3. Breeze ChMS

**URL:** breezechms.com | **Note:** Breeze was acquired by Tithely and rebranded as **Tithely Church Management** (2024). Legacy name still used.

### Navigation Structure

- Clean product-centric layout: People, Groups, Events, Service Planning, Forms
- Single-page dashboards per module
- Instant demo environment with sample data (no signup required)
- Flat pricing: $72/month regardless of contact count

### Membership Records

- Unlimited contacts at flat rate
- People database with custom fields
- Free data export/import
- Member directories
- Attendance tracking and reporting
- **Check-in & name tags** built in

### Financial/Giving Workflows

- Online & text giving
- Giving reporting
- Now bundled with Tithely's full giving platform (see Tithely section)

### Visual Design Language

- Clean, approachable — deliberately simple
- Blue/teal primary palette
- Large feature cards with screenshots
- Comparison tables prominently featured against competitors

### What They Do Well

- **Simplicity above all** — the "world's easiest ChMS"
- Flat-rate pricing with no contact limits
- Free trial, free data export (no lock-in)
- Low learning curve for non-technical users
- Phone and email support included at $72/mo

### What They Do Poorly

- Limited feature depth compared to Planning Center or Pushpay
- No advanced automation/workflows
- No integrated accounting
- Now effectively a Tithely product — confusing branding transition
- No denomination-specific features
- Reporting is basic compared to competitors
- No multi-campus features beyond basics

---

## 4. ACS Technologies / Realm

**URL:** acstechnologies.com/realm | **Founded:** 1978 | **Churches:** Thousands

### Navigation Structure

- Two distinct paths: **Realm** (modern, cloud-based) and legacy **ACS** (desktop/on-premise)
- Realm top nav: Ministries, Tools, Services, Resources, Demos, Plans
- Tools menu is extensive: Dashboards, Reporting, Pathways, Communications, Groups, Mobile Apps, Events, Check-In, Volunteers, Background Checks, Giving, Contributions, Accounting, Payroll, Profiles, Security, Websites, Integrations
- **Role-based dashboards** tailored for different ministry roles
- Mobile apps: **Realm Connect** (congregation) and **Shepherd** (pastoral care)

### Membership Records

- **Profiles & Directories** — detailed person profiles with directories
- **Pathways** — assignable, trackable processes (membership classes, visitor follow-up)
- **Groups** — small group management with attendance
- Background checks integrated
- **Pastoral care notes** and visit tracking
- Multi-site/campus support

### Financial/Giving Workflows

- **Giving** — online donations, recurring giving
- **Contributions** — batch entry for cash/checks, contribution statements
- **Accounting** — full fund accounting with general ledger (one of the few ChMS with this)
- **Payroll** — integrated church payroll processing
- Full financial reporting suite

### Visual Design Language

- Professional, established — less trendy than Planning Center/Pushpay
- Blue/white primary palette
- Traditional enterprise-software feel in places
- Realm side is more modern than legacy ACS
- Device mockups on homepage show multi-platform support

### What They Do Well

- **Most comprehensive financial toolset** — full accounting + payroll + contributions makes it one of few true "all-in-one" solutions
- 45+ years in church tech — institutional knowledge and stability
- Denominational understanding — works with Catholic, Methodist, Presbyterian hierarchies
- Pathways provide structured processes
- Strong pastoral care tools (Shepherd app)
- Plans at multiple price points: Inform → Connect → Multiply

### What They Do Poorly

- **Split product line** (ACS legacy + Realm) creates confusion
- UI/UX is behind competitors — feels dated compared to Planning Center
- Price opacity — call for pricing
- Complex to set up and configure
- Legacy ACS users report difficult migration paths
- No true SDA-specific features despite being one of the closest options
- Mobile app experience less polished than Planning Center/Pushpay

---

## 5. SDA-Specific Church Clerk/Treasurer Software

### Current State

- **No dominant SDA-specific ChMS exists in the market**
- Most SDA churches use: spreadsheets (Excel), paper records, generic ChMS (ACS, PowerChurch, etc.), or home-grown solutions
- The Seventh-day Adventist Church operates through a strict hierarchical structure: Local Church → Conference → Union → Division → General Conference
- Membership is tracked at the Conference level, with local churches reporting quarterly
- Historically, **ACSI** (Adventist Church Systems International) and various conference-developed tools existed but none achieved widespread adoption

### Known Tools

- **eAdventist** — web-based membership system used by some North American Division conferences for official membership records; primarily conference-level, not a full ChMS
- **ACSI Tools** — legacy software used by some conferences and churches; aging technology
- **AdventistGiving.org** — online giving platform for SDA churches (limited to giving only, not membership)
- Various conference-specific internal tools — fragmented landscape

### SDA Church Manual Requirements (Key Record-Keeping Needs)

Based on the SDA Church Manual and standard Conference reporting requirements:

**Membership Records (Church Clerk responsibilities):**

- Baptism records with date, officiating minister, previous faith background
- Profession of faith records
- Transfer requests (incoming/outgoing) — formal letters between churches and conferences
- Membership removal (death, apostasy, missing members, discipline)
- Quarterly statistical reports to the Conference
- Annual membership audit/reconciliation with Conference records
- Family unit tracking (head of household, spouse, children)
- Baptismal candidate tracking (Bible studies, baptismal classes)
- Sabbath School attendance by division (Cradle Roll, Kindergarten, Primary, Junior, Earliteen, Youth, Adult)
- Member contact information, including seasonal members

**Financial Records (Church Treasurer responsibilities):**

- **Tithe** — tracked separately from offerings, forwarded to Conference
- **Offerings** — categorized by purpose (local church budget, Sabbath School, world mission, conference advance, etc.)
- Dual fund structure: Conference-designated funds (forwarded to conference) + Local church funds
- Monthly treasurer's report to the church board
- Annual financial report to the business meeting
- Budget management and tracking
- Receipts/statements for donors (tax receipts where applicable)
- **Envelope numbering system** — anonymous giving tracking by member number

**Reporting Hierarchy:**

- Local church reports to **Conference**
- Conference reports to **Union**
- Union reports to **Division**
- Division reports to **General Conference**
- Each level has specific statistical and financial reporting requirements

**Key SDA-Specific Concepts Not Addressed by Generic ChMS:**

- **Sabbath School** structure (not "Sunday School")
- **Tithe vs. Offerings** distinction (legally and theologically significant)
- **Church board** governance structure (not elder board/deacon board alone)
- **Membership transfer protocol** (conference-mediated, formal letters)
- **Missing member tracking** (SDA-specific process for members whose whereabouts are unknown)
- **Quarterly statistical reporting** to Conference
- **Envelope number** system for anonymous give tracking
- **Sabbath** as primary worship day (not Sunday)
- **Pathfinder/Adventurer clubs** — SDA youth organizations
- **Health ministry**, **community services**, **ADRA** — SDA outreach structures
- **Ingathering** — annual SDA fundraising campaign
- **Evangelistic series tracking** and results reporting

---

## 6. Tithe.ly

**URL:** get.tithe.ly | **Founded:** 2014 | **Churches:** 50,000+ | **Rating:** 4.7/5

### Navigation Structure

- Product-centric: Giving, Church Management, Church App, Sites, People (free add-on)
- **All Access bundle** — $119/month for everything (flat rate, no growth penalties)
- Free Giving tier ($0/mo + processing fees)
- Modular ChMS at $72/month
- Demo gallery with interactive walkthroughs

### Membership Records

- **People** — free membership database that syncs with giving data
- Unlimited contacts at flat rate
- Groups, events, service planning
- Background checks integrated
- Email & text messaging built in
- Member directories

### Financial/Giving Workflows

- **Free giving platform** (processing fees only: 2.9% + $0.30 credit, 1% + $0.30 ACH)
- Online giving form (mobile-optimized)
- Mobile giving app for donors
- Text-to-give
- NFC Tap discs (physical hardware)
- Pledge campaigns
- Giving insights dashboard
- Recurring giving
- Tax receipts automated
- Donor-covered fees (60% of donors do)

### Visual Design Language

- Bold, colorful, modern — purple/teal/orange gradients
- Large hero sections with vibrant backgrounds
- Product-specific icon colors
- Clean sans-serif typography
- Emoji used in pricing cards

### What They Do Well

- **Pricing transparency** — clear flat rates on website
- Free giving tier with no monthly cost — low barrier to entry
- All Access bundle is genuine value ($119/month for everything)
- 50,000+ churches — strong market validation
- Excellent mobile giving experience
- Free People module competes with Planning Center's free tier
- Good trust signals: Trustpilot/Capterra ratings prominently displayed

### What They Do Poorly

- **Confusing brand architecture** — acquired Breeze, rebranded multiple times (Tithely → Breeze → Tithely Church Management)
- ChMS features less mature than dedicated ChMS competitors
- Service planning is basic compared to Planning Center
- No true fund accounting (reporting only, no GL)
- Limited automation/workflows compared to Planning Center
- No denomination-specific customization
- User reviews sometimes mention clunky admin interface

---

## 7. Pushpay (Giving Platform)

**URL:** pushpay.com | **Founded:** 2011 | **Churches:** 14,000+ | **Public company** (NZX/ASX: PPH)

### Navigation Structure

- Main site: Why Pushpay, Products, Solutions, Resources
- Products: ChurchStaq (all-in-one), Pushpay Giving (standalone), Nurture (pastoral care), ParishStaq (Catholic), ParishStaq for Dioceses
- Admin dashboard separate from donor-facing app
- Product tour available as self-guided walkthrough

### Financial/Giving Workflows

- **Everygift** — proprietary payment intelligence (see CCB/Pushpay ChMS section above)
- QuickGive — 6-second giving with Apple Pay
- AI for giving data insights
- Stock & crypto via Engiven
- Tap-to-Give NFC tags
- Text-to-give, embedded forms, kiosks
- Recurring giving, pledge campaigns
- Donor statements

### Visual Design Language

- Sophisticated, polished — dark navy backgrounds with bright accent colors
- Clay-rendered 3D device mockups extensively used
- Animated gradient elements
- Premium feel — targets large churches

### What They Do Well

- **Fastest giving UX** — 6-second QuickGive
- Everygift recovers failed transactions (unique differentiator)
- Owns payment processing infrastructure end-to-end
- Strong analytics and reporting
- Major church endorsements (Elevation, Saddleback, Harvest)
- 12-month no-cost grant for church plants

### What They Do Poorly

- **Public company** — shareholder pressure vs. ministry focus
- Price not transparent — call for pricing
- Complex acquisition history (CCB, MAS, ChurchStaq rebranding)
- Giving platform is strong, but ChMS side is rebuilding ("Staq Transformation")
- No SDA-specific features

---

## 8. Subsplash

**URL:** subsplash.com | **Founded:** 2005 | **Clients:** 20,000+ | **Started as:** Church app company

### Navigation Structure

- Main nav: Pricing, Products, Use Cases, Resources, Login
- Products: Apps, Giving, Websites, People (ChMS), Groups & Messaging, Events, Workflows, Live Streaming, Media, TV Apps, Pulpit AI, Trends AI, Tap
- **Subsplash One** — all-in-one platform bundle
- Church size-based use cases (Church Plants → Growing → Regional → Mega/Multisite)

### Membership Records

- People/ChMS module — membership database
- Groups & Messaging — small group management with in-app messaging
- Events — registrations, check-in
- Workflows — newest feature: process management, automations
- Notes and forms
- Child check-in integrated

### Financial/Giving Workflows

- Giving at $0/month with **GrowCurve** — automatic rate negotiation
- Multiple giving methods: in-app, text, web, kiosk
- Apple/Google Pay support
- Donor-covered fees
- Recurring giving
- Donation tracking and statements
- Reconciliation tools ("Transfers page")

### Visual Design Language

- Clean, modern — deep blue/navy primary palette
- App-centric design heritage shows in polished mobile UI
- Bold rounded headers, gradient backgrounds
- Product icon system — consistent colored icons for each module
- Client logo marquee prominently displayed (20,000+ clients)

### What They Do Well

- **Best-in-class church apps** — this was their origin and remains strongest
- Media hosting pioneered ad-free sermon delivery
- Pulpit AI — automatically generates clips, social posts, discussion questions from sermons
- Trends AI — automated analytics dashboards
- Workflows (new) — process automation for churches
- "Create once, publish everywhere" content model
- Church size-specific guidance
- Faith-focused company (no VC, privately held)

### What They Do Poorly

- ChMS is newer and less mature than competitors
- Workflows just launched — unproven
- No integrated accounting
- Giving is solid but lacks Everygift-style recovery intelligence
- Growing fast may overextend product quality
- No denomination-specific features
- Pricing not fully transparent on site

---

## 9. Fellowship One

**URL:** fellowshipone.com | **Founded:** ~2008 | **Part of:** Ministry Brands | **Churches:** 4,000+

### Navigation Structure

- Main nav: Church Software, Success Center, Blog, Let's Talk
- Church Software dropdown: Church Management, Church Accounting, Online Giving, Church Websites, Background Checks, Church Mobile App, Worship Planning
- Separate user portal for church admins
- Ministry Brands ecosystem (umbrella company owning multiple church tech products)

### Membership Records

- Church management with member profiles
- Small groups/community management
- Event management with registrations
- Volunteer management and scheduling
- Check-in systems for child safety
- Communication tracking

### Financial/Giving Workflows

- **Church Accounting** — built-in fund accounting (differentiator)
- Online giving with mobile app, text, kiosk, website embedding
- $3.1 billion in charitable contributions processed
- Donor management
- Contributions tracking

### Visual Design Language

- Professional, corporate — blue/white color scheme
- Less design-forward than Planning Center or Pushpay
- Clean but conventional UX patterns
- Strong data emphasis in marketing

### What They Do Well

- **Full fund accounting** — one of few ChMS with built-in general ledger
- Ministry Brands ecosystem provides complementary products
- 16+ years of experience
- Worship planning includes volunteer scheduling
- Strong support infrastructure (224 support staff)

### What They Do Poorly

- **Dated UI** — feels legacy compared to market leaders
- Part of a large corporate structure (Ministry Brands) — product innovation pace questioned
- Smaller market share (4,000 churches vs 80,000 for Planning Center)
- No SDA-specific features
- Mobile app through MinistryOne — not as polished
- Website integration through third-party (Ekklesia360)

---

## Summary: Key Patterns and Insights

### Navigation Patterns Observed

1. **Module/product-picker model** (Planning Center, Tithely) — users navigate between discrete modules
2. **Unified dashboard model** (Realm, Pushpay) — everything from a single dashboard
3. **Hub-and-spoke model** (Subsplash, Fellowship One) — central platform with spokes for each function
4. **Left sidebar + top-level nav** is the dominant admin pattern
5. **Dedicated member-facing app** (Church Center, Realm Connect) is now standard

### Membership Record Patterns

- Custom fields and tags are **table stakes**
- **Household/family grouping** is universal
- **Activity timeline** (giving + attendance + groups) on profile is emerging standard
- **Workflows/Pathways** for membership processes becoming the competitive battleground
- Free membership databases (Planning Center People, Tithely People) pressure competitors

### Financial/Giving UX Patterns

- **Processing fees as differentiator** — lowest fees win (Planning Center 2.15%, Tithely 0% monthly + fees)
- **Donor-covered fees** is now standard
- Multiple giving channels expected: app, web, text, NFC, kiosk
- **ACH at near-0%** is a major selling point
- **Everygift-style recovery** (Pushpay) is a premium differentiator
- **Integrated fund accounting** (ACS, Fellowship One) serves a distinct segment

### Visual Design Trends

- **Dark nav + light content** is dominant
- **Gradient accents** and rounded corners
- **3D device mockups** with app screenshots
- **Flat, modern sans-serif** typography
- **Card-based layouts** for features
- Color-coded product/module iconography

### SDA-Specific Gap Analysis

The most significant finding: **no existing platform addresses SDA-specific requirements.** Key gaps:

1. **Sabbath School** — no platform handles division-based attendance and reporting
2. **Tithe vs. Offerings** — distinction lost in generic "funds" models
3. **Conference/Union hierarchy** — no platform models the SDA multi-tier reporting structure
4. **Membership transfer protocol** — no platform supports Conference-mediated letter transfers
5. **Quarterly statistical reporting** — no templates for SDA Conference reporting
6. **Envelope number system** — no SDA-style anonymous giving tracking
7. **Sabbath (Saturday)** as primary worship day — Sunday-centric calendar assumptions throughout
8. **Pathfinder/Adventurer** club management — no youth organization support for SDA structures

### Opportunities for Theobase

1. **SDA-first design** — every feature built with SDA terminology and workflow
2. **Conference reporting integration** — automated quarterly reports in Conference format
3. **Tithe forwarding workflow** — automated tithe separation and conference remittance tracking
4. **Sabbath School module** — division-based attendance and membership management
5. **Membership transfer wizard** — formal letter generation for Conference-mediated transfers
6. **Envelope number system** — privacy-preserving giving tracking
7. **Sabbath-centric calendar** — Saturday as default worship day with Sabbath School scheduling
8. **Tithe receipts** — specialized donation statements separating tithe from offerings
9. **Pathfinder/Adventurer clubs** — integrated club member management
10. **Pricing for small SDA churches** — most SDA churches are <200 members, underserved by enterprise pricing
