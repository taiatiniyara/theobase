# ADR-0013: Demo Seed Data

## Status

Accepted (2026-08-10)

## Context

Theobase must be demonstrable to Conference treasurers before real churches are onboarded. An empty church with "no data yet" fails to sell the platform. A realistic, pre-populated demo shows the proactive intelligence, reports, and counting room in action.

## Decision

A seed script (`pnpm seed:demo`) that provisions a complete demo church:

**Church**: "Suva Central SDA Church" under Fiji Mission.

**Members** (120 synthetic):
- Realistic Fijian names and surnames
- Organised into 40 households (spouses, children, single adults)
- Membership statuses distributed realistically: 85% baptised, 10% profession of faith, 3% transferred in, 2% deceased
- Baptism dates spanning 1950-2025
- Assigned officers: 1 clerk, 1 treasurer, 2 counters, 1 Sabbath School superintendent, 1 Pathfinder director

**Giving records** (6 months, ~2,500 records):
- Weekly tithe per household (log-normal distribution: most give consistently, a few large givers, some irregular)
- Offerings distributed across categories (Sabbath School 40%, Local Church Budget 30%, World Budget 15%, Building Fund 10%, ADRA 5%)
- Seasonal pattern: 15% increase in Q4 (harvest/bonus giving)
- 24 weekly batches, all committed

**2 active batches** (for demo):
- Batch A: open, counter1 confirmed, waiting on counter2 — shows the dual-signoff progress indicator
- Batch B: disputed — counter1 and counter2 totals don't match — shows the side-by-side reconciliation UI

**Demo accounts**:
- `clerk@suva.theobase.app` — church clerk
- `treasurer@suva.theobase.app` — church treasurer
- `counter1@suva.theobase.app` — counter
- `counter2@suva.theobase.app` — counter
- `pastor@suva.theobase.app` — district pastor
- `boardmember@suva.theobase.app` — church board member (read-only)
- `member@suva.theobase.app` — regular member (self-serve view)
- `interest@suva.theobase.app` — Bible study interest (pre-baptism)
- `conference-treasurer@fiji.theobase.app` — Fiji Mission treasurer (reviews remittances)
- `conference-secretary@fiji.theobase.app` — Fiji Mission secretary (reviews annual reports)
- `conference-president@fiji.theobase.app` — Fiji Mission president (top-level dashboard)
- `auditor@fiji.theobase.app` — Conference-appointed auditor (read-only financial, assigned to Suva Central)
- `operator@theobase.app` — platform operator (observability dashboard)

**Conference**: "Fiji Mission" with Suva Central activated as a subscribed church.

### Reset

Re-running `pnpm seed:demo` destroys and recreates the demo DO. No production data is affected.

## Consequences

- The seed script is also the integration test for the DO + Worker + D1 pipeline. If seed works, deployment works.
- Synthetic data generation must produce realistic patterns: a giving spike in December, a few households that stopped giving in month 4, a member transferred out in week 10. These patterns surface in the proactive intelligence dashboard — the demo sells itself.
- Demo accounts must be clearly marked to prevent accidental production use. A "DEMO" badge in the UI header when logged into a demo church.
