# Issue 2: View Member List

## What to build

Church Clerk can view a paginated list of all members in their church, with search functionality to find members by name or email.

**End-to-end behavior:**

1. Church Clerk navigates to "Members" page
2. System displays paginated table of members (name, email, phone, baptism date)
3. Clerk can search by name or email
4. Search results update in real-time
5. Clerk can click a member to view details (future: edit page)
6. Pagination controls allow navigation through large lists

## Input/Output

**Input:**

- Search query (optional): string
- Page number: integer
- Page size: integer (default 20)

**Output:**

- Paginated list of Person records
- Total count for pagination
- Search results filtered by query

## Validation Requirements

- Search query must be at least 2 characters
- Page number must be positive integer
- Page size must be between 1 and 100
- Results must be filtered by user's church (row-level security)
- Search must match against name (given_name + family_name) and email

## Acceptance Criteria

- [ ] Members page displays table with name, email, phone, baptism date columns
- [ ] Table is paginated (20 items per page by default)
- [ ] Pagination controls show current page and total pages
- [ ] Search box filters results by name or email
- [ ] Search updates results in real-time (debounced)
- [ ] Empty search returns all members
- [ ] No results shows "No members found" message
- [ ] Clicking a member row navigates to member detail (future: edit page)
- [ ] Data is filtered by user's church (cannot see other churches' members)
- [ ] Loading state displays while fetching data
- [ ] Error state displays if API call fails

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/person-api.md` — update with GET /api/persons endpoint
- `CHANGELOG.md` — entry for member list feature
