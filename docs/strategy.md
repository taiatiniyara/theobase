# Theobase — Strategy

The champion thesis, the moat, and the platform roadmap. Read this before making product-direction or scope decisions.

## The champion thesis

Theobase wins by being the **only system that works where the church actually is** — offline, rural, on a phone, in a volunteer's hands — **and** is *policy-native* for the Seventh-day Adventist Church. Every incumbent fails one of those two, and both are required.

## The competitive reality

- **eAdventist** (the older membership system) defines an *"offline church"* as one where *"the conference clerk takes care of updating… records… they rely on the conference clerk to provide these **printed reports**."* The denomination's answer to a rural church without internet is a workaround — print reports at the conference — not a product.
- **ACMS** (the replacement) is *internet-based*. Cloud and standardized — but "internet-based" is the exact failure mode that led Fiji's churches to abandon it (ADR-0005).
- **General ChMS** (ChurchCRM, Planning Center, Tithe.ly, Breeze, …) assume always-on internet, a flat "one church" model, Western pricing, and know nothing of tithe vs offering, dual-signature, or the SDA hierarchy.

The real competition is not other software — it is **paper and spreadsheets**, which the denomination's own tools keep losing to in the global South.

## The moat

1. **The offline→sync architecture.** A per-church authoritative Durable Object with a hash-chained event log that a phone writes to with no connection, then syncs upward. The hardest thing in the product; nothing can bolt it on (ADR-0002, ADR-0019).
2. **Policy woven in.** Fund chart, COP splits, dual-signature, office→action, the statistical report — compliance by construction (ADR-0003). General ChMS can't do SDA policy; the denomination's own tools do it rigidly.
3. **The hierarchy as a data model, not a report.** Unit tree → upward rollup → conference/union/division/GC aggregates (ADR-0008). Flat ChMS can't; ACMS does it as reporting, not as a model you can sync.
4. **Anti-fraud as a feature.** Evidence photos + dual signature + immutable log (ADR-0009, ADR-0014). In a church where the treasurer's word is everything, "provable" is a selling point.
5. **The policy feed.** The one thing only the operated service keeps current (ADR-0013) — a distribution moat no fork can replicate.

## Champion moves

1. **Make the counting room the killer demo.** Highest-touch, highest-trust surface; the moment a volunteer feels "this did my weekend's work for me."
2. **Prove the offline→sync loop in Fiji end-to-end.** The riskiest technical bet and the whole moat.
3. **Give the Conference something it's never had** — live church health across its churches. The Conference is the payer; their "aha" moment is the business case.
4. **Kill the switching cost.** CSV self-serve import + paid migration + the Letter-of-Transfer bridge. The incumbents expose data as reports, not APIs — eAdventist's CSV export was deprecated in Mar 2023, and ACMS has no documented export or API — so the bridge is the only always-available interop artifact (see `docs/research/sda-platforms-migration.md`).
5. **Become the policy keeper.** The denomination relationship — being the one whose feed stays current with Working Policy/COP changes — is the long-term lock-in.

## Platform roadmap

The platform is the **substrate** — the Unit tree, event log, policy engine, and sync pipeline (ADR-0006) — not the UI. The PWA and office shell are clients of it.

- **Phase 1 — The beachhead.** Win Fiji Mission end-to-end with the core + finance + membership. Prove offline→sync on real phones; make the counting room loved.
- **Phase 2 — The data spine.** Multiple Conferences/Missions become tenants; the Unit tree becomes the denomination's spine. Theobase becomes *where the denomination's grassroots data lives* — the aggregation is the moat, not the features.
- **Phase 3 — The module platform.** Attendance, Sabbath School, ministry, education plug into the same core. Value compounds: each module deepens the reason to be on the spine.
- **Phase 4 — The ecosystem.** The policy feed becomes a distribution channel; community translation, member self-service (deferred ADR-0017), mobile money, and third-party modules arrive. Theobase becomes a platform *others build on*.

## The two platform-defining assets

1. **The Unit-tree spine.** Once a Union/Division's churches live in Theobase, leaving is a data-migration problem, not a "switch tools" problem.
2. **The policy feed.** The denomination publishes, Theobase distributes, every unit runs correct policy. This turns the denomination from customer into *platform partner*.

## Road to the all-in-one app

The end-state: Theobase becomes the system the denomination runs on — membership, finance, and everything else — displacing ACMS/ACAS/eAdventist as the default, not an option.

1. **Replace ACAS first (finance) — the wedge.** Money is the Conference's #1 pain; ACAS is the least entrenched at the grassroots (most churches still use paper); finance earns the trust membership will demand.
2. **Replace ACMS/eAdventist on membership — gated on the transfer bridge.** Membership is the crown jewel. The gate is the **live transfer bridge**: an ongoing two-sided transfer that crosses the Theobase↔ACMS boundary, carried by the Letter of Transfer — not just one-time CSV migration. Every cross-boundary transfer is a reason to onboard the receiving church (the adoption virus). See `docs/specs/event-catalog.md`.
3. **Exceed — become all-in-one.** Add the modules ACMS can't do well, in order: attendance (feeds "missing members"), Sabbath School, ministry (Pathfinders/Health), communication, education, Yearbook. "Everything in one place" becomes the reason, not a feature.
4. **Become the standard.** Bottom-up love (counting room + one-tap reports) spreads church-to-church; top-down, once a Union/Division's aggregates come out better from Theobase, the hierarchy pulls churches in — and the policy feed makes Theobase infrastructure. Endorsement is a milestone, not a prerequisite: win bottom-up (Fiji → SPD), convert to endorsement later.

The bottleneck is step 2's transfer bridge — confirmed by primary sources: ACMS has no documented export or API, and eAdventist's CSV export was deprecated in Mar 2023, so the Letter of Transfer is the only always-available interop artifact (see `docs/research/sda-platforms-migration.md`). A strategic dependency, not a technical detail.

## Constraints to plan around

- **Monetization is capped by principle, not market.** Subscription is the only revenue — no cut of the money flowing through (ADR-0011). The value ceiling is `organized churches × $3/month` plus migration services, so scale is the only path.
- **The market is the COP divisions.** The divisions using the Combined Offering Plan — ECD, ESD, IAD, NSD, SAD, SID, SPD, SSD, SUD, WAD — map almost exactly onto the fastest-growing regions (Africa, Asia, South America), where offline-first is the wedge.
- **The denomination relationship gates everything after the beachhead.** Endorsement (or tolerance) is the existential dependency — which is why Fiji Mission, a named, bounded first customer, matters more than any feature.
