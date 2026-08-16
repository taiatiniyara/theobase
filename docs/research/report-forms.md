# The report forms Theobase must reproduce — primary-source research note

Theobase derives its two upward-facing reports — the Annual Statistical Report and the Tithe & Offerings report — as projections over the append-only event log ([ADR-0007](../adr/0007-reports-derived-from-event-log.md)), requiring only human approval ([finance-module.md](../specs/finance-module.md) "Reports"). This note documents the **actual forms** those projections must reproduce, field by field, and maps each field to what the event log currently captures — flagging every field the log cannot yet derive.

Every field is cited to the form or document that owns it. Where the exact Fiji/SPD paper form is not reachable, the closest official form is documented and the variance noted.

---

## 1. Annual Statistical Report

The denomination's statistical reporting is a two-stage pipeline: the **local church** records membership changes, and the **conference/mission** submits a consolidated "STATISTICAL REPORT" that the GC's Office of Archives, Statistics, and Research (ASTR) compiles into the published *Annual Statistical Report* ([secretariat.adventist.org/ministries](https://secretariat.adventist.org/ministries) — "produces the denomination's *Yearbook* and *Annual Statistical Report*"; [adventiststatistics.org](https://www.adventiststatistics.org/) — "Information is received quarterly and annually from each of the denomination's thirteen divisions … from the local conferences and missions by way of the union conference and mission offices").

### 1.1 The canonical field list — GC "STATISTICAL REPORT" (ASR Table 24)

The GC's own *Annual Statistical Report* reproduces the exact submission form it expects from every conference/mission, as **Table 24 "Statistical Report for 2021"** ([documents.adventistarchives.org/Statistics/ASR/ASR2022.pdf](https://documents.adventistarchives.org/Statistics/ASR/ASR2022.pdf)). Its column headings are the authoritative field vocabulary:

| # | Field (per conference/mission, per year) | Theobase derivation |
|---|---|---|
| 1 | Churches | Unit-tree metadata (kind = Church), not an event |
| 2a | Companies | Unit-tree metadata (kind = Company), not an event |
| 2b | Church Attendance Average | **GAP** — no attendance event exists |
| 3a | Church Membership at Beginning of Year | Derived from roll projection at period start (baptism puts on, transfer-out removes — [data-model.md](../specs/data-model.md)) |
| 4a | Baptisms | `baptism` event ✓ |
| 4a2 | Former Members' Baptisms (re-baptisms) | `re-baptism` event ✓ |
| 4b | Professions of Faith | `profession-of-faith` event ✓ |
| 4c | Letters Received (transfers in) | `transfer-in` event ✓ |
| 4d | Adjustments — Added | **GAP** — no "adjustment added" membership event |
| 5a | Letters Granted (transfers out) | `transfer-out` event ✓ |
| 5b | Deaths | `death` event ✓ |
| 5c | Dropped | `removal` event ✓ |
| 5d | Missing | `marked-missing` event ✓ |
| 5e | Adjustments — Subtracted | **GAP** — no "adjustment subtracted" membership event |
| 6 | Church Membership at End of Year | Derived from roll projection at period end ✓ |
| 16 | Sabbath School Attendance Average | **GAP** — no Sabbath School event exists |

(Column numbering and labels transcribed from the ASR Table 24 header rows; the numbered cells read `1 · 2a · 2b · 3a · 3b · 4a · 4a2 · 4b · 4c · 4d · 5a · 5b · 5c · 5d · 5e · 6 · 16` over the labels `Churches · Companies · Church Attendance Average · Church Membership at Beginning of Year · Baptisms · Former Members' Baptisms · Professions of Faith · Letters Received · Adjustments · Letters Granted · Deaths · Dropped · Missing · Adjustments · Church Membership at End of Year · Sabbath School Attendance Average`.)

Three footnotes in that same ASR are directly relevant to Theobase's Fiji/COP framing:

- "Beginning with 2011, number of Sabbath Schools are no longer collected."
- "In 2012, Sabbath School Membership was changed to Sabbath School Attendance."
- "Because of the Combined Offering Plan, not all divisions are reporting SS Mission Offerings separately."

This confirms (a) Sabbath School *attendance* is a required statistical field, and (b) the COP ([policy-schema.md](../specs/policy-schema.md)) already folds Sabbath School Mission Offering into a combined pool at the GC level — which is why Theobase models offerings as a flat fund chart rather than a fixed set of GC columns.

### 1.2 The church-side form — what the clerk actually fills

The local church does not fill the 16-column table directly; it reports the underlying **person-level changes**, and the conference totals them. The closest official church-side form is the NAD **"Church Clerk's Report"** (Texas Conference, [Offline-Church-Clerks-Report.pdf](https://www1.texasadventist.org/wp-content/uploads/2016/07/Offline-Church-Clerks-Report.pdf)):

- **Members Added** — per person: Name, Address, Telephone, Zip, Date of Birth, **How Added** ∈ {`B` Baptism, `P` Profession of Faith, `T` Transfer by Letter}, Date Admitted, and (for baptism/PoF) the officiating minister's name.
- **Members Dropped** — per person: Name, Address, Zip, Date of Birth, **How Dropped** ∈ {`T` Transfer, `D` Death, `A` Apostasy, `M` Missing}, Date Dropped, and (for transfer) destination church.
- **Totals** — members added by category, members dropped by category, and **Membership at close of month**.

This form is monthly (NAD, eAdventist-era), while the GC statistical report is annual; the field categories are identical. It confirms the per-person evidence Theobase already models: the "How Added / How Dropped" codes map one-to-one onto `baptism`, `profession-of-faith`, `transfer-in` / `transfer-out`, `death`, `removal`, `marked-missing` ([event-catalog.md](../specs/event-catalog.md)).

### 1.3 Statistical report gaps against Theobase's event log

1. **Church Attendance Average** (col 2b) — no event. Theobase's event catalog has no attendance capture of any kind.
2. **Sabbath School Attendance Average** (col 16) — no event; Sabbath School does not exist in the model at all.
3. **Adjustments Added / Subtracted** (cols 4d, 5e) — the GC form distinguishes routine accessions/losses from *adjustments* (e.g. the "adjustments added" column included in accessions since 2015, per the ASR note). Theobase has `correcting-event` and `family-reassignment` but no distinct membership *adjustment* event; a correction today would need a correcting event, which is auditable but does not map cleanly to the "adjustment" bucket the denomination reports.
4. **Re-baptism** is labelled "Former Members' Baptisms" in the GC form; Theobase's `re-baptism` event covers it, but the projection must bucket it into the right column.

---

## 2. Tithe & Offerings report (remittance statement)

This is the **monthly** report a church submits to its conference/mission: tithe plus each offering fund, a total, and the remittance split. Three primary sources triangulate its structure.

### 2.1 The SPD's own report — ACAS

Fiji Mission is SPD. SPD's official accounting system, ACAS ("replacing the Tithes & Offerings application", [ACAS overview](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/overview)), defines the income surface and the reports the church and mission produce:

- **Receipt Entry** (the church-side capture, [Receipt Entry](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15435751/Receipt+Entry)) — each receipt carries: **Period, Date, Giver** (with a dedicated `Deacon` giver for offering-bag amounts), **Payment Method** (Cash/Cheque/…), **Amount Received**, **Bank Account**, **Details** (e.g. "Tithe", "Local Church Budget"), **Account** (the fund being allocated to), **Allocate** amount, **Tax Category**, and **Allocation Details**; one receipt may split across multiple accounts/funds ("proceed to add amounts using the New Row button until the total amount has been allocated").
- **Monthly Report** ([Monthly Report](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438915/Monthly+Report)) — "shows what income was received and will get remitted to the Parent entity each month when the Period Close is done. It also shows Expense Payments and/or Express Payment entries made in the period." This is the church's monthly T&O/remittance statement.
- **Tithes and Offerings** report ([Tithes and Offerings](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438927/Tithes+and+Offerings)) — "details of tithes and offerings received by and remitted for an entity for a given period … providing a break down of giving by child entity and offering" (Excel export).
- **Local Church Offerings** vs **Non-Local Offerings** ([Local Church Offerings](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/247234562/Local+Church+Offerings); [Non-Local Offerings report](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15440820/Non-Local+Offerings+report)) — the *retained vs remitted* split is a first-class distinction: "The Classification field on Non-Local Offerings determines where amounts show" ([GC Statistical Report](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15441293/GC+Statistical+Report), which SPD treasury uses "to complete reports on tithe and offerings for the GC").
- **GC Statistical Report** ([same page](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15441293/GC+Statistical+Report)) — the SPD's feed into the GC's tithe-and-offerings report; "At the Church level, all Income accounts will be included on the report."

This confirms Theobase's core finance model precisely: income is per-receipt line items allocated to a **fund/account**, and remittance is a **computed** local-vs-upward split (`{local%, upward%}` in [finance-module.md](../specs/finance-module.md)), never hand-edited — ACAS's local/non-local classification is the same idea.

### 2.2 The GC's tithe-and-offerings fund categories (ASR Table 6)

The GC's *Annual Statistical Report* also publishes **"TITHE AND OFFERINGS 2021" (Table 6)**, the fund breakdown the denomination aggregates ([ASR2022.pdf](https://documents.adventistarchives.org/Statistics/ASR/ASR2022.pdf)):

| Fund | Theobase derivation |
|---|---|
| Tithe | `tithe` event ✓ (remitted almost entirely upward, per [CONTEXT.md](../../CONTEXT.md)) |
| World Mission Fund, Including Sabbath School | `offering` event on a fund whose split sends upward; fund name from policy feed (COP) |
| Other General Conference Funds | `offering` event on a GC-designated fund |
| Intradivision Funds | `offering` event on an intra-division fund |
| Ingathering Funds | `offering` event on an Ingathering fund |
| Local Church Funds | `offering` event on a local fund (local% = 100) |

The ASR also computes **Tithe per capita** and **Total Tithe and Offerings per capita** (Table 6), i.e. the GC's reporting layer derives per-member ratios by joining the giving totals to membership — the same join Theobase can make from `tithe`/`offering` events to the roll projection.

### 2.3 The normative remittance accounting (GC Accounting Manual)

The GC's **2025 Accounting Manual** ([treasury.adventist.org/accountingmanual](https://treasury.adventist.org/accountingmanual), PDF) is the policy document the remittance report must satisfy:

- **"Tithe and Offerings Remittance Accounts"** (§1102.01) — collecting tithe/offerings and sharing tithe "among the conferences, unions, divisions, and General Conference produces numerous receivable and corresponding payable accounts"; agency receivables/payables must be kept separate from regular receivables.
- **"Tithe accruals"** (§1403.05) — "A perennial challenge for treasurers is missing tithe and offering reports … organizations must conservatively estimate and accrue the missing amount," studying giving trends and previous reports.
- **"Use of Tithe Report"** (§2002.01) — the annual, upward accountability report: **Tithe Received** (from members; tithe percentages received from lower organizations; tithe appropriations received; other; *less* tithe percentages sent to higher organizations) and **Use of Tithe** (pastors/evangelists/front-line workers; headquarters; education at Elementary/Secondary/College levels; direct evangelism; media outreach; literature evangelism; retirement fund contributions; other uses, broken out if >5%).

The `tithe` event plus the fund chart's `{local%, upward%}` split gives Theobase the **Tithe Received** half directly; the **Use of Tithe** half is a *conference/mission-level* expenditure report, not a church-level T&O report — out of Theobase's v1 church scope (v1 remittance is mission → union → division → GC read-only aggregates, [ADR-0008](../adr/0008-multi-tenant-at-conference-mission-level.md)).

### 2.4 T&O report gaps against Theobase's event log

1. **Offering fund names** — the GC fund categories (World Mission, Ingathering, Intradivision, Local Church) are policy-feed data (COP), not code. Theobase's placeholder seed ([policy-schema.md](../specs/policy-schema.md) "Bootstrap seed") is illustrative only; the real fund chart must be imported.
2. **Per-capita metrics** (tithe per capita, offerings per capita) — derivable from existing events joined to the roll, but no projection is yet specified for report-level derived metrics.
3. **Non-cash giving / eGiving** — ACAS records eGiving as a separate income stream ([eGiving – Details](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438886/eGiving+-+Details)); Theobase's v1 counting room is cash-oriented, and online giving is deferred (ADR-0017, [strategy.md](../strategy.md)).
4. **GST/tax** — ACAS carries a **Tax Category** on every receipt (Australia/NZ GST context). Fiji's GST position is not documented in the sources reached; the fund chart has no tax dimension.

---

## Fiji / SPD variance

- **Exact Fiji form not reachable.** Fiji Mission's own clerk/treasurer forms are not published on its site ([fijimission.adventist.org.fj](https://fijimission.adventist.org.fj/) — Treasury and Secretariat menu items are placeholder anchors, no forms pages). The closest Fiji artifact found is a scanned **"LOCAL CHURCH CLERK'S REPORT BOOK"** ("RIPOTE NI VUNIVOLA NI SOQOSOQO LOTU") — Fiji Mission branding, Fijian text, "Report to be in the Mission office by 10th day of first month of New Quarter" ([Scribd re-upload](https://www.scribd.com/document/725639233/Church-Clerk-Report-Booklet-Gray-July-201933-1)). It confirms Fiji operates a **quarterly** clerk report cycle (vs the GC's annual table and NAD's monthly form) but its interior field list could not be read (Scribd challenge-gated). Flagged in Unverified.
- **The closest official form** for the membership/statistical side is the NAD Texas "Church Clerk's Report" (§1.2) — same add/drop categories Theobase models — and for the finance side the SPD **ACAS** "Monthly Report" + "Tithes and Offerings" report (§2.1), which is the system Fiji Mission actually runs (ACAS is SPD-wide).
- **Variance to note:** NAD is quarterly/online (eAdventist), SPD/Fiji is quarterly-to-mission; the GC statistical table is annual and includes attendance and Sabbath School fields that neither Theobase nor the church-side forms (which are add/drop-only) currently capture.

---

## Sources

Theobase (frame):
- `docs/adr/0007-reports-derived-from-event-log.md`
- `docs/adr/0008-multi-tenant-at-conference-mission-level.md`
- `docs/specs/finance-module.md`, `docs/specs/event-catalog.md`, `docs/specs/data-model.md`, `docs/specs/policy-schema.md`
- `CONTEXT.md`, `docs/strategy.md`

Annual Statistical Report:
- GC Annual Statistical Report 2022 (reporting year 2021) — "STATISTICAL REPORT FOR 2021" Table 24 and "TITHE AND OFFERINGS 2021" Table 6 — https://documents.adventistarchives.org/Statistics/ASR/ASR2022.pdf
- GC Secretariat — ASTR ("produces the denomination's *Yearbook* and *Annual Statistical Report*") — https://secretariat.adventist.org/ministries
- Adventist World Statistics (ASTR) — how the ASR is compiled — https://www.adventiststatistics.org/
- Texas Conference — "Church Clerk's Report" (Offline Church Clerk's Report, NAD) — https://www1.texasadventist.org/wp-content/uploads/2016/07/Offline-Church-Clerks-Report.pdf
- Texas Conference — Clerk's Reports and Order Forms — https://www1.texasadventist.org/churches/membership-records/clerks-reports/
- eAdventist — Statistical Reporting for Conferences — https://help.eadventist.net/article/231-statistical-reporting-for-conferences

Tithe & Offerings report / remittance:
- ACAS (SPD "Adventist Technology User Guides" wiki) — Receipt Entry — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15435751/Receipt+Entry
- ACAS — Monthly Report — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438915/Monthly+Report
- ACAS — Tithes and Offerings — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438927/Tithes+and+Offerings
- ACAS — Local Church Offerings — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/247234562/Local+Church+Offerings
- ACAS — Non-Local Offerings report — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15440820/Non-Local+Offerings+report
- ACAS — GC Statistical Report — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15441293/GC+Statistical+Report
- ACAS — overview — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/overview
- GC Treasury — 2025 Accounting Manual (PDF) — https://treasury.adventist.org/accountingmanual (Tithe and Offerings Remittance Accounts §1102.01; Tithe accruals §1403.05; Use of Tithe Report §2002.01)

Fiji:
- Fiji Mission of Seventh-day Adventists — https://fijimission.adventist.org.fj/
- "Local Church Clerk's Report Book" (Fiji Mission, Fijian) — Scribd re-upload (not a first-party host) — https://www.scribd.com/document/725639233/Church-Clerk-Report-Booklet-Gray-July-201933-1

## Unverified / unreached

- **Fiji Mission's exact paper forms** — the Fiji clerk's report book and any Fiji-specific T&O remittance form are not published on fijimission.adventist.org.fj (Treasury/Secretariat nav items are empty anchors). The one reachable Fiji form is a Scribd scan whose interior pages are challenge-gated, so its field list is **not** verified. This is the highest-value gap: it determines whether Fiji's quarterly clerk report adds fields beyond the GC/NAD set (e.g. baptismal classes, ingathering, local-language labels).
- **Scribd** (`scribd.com`) requires JavaScript/auth and could not be fetched; the Fiji clerk report booklet is therefore cited only by its title/branding from the search snippet, not its contents.
- **adventiststatistics.org** returned HTTP 403 and **adventist.org/statistics** returned HTTP 429 on repeated attempts; the ASR is therefore cited via the ASTR-hosted PDF and the Secretariat description, not the statistics landing page.
- **SPD statistical report form** — the SPD-specific annual statistical form (the paper the mission sends to the division) was not located as a standalone document; SPD statistics run through ACMS membership/statistical reporting, which is role-gated and not publicly documented field-by-field beyond the ACAS finance wiki pages cited above.
- **Fiji GST treatment** — neither the Fiji site nor the ACAS wiki states Fiji's GST handling on tithe/offerings; ACAS carries a Tax Category field (Australia/NZ context), but the Fiji-specific tax position is unverified.
- **Use of Tithe Report** is a conference/union-level annual report, not a church-level T&O report; its category list is cited from the Accounting Manual §2002.01 but Theobase's v1 does not need to produce it (out of church scope).
