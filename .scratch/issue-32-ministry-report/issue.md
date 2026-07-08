# Issue 32: Ministry Activity Report

## What to build

Quarterly ministry activity report — aggregates small groups, outreach events, community service, Bible studies, and ministry-attributed baptisms.

## Input/Output

**Input:** Ministry data (small groups, outreach events, community service hours, Bible studies, baptisms) aggregated per church per quarter
**Output:** Quarterly Ministry Report with counts and trends, available per church and aggregated upward

## Validation Requirements

- All counts must be non-negative integers
- Data sourced from Ministry, Guest, and Baptism records automatically
- Small group count includes active small groups in the quarter
- Outreach events count distinct events in the quarter
- Community service hours is a sum of all recorded hours
- Bible studies conducted is a count of distinct studies
- Baptisms from ministry is a count of baptisms attributed to ministry activity
- Report must be auto-generated, not manually composed
- Data filtered by user's organizational scope

## Acceptance Criteria

- [ ] Auto-generated from ministry and guest data
- [ ] Tracks: small group attendance, outreach events, community service hours, Bible studies conducted, baptisms from ministry
- [ ] Available per church and aggregated upward
- [ ] Church Clerk can review before Conference sees it

## Blocked by

- Issue 7: Ministry Participation

## Docs

- `docs/agents/contracts/report-api.md`, `docs/agents/schemas/ministry-report.json`, `CHANGELOG.md`
