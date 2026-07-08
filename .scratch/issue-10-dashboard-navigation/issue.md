# Issue 10: Dashboard and Navigation

## What to build

Build the main dashboard (home page) and navigation structure. Dashboard shows pending reports, recent members, and quick actions. Navigation provides access to all major sections (Members, Reports, Finances, Ministries).

**End-to-end behavior:**

1. User logs in and lands on dashboard
2. Dashboard displays:
   - Pending reports (overdue or due soon)
   - Recent members (last 5 added)
   - Quick actions (Add Member, Submit Report, etc.)
3. Navigation menu provides access to:
   - Home (dashboard)
   - Members
   - Reports
   - Finances (if Treasurer)
   - Ministries
   - Settings (profile menu)
4. Navigation is role-based (some items hidden based on role)
5. Breadcrumbs show current location in hierarchy
6. Mobile navigation uses bottom nav (thumb zone)

## Input/Output

**Input:**

- User session (role, organizational scope)
- Current route

**Output:**

- Dashboard with pending reports, recent members, quick actions
- Navigation menu with role-based visibility
- Breadcrumbs showing current location
- Mobile bottom navigation

## Validation Requirements

- Dashboard must show data relevant to user's organizational scope
- Navigation must be role-based (hide features not available to user)
- Breadcrumbs must accurately reflect current location
- Mobile navigation must be thumb-friendly (bottom nav)
- Quick actions must be contextually relevant

## Acceptance Criteria

- [ ] Dashboard displays after login
- [ ] Dashboard shows pending reports (overdue or due soon)
- [ ] Dashboard shows recent members (last 5 added)
- [ ] Dashboard shows quick actions (Add Member, Submit Report, etc.)
- [ ] Navigation menu provides access to all major sections
- [ ] Navigation is role-based (some items hidden based on role)
- [ ] Breadcrumbs show current location in hierarchy
- [ ] Mobile navigation uses bottom nav (thumb zone)
- [ ] Desktop navigation uses sidebar
- [ ] Quick actions are contextually relevant to user's role
- [ ] Loading state displays while fetching dashboard data
- [ ] Error state displays if dashboard data fails to load
- [ ] Navigation works on mobile and desktop
- [ ] Breadcrumbs are clickable (navigate to parent levels)

## Blocked by

- Issue 2: View Member List
- Issue 5: Quarterly Membership Report

## Docs

- `docs/agents/contracts/navigation-api.md` — Navigation API contract (if needed)
- `CHANGELOG.md` — entry for dashboard and navigation feature
