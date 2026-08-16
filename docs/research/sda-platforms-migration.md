# SDA platform incumbents and the path off them — primary-source research note

What the Seventh-day Adventist denomination actually runs at the grassroots, traced to each system's own first-party documentation (help sites, official portals, manuals, wikis), and what a church or conference would concretely do to leave each one for Theobase. Every claim is cited to the URL or document that owns it; anything not verifiable against a first-party source is dropped or flagged as unreached.

Theobase's own position (the frame this research serves): Theobase is a **replacement** for these systems, not an aggregator over them — "ACMS (membership) and ACAS (local-church finance), which together supersede the older eAdventist membership system" ([ADR-0001](../../adr/0001-theobase-replaces-eadventist.md)). Its stated migration path is free self-serve **CSV import** of the membership roll, a **paid migration service**, and an **ongoing transfer bridge** carried by the Letter of Transfer that crosses the Theobase↔ACMS boundary ([migration.md](../../specs/migration.md), [event-catalog.md](../../specs/event-catalog.md)). The transfer bridge is the strategic gate: "the adoption virus" and "the switching cost" ([strategy.md](../../strategy.md)).

---

## eAdventist — NAD's membership system

**What it is and what data it owns.** eAdventist is the North American Division's membership system: "Church membership & church management" plus "powerful email and SMS messaging" and a mobile myEADVENTIST app ([eadventist.net](https://eadventist.net)). It is NAD-run (footer: "North American Division of Seventh-day Adventists"). It owns the **membership roll** — person records, families (Family Unit Records, "FURs"), officers, attendance, statistical changes (baptism, profession of faith, transfer, death, missing, removed) — and the **transfer** mechanism between churches.

**The online / offline / off-system model.** eAdventist's own docs define three tiers ([Online, Offline & Off-system explained](https://help.eadventist.net/article/251-online-offline-off-system-explained)):

- **Online** church: the local clerk has an eAdventist account and processes transfers electronically. "Every conference in the North American Division uses eAdventist… so they are all considered Online."
- **Offline** church: "When a clerk does not process membership transfers electronically, they rely on the Conference Clerk to process their transfers electronically and the church is considered to be **Offline**."
- **Off-system** church: outside NAD — "its conference does not use eAdventist." Crucially, the same doc notes: "Many **off-system** churches use ACMS — a membership application provided by the General Conference. There aren't currently any 'bridges' between eAdventist and ACMS, but we are planning to implement some in the near future."

