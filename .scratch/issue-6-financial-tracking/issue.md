# Issue 6: Financial Tracking

## What to build

Church Treasurer can record financial transactions (tithes, offerings, special offerings) and view financial reports. Financial data flows upward through the hierarchy for aggregation.

**End-to-end behavior:**

1. Church Treasurer logs in
2. Navigates to "Finances" page
3. Enters financial record: date, type (tithe/offering/special), amount, category
4. System validates and saves FinancialRecord
5. Treasurer can view list of financial records
6. Treasurer can view financial report (monthly/quarterly)
7. Report shows totals by category
8. Financial data is aggregated at Conference level

## Input/Output

**Input:**

- Financial record: date, type (tithe/offering/special), amount, category, notes (optional)
- Report query: church_id, date range, category filter

**Output:**

- FinancialRecord saved to database
- Financial report with totals by category
- Aggregated data at Conference level

## Validation Requirements

- Date must be valid date format
- Amount must be positive number
- Type must be one of: tithe, offering, special
- Category must be valid for the type
- User must have Treasurer role for the church
- Financial data must be filtered by user's church (row-level security)

## Acceptance Criteria

- [ ] Treasurer can access "Finances" page
- [ ] Treasurer can enter financial record (date, type, amount, category)
- [ ] Form validates required fields
- [ ] Form validates amount is positive number
- [ ] Financial record is saved to database
- [ ] Treasurer can view list of financial records
- [ ] Treasurer can view financial report (monthly/quarterly)
- [ ] Report shows totals by category
- [ ] Financial data is filtered by user's church
- [ ] Conference Admin can see aggregated financial data from all churches
- [ ] Loading state displays while fetching data
- [ ] Error state displays if API call fails

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/financial-api.md` — Financial API contract
- `docs/agents/schemas/financial-record.json` — FinancialRecord data model schema
- `docs/agents/schemas/financial-report.json` — Financial Report data model schema
- `CHANGELOG.md` — entry for financial tracking feature
