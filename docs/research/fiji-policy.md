# Fiji Mission / SPD policy data — primary-source research note

What the Fiji Mission (SPD) fund chart, Combined Offering Plan split, Calendar of Offerings, and tithe remittance actually are, traced to first-party General Conference / South Pacific Division / Fiji Mission sources, plus a validation note on whether `docs/specs/policy-schema.md`'s schema can represent them.

Every claim is cited to the document that owns it. Anything not verifiable against a first-party source is dropped or flagged in **Unverified**.

The frame this research serves: Theobase ships a **placeholder** fund chart/COP split/calendar as a bootstrap seed, because "the real fund chart, offering calendar, and remittance percentages are division/union-specific and are the denomination's IP — they ship in the policy feed, not the repo" (`docs/specs/policy-schema.md`). This note establishes what the *real* data is, so the placeholder is shaped correctly and the mission import path is known.

---

## 1. Which offering plan Fiji Mission is under

Fiji Mission is part of the **Trans-Pacific Union Mission** (TPUM), a union of the South Pacific Division. First-party confirmation that this is COP territory:

> "In the South Pacific Division the Combined Offering Plan (COP) is used in Papua New Guinea, the countries that make up the Trans Pacific Union and the Missions of the New Zealand Pacific Union Conference." — [SPD Stewardship, *Combined Offering Plan*](https://stewardship.adventistchurch.com/combined-offering-plan/)

The GC stewardship pages list the COP divisions and explicitly scope SPD to its island fields: "**SPD (Island Fields)**" ([GC Stewardship, *The Combined Offering Plan*](https://stewardship.adventist.org/combined-offering); [*Offering Plans*](https://stewardship.adventist.org/offering-plans)). Fiji is an island field of TPUM, so it sits in the COP set — consistent with Theobase's own docs ("Fiji Mission (SPD — Island Fields) operates under the COP", `policy-schema.md`).

The distinction matters: **mainland SPD (Australia/NZ) is *not* on COP** — it uses the *Calendar of Offerings* plan. The GC pages list "Divisions using this plan [Calendar of Offerings] include: EUD, Israel Field, MENA, SPD, TED" ([GC Stewardship, *Calendar of Offerings*](https://stewardship.adventist.org/calendar-of-offerings)). "SPD" appears in *both* lists because the division splits: islands → COP, mainland → Calendar of Offerings. A policy feed scoped to Fiji Mission must therefore not inherit mainland-AUNZ offering schedules.

## 2. The COP distribution split (local vs upward)

Two primary sources agree, and the SPD-authored source adds the middle tier the GC pages elide.

**GC Working Policy (the voted ratio).** The SPD one-page PDF cites its source and the formula:

> "Voted Distribution Ratio: 50-60% Local Church; 20-30% Local Mission/Union/Division; 20% General Conference. SOURCE: WORKING POLICY OF THE GENERAL CONFERENCE OF SEVENTH-DAY ADVENTISTS 2017-2018 EDITION, PAGES 613-615." — [SPD Stewardship, *Combined Offering Plan — One Page PDF*](https://stewardship.adventistchurch.com/wp-content/uploads/sites/16/2021/03/combined-offering-plan%E2%80%94one-page-pdf.pdf)

**The SPD worked example (per $100 received):**

> "$50 Local Church · $20 Local Mission · $10 Union/Division · $20 General Conference" — same SPD one-page PDF.

**The GC stewardship summary** states the same headline split in two tiers: "Retained for ministry in the local church is 50-60% of total offerings. The offerings passed on to the General Conference for world mission makes up 20%, and this percentage supports the ministries and needs that are promoted and listed in the Calendar of Offerings." ([GC Stewardship, *The Combined Offering Plan*](https://stewardship.adventist.org/combined-offering)).

So the real shape is **three tiers, not two**: local church (50–60%), local mission + union/division (20–30%, with SPD's concrete 20% mission / 10% union-division), and GC (20%). This *corrects* `policy-schema.md`'s "roughly 50–60% local / ~20% GC": the GC number is confirmed, but there is a **missing middle tier** (mission/union/division) that the two-way `{local%, upward%}` shorthand collapses. The one-page PDF also records that the ratio is "Voted by the General Conference and the divisions, revised every 5 years" — i.e. it is a *versioned* policy datum with an effective date, which matches `policy-schema.md`'s versioned effective-date model.

## 3. The Calendar of Offerings

There are two distinct calendar concepts, and Theobase's schema must not conflate them.

- **The *Calendar of Offerings* plan** (mainland SPD, not Fiji) promotes a specific offering each Sabbath with "about 26 Sabbath offerings of the year assigned to the local church" ([GC Stewardship, *Calendar of Offerings*](https://stewardship.adventist.org/calendar-of-offerings)).
- **Under COP**, there is still a promoted offering each week, but it feeds the pooled formula; the 20% that goes to the GC "supports the ministries and needs that are promoted and listed in the Calendar of Offerings" ([GC Stewardship, *The Combined Offering Plan*](https://stewardship.adventist.org/combined-offering)).

How the weekly schedule is actually realized in SPD's accounting system (ACAS), i.e. what a Fiji treasurer sees:

> "This report ['Offering of the Week'] is a useful way of viewing what offerings are set at the parent entities for a particular week, which will therefore show in eGiving. There are three different calendars that can be viewed: **Sabbath School Offering · Weekly Church Offering · ADRA — Where it's needed most.**" — [ACAS wiki, *Offering of the Week*](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15439758/Offering+of+the+Week)

So the offering calendar is **three parallel calendars** (Sabbath School, weekly church offering, ADRA), maintained at the parent entity (mission/union/division), not a single weekly list. The specific week-by-week assignment for Fiji is **set in ACAS and not published** on any first-party page I could reach (see Unverified).

## 4. The fund chart (fund names and tithe vs offering)

The authoritative account structure is the GC Accounting Manual's chart of accounts, which fixes the fundamental tithe/non-tithe split:

> "61x Tithe (including gross tithe and percentages passed on) … 63x Non-tithe Offerings and Donations" — [GC Treasury, *2025 Accounting Manual — Financial Management in Seventh-day Adventist Church Organizations*, Chapter 4 "The Account Structure"](https://treasury.adventist.org/accountingmanual) ([PDF](https://hope-documents.fra1.digitaloceanspaces.com/683eefc43a6d554a2303947d/Pwe1754927828121.pdf))

The manual also splits offerings into two classes at the collection level:

> "Offerings fall into two broad categories: Offerings collected on behalf of other organizations [e.g. World Mission Offerings, Union or Division College Offerings, Hope Channel Offerings] · Offerings collected for the organization's use." — *Accounting Manual*, Chapter 20 §2003.

At the Fiji congregation level, the giving surface confirms **Tithe** as the distinct tithe fund:

> eGiving for "Fiji Mission — AUD" lists **Tithe** ("Tithe is used to support the ministry of local churches through pastoral salaries, as well as evangelism and additional services provided to the local church") with the offering funds behind a "Show Other Gifts" toggle. — [eGiving, *Fiji Mission — AUD*](https://egiving.org.nz/Fiji%20Mission%20-%20AUD)

ACAS reports operationalize the chart around the tithe/offering distinction and the local/non-local split: "Local Church Offerings" ("active accounts under the header of **Tithes, offerings and donations**"), "Non-Local Offerings report", "Remittable Funds from Child Entities", "Conference Tithe" ("how much tithe an entity is receiving / remitting each month"), and "Tithes and Offerings" ("break down of giving by child entity and offering"). — [ACAS wiki, *Reports*](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438868/Reports) and subpages.

**Conclusion on the fund chart:** the *structural* facts — a flat chart with the top-level distinction being **tithe vs non-tithe offering**, plus the sub-distinction among offerings (Sabbath School vs weekly church vs ADRA vs special project) — are first-party-verifiable. The **exact named list** (the full chart of accounts for Fiji Mission) is entity-specific configuration inside ACAS and is **not public** (see Unverified).

## 5. Tithe remittance (church → mission → union → division → GC)

The tithe flow is policy-governed, and its *shape* is public even though its *numbers* are not.

- **Church → mission is 100%.** "The local church is authorized only to accept and remit total tithe funds to its local conference/mission treasury." — [GC, *Use of Tithe* guidelines (voted 1985)](https://gc.adventist.org/guidelines/use-of-tithe/).
- **The mission is the storehouse and splits tithe upward.** "The local conference [conference, mission, section, union of churches] … collects tithe and sends the union the part belonging to the union, the division, and the GC." — *Accounting Manual*, Chapter 20 §2001.02, §2002.02.01.
- **The percentages are Working Policy, not the manual.** The manual references "**Tithe sharing percentages**" as a *data item* (a field carried in the entity's policy configuration, listed alongside exchange rates and inter-organization charge rates) but never prints the values. — *Accounting Manual*, Chapter on exchange rates/fixed rates (footnote "Including Tithe sharing percentages"), and §2002.02.01.

So the concrete remittance percentages (mission → union → division → GC) live in **GC Working Policy V ("Tithe") and the SPD Working Policy** — they are the denomination's IP and are not published on any first-party public page I could reach (see Unverified). The `{local%, upward%}` two-way split in `finance-module.md` is explicitly scoped "out of v1" for the multi-level chain (mission → union → division → GC is "above-conference … read-only aggregates", ADR-0008), which is consistent: for a Fiji church, Theobase v1 only needs **tithe = 100% upward to the mission** (a policy fact now confirmed by the *Use of Tithe* guideline), and COP offering = the three-tier formula above.

---

## Validation: can `policy-schema.md`'s schema represent this?

The package contents in `policy-schema.md` are: fund chart, offering calendar, remittance split `{local%, upward%}`, reporting schedule, office→action mapping, effective dates, unit-tree scoping. Checked against the primary sources:

| Schema element (`policy-schema.md`) | Real SPD/Fiji datum | Representable? |
|---|---|---|
| **Flat fund chart** (name + type ∈ {tithe, offering}) | Account structure is `61x Tithe` / `63x Non-tithe Offerings and Donations`, with offerings further split (Sabbath School, weekly church, ADRA, special project). | **Mostly.** The `type ∈ {tithe, offering}` enum is the correct top-level split, but the real chart needs a **second discriminator among offerings** (SS vs weekly vs ADRA vs special project) and per-fund **destination** (local vs non-local/upward vs GC). A flat `{name, type}` list is too coarse to drive COP distribution without that extra field. |
| **Remittance split `{local%, upward%}`** | COP is a **three-tier** formula: local church 50–60%, local mission + union/division 20–30% (SPD concrete: mission 20%, union/division 10%), GC 20%. | **Partially.** The two-way `{local%, upward%}` can only encode it if `upward` is defined as *everything above the local church* (mission + union/division + GC = 50% in SPD's concrete example). That loses the mission-vs-union/division-vs-GC distinction, which is fine for v1 (finance-module explicitly defers multi-level remittance) but the schema should note the split is really a **per-destination vector**, not a single upward scalar. |
| **Offering calendar field** | ACAS realizes it as **three parallel calendars** (Sabbath School Offering, Weekly Church Offering, ADRA) maintained at the parent entity, plus a "special project" designation. | **Partially.** A single "offering calendar" field is too thin; the real datum is *N parallel calendars keyed by fund type*, each with a week → promoted-destination mapping, and it is **set at the parent (mission/union/division), not the church** — which matters for unit-tree inheritance/override (ADR-0004). |
| **Effective dates / versioning** | COP ratio "voted by the GC and the divisions, **revised every 5 years**"; Working Policy V and the SPD Working Policy are versioned. | **Confirms.** The versioned effective-date model is exactly right. |

Net: the schema's *shape* (flat chart, split, calendar, effective dates, inheritance) is correct, but the **remittance split must become a per-destination vector** (or at least document `upward` as an aggregate), the **fund chart needs a destination/offering-subtype field** beyond `{tithe, offering}`, and the **calendar is plural** (three parallel calendars) with a parent-entity source of truth.

---

## Sources

- GC Stewardship — *The Combined Offering Plan (COP)* — https://stewardship.adventist.org/combined-offering
- GC Stewardship — *Offering Plans* (three plans compared) — https://stewardship.adventist.org/offering-plans
- GC Stewardship — *Calendar of Offerings* — https://stewardship.adventist.org/calendar-of-offerings
- SPD Stewardship — *Combined Offering Plan* (COP scope: PNG, Trans Pacific Union, NZ Pacific Union missions) — https://stewardship.adventistchurch.com/combined-offering-plan/
- SPD Stewardship — *Combined Offering Plan — One Page PDF* (voted ratio + SPD $100 example; cites GC Working Policy 2017-18 pp. 613-615) — https://stewardship.adventistchurch.com/wp-content/uploads/sites/16/2021/03/combined-offering-plan%E2%80%94one-page-pdf.pdf
- General Conference — *Use of Tithe* guidelines (voted 1985) — https://gc.adventist.org/guidelines/use-of-tithe/
- GC Treasury — *2025 Accounting Manual — Financial Management in Seventh-day Adventist Church Organizations* (Ch. 4 account structure; Ch. 20 tithe-supported organizations) — https://treasury.adventist.org/accountingmanual (PDF: https://hope-documents.fra1.digitaloceanspaces.com/683eefc43a6d554a2303947d/Pwe1754927828121.pdf)
- SPD "Adventist Technology Documentation" wiki — ACAS space (Reports; *Offering of the Week*; *Local Church Offerings*; *Remittable Funds from Child Entities*; *Conference Tithe*; *Tithes and Offerings*; *Chart of Accounts*) — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/
- Fiji Mission of Seventh-day Adventists (home + Stewardship Department) — https://fijimission.adventist.org.fj/
- eGiving — *Fiji Mission — AUD* (Tithe fund) — https://egiving.org.nz/Fiji%20Mission%20-%20AUD
- GC Stewardship — COP vote record, 2002 Annual Council — https://documents.adventistarchives.org/Minutes/GCC/GCC2002-04SM.pdf (referenced from the COP page; not opened)

All sources accessed 2026-08-16.

## Unverified / unreached

- **Tithe-sharing (remittance) percentages — mission → union → division → GC.** These are the denomination's IP. First-party public sources confirm the *chain* (church remits 100% tithe to the mission; the mission shares tithe to union/division/GC) but **do not publish the numbers** — the GC Accounting Manual references "Tithe sharing percentages" as a data field without printing values, and the authoritative numbers live in **GC Working Policy V ("Tithe")** and the **SPD Working Policy**, neither of which is freely published. **Where the data must come from:** the Fiji Mission / TPUM / SPD treasury, via the policy-feed import path — exactly as `policy-schema.md` already assumes ("the mission imports its real COP data through the same feed path").
- **The named fund chart (full chart of accounts) for Fiji Mission.** The structural split (Tithe vs non-tithe offerings; local vs non-local) is public; the **exact named fund list** is entity-specific configuration inside ACAS and not published. Must be supplied by the mission/SPD treasury at deployment.
- **The Fiji-specific weekly offering calendar** (which offering is promoted each Sabbath, for the three calendars: Sabbath School, weekly church, ADRA). Set at the parent entities in ACAS; no first-party public schedule for Fiji was reachable. Must come from the mission/SPD stewardship/treasury.
- **The 2002 Annual Council minutes PDF** (`documents.adventistarchives.org/Minutes/GCC/GCC2002-04SM.pdf`) was not opened — it is the primary vote record for COP adoption and should be read to pin the original formula wording if needed.
- **SPD Working Policy** itself (the division-voted COP formula and tithe-sharing table) is not freely available online; it is distributed to entities. This is the single authoritative document to obtain from the mission to confirm the concrete Fiji percentages at import time.