This is the "workaround, not a product" the ADR cites: for an **offline** church, "the conference clerk takes care of the updating transfers and membership records in eAdventist. They also rely on the conference clerk to provide these printed reports on a regular basis" ([Reports for Offline Churches](https://help.eadventist.net/article/54-reports-for-offline-churches)).

**How data gets in/out.** The local clerk enters data only when "online"; otherwise the **conference clerk** does it. Outputs are **printed reports** the conference clerk mails out — FURs by Church ("complete member & nonmember records, grouped by family"), Family List, FURs by Change Date, Pending Transfers, and quarterly Membership Statistics ([Reports for Offline Churches](https://help.eadventist.net/article/54-reports-for-offline-churches)). The conference clerk is explicitly "the 'post office' for all transfer mail to offline churches and churches outside of North America and Guam/Micronesia."

**Is there a real API or only manual export?** There is a real REST web-service layer, but it is thin and rate-limited ([Web Services](https://help.eadventist.net/article/16-web-services)):

- REST over HTTPS, XML (default) or JSON, gated at **4 requests/hour per account**.
- Exposes directories, not the roll: congregations, member **counts**, pastors, schools, conferences, organizations, locator data.
- The one service that did expose the full roll — `web_services/membership`, "Multiple CSV files compressed in a ZIP file" for a whole conference/union — is marked **"Membership — deprecated 16-Mar-2023"**, with the note "(deprecated) the Membership service will be replaced by lighter weight services."
- The newer token-based API layer ([API Services](https://help.eadventist.net/article/119-api-services)) is explicitly **beta** and returns only `first name / last name` for a Person, and `first name / last name / office / photo` for an Officer.

So today the realistic programmatic pull is counts and names, not the membership roll; the roll comes out as printed FURs and reports.

**Transfer / letter mechanism.** Transfers are a three-step vote — **Request → Grant → Accept** — where each clerk enters their church's vote and eAdventist notifies the other clerk "by email (or postal mail)" ([Transfers – Outbound](https://help.eadventist.net/article/126-transfers-outbound), [Transfers – Inbound](https://help.eadventist.net/article/125-transfers-inbound)). For international/off-system churches the vote travels by **postal mail or email through the conference clerk**, who enters the foreign church's grant/accept vote on their behalf ([International Transfers – Inbound](https://help.eadventist.net/article/5-international-transfers-inbound), [– Outbound](https://help.eadventist.net/article/6-international-transfers-outbound)). The printed transfer form carries the conference clerk's contact info ([Getting started: Conference Clerk](https://help.eadventist.net/article/31-getting-started-conference-clerk)) — i.e., the paper Letter of Transfer already exists as the interop artifact for off-system churches, which is exactly what Theobase's transfer bridge exploits.

**Lock-in and the implication for leaving.** The lock-in is (a) the membership roll is NAD/centralized, (b) the CSV ZIP export that could have moved it was **deprecated in March 2023**, and (c) the surviving API exposes names only. For a **grassroots church**, leaving means requesting printed FURs from the conference clerk; for a **conference**, the deprecated membership web service (or conference-side reports like Statistical Recap, [Reports for Conference](https://help.eadventist.net/article/55-reports-for-conference)) is the historical bulk-export route. The transfer graph itself — every member who moves in or out — runs through the Request/Grant/Accept vote and the paper letter, which is the seam the Letter-of-Transfer bridge is designed to cross.

---

## ACMS — the General Conference's church-management platform

**What it is and what data it owns.** ACMS is the General Conference's system: "The Adventist Church Management System (ACMS) is a strategic IT platform that streamlines church administration and adapts to diverse global needs" ([acms.adventist.cloud](https://acms.adventist.cloud/)). It is the Secretariat's project — "to develop, implement, and support an effective Adventist church management software system that empowers local churches and enhances membership ministries" ([secretariat.adventist.org/ministries](https://secretariat.adventist.org/ministries)). eAdventist's docs describe it as "a membership application provided by the General Conference" used by off-system (non-NAD) churches ([article 251](https://help.eadventist.net/article/251-online-offline-off-system-explained)).

The official site now lists a **membership-plus-finance** feature set — Accounting Integration, Tithe & Offering Distribution, Asset Management, Bank Reconciliation, Check Remittance, Expenses, Online Giving, Auditing, Reports — and a demo form covering all 13 divisions plus the GC ([acms.adventist.cloud](https://acms.adventist.cloud/)). The SPD user-guide wiki documents the membership surface for church clerks: member search, registering members, baptisms, profession of faith, missing members, censure, transfers, church officers ([ACMS wiki](https://adventistcloud.atlassian.net/wiki/spaces/ACMS/overview)). A conference-facing page enumerates six work tracks — records/membership, ministry coordination, finance & stewardship (treasury records, remittances), reports, access, training ([Central Malawi Conference ACMS](https://cmc.adventist.org/acms/)). The IAD ACMS manual's menu shows the module tree: membership (people search, baptisms, admission approval, **transferência**/transfer, missing publication, duplicate detection, removals, deaths), departments (officers, Sabbath School, small groups), **relatórios** (reports), and a **tesouraria** (treasury: expenses, advances, transfers between accounts) ([ACMS Manual — IAD](https://acms.iatecdocs.com/)).

**Is it internet-based?** Yes. Access is a web portal — `https://www.acmsnet.org/` ([SPD ACMS wiki](https://adventistcloud.atlassian.net/wiki/spaces/ACMS/overview)) and `acms.adventist.cloud` — and conference onboarding is a "Register to Use ACMS" web form ([Central Malawi](https://cmc.adventist.org/acms/)). (Theobase's own docs assert ACMS is "internet-based and provided at no cost"; "internet-based" is directly evidenced here, but I could not verify the "no cost" wording against a first-party page and flag it in Unverified below.)

**How data gets in/out — export/import/API.** This is the critical gap for migration: **I found no first-party documentation of a CSV/Excel export, a bulk-import path, or a public API for ACMS.** The reachable primary sources describe reports generated inside the system ("Reports" is a named feature on both the official site and the conference page; the IAD manual has a Relatórios section), but none states an export format or an API. The SPD wiki's technical guides are all PDF/DOCX attachments (member record types, transfers, reports) with no export spec. This is a genuinely different posture from eAdventist, which at least documented (then deprecated) a CSV ZIP export.

**Transfer flow.** ACMS documents transfers including, notably, the non-ACMS cases: "Transfer to Location Without ACMS" and "Off System Transfers" appear in the SPD wiki's transfer section ([ACMS wiki](https://adventistcloud.atlassian.net/wiki/spaces/ACMS/overview)) — i.e., ACMS already has a paper/manual path for members moving to a church that isn't in the system, which is the same off-system seam the Letter-of-Transfer bridge targets.

**Lock-in and the implication for leaving.** Lock-in is the classic cloud-vendor shape but worse: the data is centralized in the GC platform, **no documented export**, no public API, and role-based access granted by the conference office. A grassroots church cannot pull its own roll without the conference's involvement; a conference can get reports but no first-party-documented bulk CSV of members. For Theobase this means the **Letter-of-Transfer bridge is not optional for membership — it is the only documented, always-available interop artifact** across the ACMS boundary, exactly as the ADR and strategy already reason ([event-catalog.md](../../specs/event-catalog.md), [strategy.md](../../strategy.md)). It also means Theobase's paid migration service would have to reconstruct the roll from whatever the conference can produce (printed/PDF member lists, statistical reports) rather than from a clean CSV — a real, defensible wedge.

---

## ACAS — the South Pacific Division's church accounting system

**What it is and what data it owns.** ACAS (Adventist Church Accounting System) is "the new Church-focused accounting software, which is replacing the Tithes & Offerings application. It is also used by Conferences, Missions, Unions and the Division" ([ACAS overview](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/overview)). It is web-based: "designed to assist local church treasury teams with completing the required recording and reporting functions"; access "requires a username and password, which can be obtained by completing the New User form and returning it to your local conference office"; roles determine which screens are visible; minimum specs include a broadband connection, a modern browser, and a computer under 5 years old ([ACAS Introduction](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15435491/Introduction)).

Its data is the church's **financial record**: income (tithe and offerings) and expenses, period close, general ledger, remittances, GST, and the reports that flow upward. The report tree is long — account statements, chart of accounts, client transactions, conference tithe, funds report, income & expense statement, trial balance, "T&O Analysis," remittable funds, GST, and the GC Statistical Report ([ACAS Reports](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438868/Reports)).

**Export path.** Two concrete, documented exits:

- **Reports are PDF by default** — "Unless specified as an Excel report, all reports are generated as PDFs" ([ACAS Reports](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438868/Reports)).
- **Journal Export** is the machine-readable exit: "This report is useful for the conferences, unions and the division to generate so that figures from ACAS can be entered into other accounting systems… The report generates in **Excel format**" ([Journal Export](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438907/Journal+Export)). There is even a variant formatted for the Acumatica GL ("Journal Export – Acumatica").

Note the export is framed as a **conference/union/division** tool for pushing figures into *their* upstream accounting system — the **local church** is not the documented audience for the Excel export; a church treasurer's own outputs are PDF reports.

**API?** None documented. The exit is report-based (PDF/Excel), gated behind the conference-issued account.

**Lock-in and the implication for leaving.** Lock-in is moderate: ACAS is web-only (broadband required), SPD-centralized, and the local church's documented out-path is PDFs. But the **Excel Journal Export** exists, so a conference/union *can* pull figures for re-entry elsewhere. For Theobase this validates the "replace ACAS first" strategy ([strategy.md](../../strategy.md)): finance is the least entrenched at the grassroots (the church itself mostly gets PDFs), and the Excel journal export gives a service-based migration something concrete to parse. The friction is that the clean Excel path is a conference-side function, not a church-side self-serve button — so grassroots finance migration is still PDF/manual, matching the "paid migration service" stance in [migration.md](../../specs/migration.md).

The GC's **Accounting Manual** (policy, not software) sits alongside: the "2025 Accounting Manual — Financial Management in Seventh-day Adventist Church Organizations," published by General Conference Treasury ([treasury.adventist.org/accountingmanual](https://treasury.adventist.org/accountingmanual)). This is the normative document Theobase's policy feed must track (it defines the tithe/offering and funds rules ACAS encodes).

---

## Adventist Giving — NAD's online giving portal (complement, not a full competitor)

**What it is.** AdventistGiving is the North American Division's online giving site: "AdventistGiving allows you to easily return tithe and give offerings to your local church" ([adventistgiving.org](https://adventistgiving.org/)). It is NAD-run (footer: "North American Division Corporation of Seventh-day Adventists") and **giving-only**: it processes online tithe and offerings; it does not do the counting room, cash handling, disbursements, or dual-signature cash-count reconciliation.

**How it relates to the church's books.** Donations are "batched up and sent to your church twice a month" with a **Deposit Report**, downloadable "either PDF or CSV," which the church treasurer "uses when posting tithes and offerings to your accounting program" ([Deposit Reports](https://adventistgiving.helpscoutdocs.com/article/387-deposit-reports)). Enrollment goes through the treasurer/pastor emailing Help@AdventistGiving.org ([How does my church sign up?](https://adventistgiving.helpscoutdocs.com/article/86-how-does-my-church-sign-up)).

**Competitor or complement?** It is a **complement** to the accounting system (it *feeds* the church's books via a PDF/CSV deposit report) and a **partial competitor** only to Theobase's deferred online-giving/member self-service module ("member self-service (deferred ADR-0017)," [strategy.md](../../strategy.md)). It overlaps with none of Theobase's core offline-first, counting-room, dual-signature finance. Its significance for migration is narrow: a church leaving eAdventist/ACMS world for Theobase still receives online giving as a CSV deposit report it can ingest alongside paper envelopes.

---

## The denomination's data layer — Yearbook, statistics, and the cloud infrastructure

- **Yearbook** — the online directory of the denomination's organizations, "LIVE, reflecting changes as they are made to the Yearbook database at the General Conference" ([adventistyearbook.org](https://www.adventistyearbook.org/)).
- **Annual Statistical Report / statistics** — produced by ASTR, which "produces the denomination's *Yearbook* and *Annual Statistical Report*" ([secretariat.adventist.org/ministries](https://secretariat.adventist.org/ministries)). The statistical data itself is fed upward by the grassroots systems: eAdventist's quarterly statistical reporting for conference/union/division ([Statistical Reports](https://help.eadventist.net/category/229-statistical-reports)) and ACAS's **GC Statistical Report**, "used by the SPD treasury staff to complete reports on tithe and offerings for the GC" ([GC Statistical Report](https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15441293/GC+Statistical+Report)). I could not reach `adventist.org/statistics` (HTTP 429) or `adventiststatistics.org` (HTTP 403); see Unverified.
- **AdventistCloud / Adventist Connect / eAdventist Membership Services** — the "AdventistCloud" surface is the SPD's "Adventist Technology User Guides" wiki (adventistcloud.atlassian.net) hosting both the ACMS and ACAS spaces. **Adventist Connect** surfaces as a named consumer of eAdventist's newer web services ("Connect Officers (v2) … as authorized for Adventist Connect," [Web Services](https://help.eadventist.net/article/16-web-services)). These are the current infrastructure surrounding the grassroots systems; none of them publishes an open export/API of the membership roll that I could find.

---

## Switching to Theobase — the concrete path off each incumbent

| Incumbent | What a church can export today | Who can do it | Real API? | Where the Letter-of-Transfer bridge helps | Main friction |
|---|---|---|---|---|---|
| **eAdventist** | Printed FURs / Family List / quarterly Membership Statistics; historical bulk CSV via the **deprecated** membership web service (ZIP of CSVs, conference-scoped) | Local clerk reads printed reports; **conference clerk** is the one who generates & mails them and could pull the deprecated CSV | Thin REST (4 req/hr; counts/names), beta JSON API (names only) — **no full-roll API** | Paper/email transfer vote already routes through the conference clerk for off-system churches — the bridge slots in there | CSV export deprecated; roll lives at the conference, not the church |
| **ACMS** | No documented CSV/Excel export or API in first-party docs; reports generated in-system | Conference/division staff (role-gated); local clerk can't self-serve a bulk pull | **None documented** | "Transfer to Location Without ACMS" / "Off System Transfers" already require a manual/paper path — the bridge is the baseline | Centralized, no export, no API — the crown-jewel switch is bridge-gated |
| **ACAS** | PDF reports (all non-Excel reports); **Excel Journal Export** (and an Acumatica variant) | Journal Export is documented for **conferences/unions/division**, not the local church | **None documented** | Not a membership system — no letter needed; but finance migration is service/PDF-based | Local church's own out-path is PDFs; Excel exit is conference-side |
| **Adventist Giving** | Deposit Report as **PDF or CSV** (twice-monthly) | Church treasurer (treasurer portal) | None documented (report download) | N/A (giving-only, feeds the books) | NAD-only; no offline/counting room |
| **Data layer (Yearbook/statistics)** | Directory/aggregate data, not church-level records | Public (Yearbook); GC/division (statistics) | N/A | N/A | Statistics feeds are upward rollups, not a leave-path |

**Reading the table into Theobase's plan:**

1. **eAdventist → Theobase (membership, NAD).** The church-side path is printed FURs and the quarterly membership statistics, obtained from the conference clerk; the conference-side path is the deprecated membership CSV ZIP or the Statistical Recap. Theobase's **self-serve CSV import** ([migration.md](../../specs/migration.md)) maps cleanly only where a conference still has/will produce that deprecated CSV; elsewhere it is a **paid migration service** transcribing printed FURs. The **Letter-of-Transfer bridge** is the ongoing two-way seam, because every cross-boundary transfer already runs on paper/email through the conference clerk.

2. **ACMS → Theobase (membership, global South / SPD).** No export, no API: the roll must be reconstructed from printed/PDF member lists and the statistical report at the conference level. The transfer bridge is the *only* documented always-available interop artifact — which is why the ADR/strategy make it a strategic dependency, and why the bridge doubles as the adoption vector (each off-system transfer is a reason to onboard the receiving church).

3. **ACAS → Theobase (finance, SPD/Fiji).** Finance migration is genuinely service-shaped today: the local church gets PDFs; the conference/union can pull the **Excel Journal Export** and hand it to a migration service to seed Theobase's ledger. This supports "replace ACAS first" as the wedge, but the Excel exit is a conference-side function, not a church self-serve button.

4. **Adventist Giving → Theobase.** Not a migration target; it continues to emit a PDF/CSV deposit report that Theobase's remittance/income flow should be able to consume alongside the counting room.

The one structural fact across all four: **the denomination's systems expose their data as reports (printed/PDF/Excel), not as APIs, and the full membership roll is gated at the conference or is already a paper letter.** That is precisely the gap Theobase's CSV import + paid migration + Letter-of-Transfer bridge is designed to close, and it is the concrete reason the bridge — not a one-time import — is the switching cost.

---

## Sources

- Theobase ADR-0001 — `docs/adr/0001-theobase-replaces-eadventist.md`
- Theobase migration spec — `docs/specs/migration.md`
- Theobase event catalog (Transfer bridge) — `docs/specs/event-catalog.md`
- Theobase strategy — `docs/strategy.md`
- eAdventist home — https://eadventist.net
- eAdventist Help Center — https://help.eadventist.net
- eAdventist: Online, Offline & Off-system explained — https://help.eadventist.net/article/251-online-offline-off-system-explained
- eAdventist: Reports for Offline Churches — https://help.eadventist.net/article/54-reports-for-offline-churches
- eAdventist: Reports for Conference — https://help.eadventist.net/article/55-reports-for-conference
- eAdventist: Web Services — https://help.eadventist.net/article/16-web-services
- eAdventist: API Services — https://help.eadventist.net/article/119-api-services
- eAdventist: Transfers – Outbound — https://help.eadventist.net/article/126-transfers-outbound
- eAdventist: Transfers – Inbound — https://help.eadventist.net/article/125-transfers-inbound
- eAdventist: International Transfers – Inbound — https://help.eadventist.net/article/5-international-transfers-inbound
- eAdventist: International Transfers – Outbound — https://help.eadventist.net/article/6-international-transfers-outbound
- eAdventist: Getting started: Conference Clerk — https://help.eadventist.net/article/31-getting-started-conference-clerk
- eAdventist: Statistical Reports — https://help.eadventist.net/category/229-statistical-reports
- ACMS official site (General Conference) — https://acms.adventist.cloud/
- GC Secretariat, Ministries (ACMS + ASTR) — https://secretariat.adventist.org/ministries
- ACMS wiki (SPD "Adventist Technology User Guides") — https://adventistcloud.atlassian.net/wiki/spaces/ACMS/overview
- ACMS Manual (IAD, hosted by IATEC) — https://acms.iatecdocs.com/
- ACMS | Central Malawi Conference — https://cmc.adventist.org/acms/
- ACAS overview (SPD wiki) — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/overview
- ACAS Introduction — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15435491/Introduction
- ACAS Reports — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438868/Reports
- ACAS Journal Export — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15438907/Journal+Export
- ACAS GC Statistical Report — https://adventistcloud.atlassian.net/wiki/spaces/TnO2/pages/15441293/GC+Statistical+Report
- General Conference Treasury — 2025 Accounting Manual — https://treasury.adventist.org/accountingmanual
- AdventistGiving — https://adventistgiving.org/
- AdventistGiving: Deposit Reports — https://adventistgiving.helpscoutdocs.com/article/387-deposit-reports
- AdventistGiving: How does my church sign up? — https://adventistgiving.helpscoutdocs.com/article/86-how-does-my-church-sign-up
- Adventist Yearbook (GC/ASTR) — https://www.adventistyearbook.org/

## Unverified / unreached

- **ACMS export format / API**: I could find **no first-party documentation** of a CSV/Excel export, bulk import, or public API for ACMS. The SPD wiki's technical guides are PDF/DOCX attachments I could not open, so an export path may exist in a document rather than a web page. This is a high-value gap to close with the ACMS team directly — it determines whether Theobase's paid migration can parse a machine-readable roll or must transcribe printed lists.
- **"Provided at no cost"** (Theobase strategy.md's characterization of ACMS): "internet-based" is directly evidenced (web portal), but I could not verify the "no cost" wording on a first-party ACMS page; the phrase appears only in a Scribd re-upload of an ACMS overview, which is not a primary source and was not relied on.
- **Statistics pages**: `adventist.org/statistics` returned HTTP 429 and `adventiststatistics.org` returned HTTP 403 on repeated attempts; the Annual Statistical Report is therefore cited via the ASTR description on the Secretariat site, not the statistics site itself.
- **ACMS Manual (IAD) prose**: the manual at `acms.iatecdocs.com` is JavaScript-rendered; I read its module tree via the WordPress JSON API (Portuguese) but could not read full English article prose, so the manual is cited only for its module structure.
