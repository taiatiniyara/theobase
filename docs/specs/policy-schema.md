# Policy Schema

Policy is versioned data scoped to the unit tree (ADR-0004), shipped as a data feed separate from code (ADR-0013). This doc defines the **schema** the code interprets; the **content** is the denomination's and is not open-sourced.

## Package contents (v1)

- fund chart — see `data-model.md` / `finance-module.md`
- offering calendar (the denomination's Calendar of Offerings — under COP, three parallel calendars: Sabbath School Offering, Weekly Church Offering, ADRA)
- remittance split — tithe 100% upward; offerings per the COP three-tier formula
- reporting schedule
- office → action mapping — see `offices-actions.md`
- effective dates
- unit-tree scoping with inheritance + override (nearest ancestor wins, ADR-0004)

## Versioning & delivery

- Versioned with effective dates; history retained so an audit can establish which policy version a unit operated under in a given period (ADR-0004).
- Delivered as a synced data package (like events). A minimal bootstrap is bundled at provisioning so a fresh device works before its first sync.

## The offering model: Combined Offering Plan

Fiji Mission (SPD — Island Fields) operates under the denomination's **Combined Offering Plan (COP)**: all offerings go into one pool, distributed by a division-voted formula with three tiers — **50–60% local church, 20–30% mission/union/division, 20% GC** (SPD example per $100: $50 local · $20 mission · $10 union/division · $20 GC). Tithe is separate and remitted 100% upward. The ratio is revised periodically — a versioned policy datum.

## Bootstrap seed

The real fund chart, offering calendar, and remittance percentages are division/union-specific and are the denomination's IP — they ship in the policy feed, not the repo (ADR-0013). The repo therefore carries a **placeholder seed**: an illustrative fund chart (Tithe, Sabbath School Offering, Church Budget) with COP-shaped `{local%, upward%}` splits — enough to run the app and its tests, clearly marked as not the real policy. At deployment the mission imports its real COP data through the same feed path; the seed is replaced and never shipped to a real unit.
