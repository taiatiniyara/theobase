# Issue 5: Quarterly Membership Report

## What to build

System automatically generates quarterly membership reports from Person data. Church Clerk can view the report for their church, showing membership statistics (beginning count, baptisms, transfers in/out, deaths, removals, ending count).

**End-to-end behavior:**

1. Church Clerk navigates to "Reports" page
2. System displays list of available reports (Membership, Financial, Sabbath School, Ministry)
3. Clerk clicks "Membership Report"
4. System displays quarterly membership report for current quarter
5. Report shows: beginning count, baptisms, transfers in, transfers out, deaths, removals, ending count
6. Report is auto-generated from Person data (no manual entry required)
7. Clerk can select different quarters to view historical reports
8. Report is read-only (data is derived from Person records)

## Input/Output

**Input:**

- Church ID: UUID (from user's session)
- Quarter: string (e.g., "2024-Q1", "2024-Q2")

**Output:**

- Membership report with statistics:
  - Beginning count (members at start of quarter)
  - Baptisms (new members baptized during quarter)
  - Transfers in (members transferred in during quarter)
  - Transfers out (members transferred out during quarter)
  - Deaths (members who died during quarter)
  - Removals (members removed during quarter)
  - Ending count (members at end of quarter)

## Validation Requirements

- Quarter must be valid format (YYYY-QN)
- User must have access to the church (row-level security)
- Report must be auto-generated from Person data (no manual entry)
- Statistics must be calculated correctly:
  - Beginning count = members at start of quarter
  - Ending count = beginning + baptisms + transfers in - transfers out - deaths - removals

## Acceptance Criteria

- [ ] Reports page displays list of available report types
- [ ] "Membership Report" is one of the available reports
- [ ] Clicking "Membership Report" displays quarterly report
- [ ] Report shows current quarter by default
- [ ] Report displays all required statistics (beginning count, baptisms, transfers in/out, deaths, removals, ending count)
- [ ] Report is auto-generated from Person data (no manual entry)
- [ ] Statistics are calculated correctly
- [ ] Clerk can select different quarters to view historical reports
- [ ] Report is read-only (cannot edit statistics)
- [ ] Data is filtered by user's church (cannot see other churches' reports)
- [ ] Loading state displays while generating report
- [ ] Error state displays if report generation fails

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/report-api.md` — Report API contract
- `docs/agents/schemas/membership-report.json` — Membership Report data model schema
- `CHANGELOG.md` — entry for membership report feature
