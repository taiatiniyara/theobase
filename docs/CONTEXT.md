# Theobase — Project Brief

_Living reference document. Captures the shared understanding reached through a structured "grilling" session — update it as decisions change or new facts arrive; don't let it go stale._

## What it is

Theobase is a SaaS product for Seventh-day Adventist (SDA) church operations, starting with financial digitization for grassroots-level churches. "Theo" (God) + "base" (foundation) — the name is deliberately denomination-neutral, even though the initial market is entirely SDA.

## Origin story

Theobase exists because **Fiji Mission** (South Pacific Division, SDA Church) approached the founder to help digitize their financials. That concrete ask is the actual starting point of the product — not the broader "global SDA grassroots software" vision, which is the long-term roadmap, not the MVP.

## The problem

SDA church operations at the grassroots level are decentralized in two overlapping ways:
1. **Local tooling** — churches rely on paper forms, spreadsheets, and informal processes with no shared system (the more urgent, immediate pain).
2. **Hierarchy roll-up** — the SDA org structure (Local Church → District → Mission/Conference → Union → Division → General Conference) has no software that lets data flow cleanly upward.

## Competitive landscape

This is **not greenfield**. The General Conference already runs **ACMS** (Adventist Church Management System) — live in 97 unions across 131 countries, free to churches, covering membership, attendance, tithe/offering control, and statistical reporting. NAD runs its own separate **eAdventist**. Africa has **CFMS** for mobile/USSD-based giving.

Rollout is uneven, though — many churches worldwide, likely including much of Fiji Mission, still report by paper/fax/email. Documented pain points with the incumbents: eAdventist requires juggling three separate logins; CFMS users report silent "no connectivity" failures despite being online.

**Theobase's position**: a complementary tool targeting the gap — unserved regions and the incumbents' specific UX/reliability failures — not a head-on replacement. For MVP, it stays standalone; ACMS interoperability (so a church doesn't have to double-enter data) is an explicit later phase, not a day-one requirement.

## MVP scope

Built for **Fiji Mission specifically** as the first real client (~400 organized churches, per direct conversation with their CFO — supersedes older ~202-church figures found in public yearbook data).

**In scope for MVP:**
- Tithe/offering recording at the local church level
- Mission-level roll-up and per-church financial detail visibility (the CFO's explicit ask: "details of financials in every church," not just aggregate totals)
- Reconciliation tracking — reported vs. actually received, since money moves physically (not electronically) and there's a real gap between a church recording a count and the Mission having the cash in hand

**Explicitly deferred (future roadmap, not MVP):**
- Membership records
- Attendance tracking
- Direct ACMS/eAdventist interoperability
- Payment/giving processing (Theobase is record-keeping only — no money movement through the app, even though CFMS already does mobile/USSD giving elsewhere in Africa)

## The real-world workflow (mirrors the paper process it replaces)

1. **Counting**: Official SDA financial procedure requires two unrelated people to count and verify a Sabbath's offering before it reaches the treasurer. Theobase must preserve this as a **dual sign-off** step in the app — likely via shared-device PIN confirmation, since assuming every counter owns a personal smartphone doesn't hold in this market.
2. **Recording**: The treasurer enters the count, itemized by fund/offering category, weekly (per Sabbath) — mirroring the standard "Treasurer's Cash Statement."
3. **Reporting to the Mission**: Historically happens "every trip" — i.e. tied to physical travel, not a fixed calendar. Connectivity in remote areas is patchy to absent. Theobase's job is to **digitize what happens at each end of that trip** (replace paper, standardize the record, sync opportunistically over whatever connectivity is available) — not to promise eliminating the trip itself, which would overclaim given some areas may have no signal at all.
4. **Reconciliation**: The Mission needs to see not just what was reported, but whether it was actually received — submitted → in transit → received → discrepancy flagged.

**Trust/audit requirement**: paper is trusted partly because it's physically hard to fake after the fact. Theobase needs an **append-only audit log** per record (who entered it, who confirmed via dual sign-off, any later edits with reason) from MVP — this is the digital equivalent of the two-person counting safeguard, and it's expensive to retrofit later.

## Data model notes

- **Org hierarchy is first-class from day one** (Mission → church, at minimum), even though only Fiji Mission is populated initially — retrofitting a hierarchy into a system that started single-tenant is painful.
- **Fund/offering categories are configurable**, not hardcoded: each **Mission** sets its own master list (Calendars of Offerings vary by division/union/mission), and each **local church** toggles which categories from that list apply to it.
- Standard denomination-wide categories exist as a reference starting point (Tithe — kept separate, remitted up, never used locally; Local Church Budget; Sabbath School/Mission Offering; World Budget; Ingathering; Disaster & Famine Relief; Thirteenth Sabbath Offering; an annual Calendar of Offerings of special-day designated funds; trust/designated funds tracked separately by donor intent) — but Fiji Mission's actual current form/Calendar of Offerings should replace this as the real spec once obtained (**open item**, see below).
- Users are **per-person, role-based accounts** (at minimum: Clerk, Treasurer, Pastor) — not shared logins, given the sensitivity of financial and membership data.

## Architecture

- **Mobile-first, local-first/offline-capable by default** — not a nice-to-have, the core premise. The app must handle arbitrarily long offline periods gracefully (no assumption that sync happens within X days, no purging local data on a timer).
- **Progressive Web App (PWA)**, not a native app — avoids app-store distribution friction for grassroots users, fits the local-first model via service workers + local storage.
- **Login**: phone number as identifier + a self-set PIN. No SMS/OTP dependency for routine login, since SMS delivery isn't guaranteed in this market — only as an optional recovery fallback.
- **Language**: English-only for MVP (matches the CFO relationship and Fiji Mission's institutional language) — but this is a stated assumption to confirm directly with Fiji Mission, not a permanent decision.

## Tech stack

**All-Cloudflare**: Workers, Pages, D1, R2, edge network. Coherent choice — Cloudflare's global edge network puts compute close to users regardless of region, which fits a product built around patchy Pacific connectivity, and pairs naturally with a PWA (Pages hosting, Workers for sync/API, D1 for structured data, R2 for file/blob storage).

## Hosting, legal & compliance

- No current legal blocker to hosting Fiji residents' data offshore — Fiji has no data protection law in force yet (a Privacy Bill has been drafted; enactment status unconfirmed as of this research).
- No documented requirement that church/NGO data stay in-country. Regional sentiment (not law) favors Australian-linked infrastructure as a partial hedge against the US CLOUD Act.
- **Recommendation, not yet independently verified**: build with GDPR-style controls (encryption at rest/in transit, access logging, deletion capability) as a hedge against Fiji's pending privacy law.
- **Open item**: get a Fiji-qualified lawyer to confirm the Privacy Bill's actual status, and confirm any statutory financial-record retention period for Fiji nonprofits, before handling real data at scale.

## Business model

- **Solo developer + AI agent team** — no co-founder/team beyond that currently.
- Theobase is being built as a **SaaS to sell to the global SDA Church**, with Fiji Mission as the launch pilot/design partner (not the owner).
- **Fiji Mission is not paying** currently — free through pilot/beta, converting to the paid rate once the product is proven with them (this specific transition point was proposed by the assistant during the grilling session and not explicitly confirmed by the founder — flagged as provisional).
- **Pricing**: $3 USD/month per church, billed in aggregate at the **Mission/Conference level** (not self-serve per individual rural congregation) — the Mission is the actual payer/budget-holder and matches the org-hierarchy tenant model above.

## Branding

- **Name is clear to use**: no active trademark or competing product found for "Theobase" as one word. One soft naming-collision to be aware of (not a legal issue): **TheocBase**, existing open-source congregation-scheduling software for Jehovah's Witnesses — different spelling, same "Theo+Base" construction, same broad category.
- **Positioning: denomination-neutral branding, SDA-specific go-to-market**. Visual identity and messaging stay generically Christian rather than SDA-coded, so the brand isn't expensive to walk back if it expands beyond SDA later — but marketing/case studies/copy can and should speak directly to SDA-specific pain points now.
- **Visual identity: from scratch**, no existing assets. Working assumption: lean institutional-trustworthy over trendy-startup-modern — the actual decision-makers (Mission CFOs, church treasurers) are evaluating this closer to accounting software than a consumer app, and overly playful design risks undermining credibility with exactly the audience that needs to trust it with money.

## Open items / facts still needed from the real world

These are things the grilling process explicitly flagged as unresolved and NOT safe to assume further on:

- **Actual sample of Fiji Mission's current paper form and Calendar of Offerings** — needed to replace the generic denomination-wide fund category list with their real one.
- **Scale of end users**: how many people (treasurers/clerks) would actually use this day to day, beyond the 400-church count.
- **Trip frequency** for remote churches — not architecturally blocking (local-first handles it either way), but useful for UX (e.g. how "stale" to visually flag a church's data) and worth asking the Mission eventually.
- **Whether English-only is actually workable** for treasurers at the 400-church level, or whether Fijian/Fiji Hindi support is needed sooner than assumed.
- **Legal confirmation** of Fiji's Privacy Bill status and nonprofit financial record-retention requirements.
- **Domain registration** (theobase.com/.app/.io) — appears available but not yet confirmed via an actual WHOIS/registrar check.

## Roadmap (post-MVP, not current scope)

- Membership records and attendance tracking (the original broader "grassroots operations" vision)
- Expansion to other Missions/Unions/Divisions within the SDA Church
- Direct ACMS/eAdventist interoperability/data sync
- Possible expansion beyond SDA to other denominations facing the same grassroots-tooling gap (branding is already positioned to allow this)
