# Issue 9: User Roles and Permissions

## What to build

Implement role-based access control (RBAC) with role-based UI visibility. Users see different features and data based on their role (Church Clerk, Treasurer, Conference Admin, Pastor, Member).

**End-to-end behavior:**

1. System User is assigned a role (Church Clerk, Treasurer, Conference Admin, Pastor, Member)
2. UI displays only features available to that role
3. API endpoints enforce role-based permissions
4. Church Clerk can manage members and submit reports
5. Treasurer can manage finances
6. Conference Admin can view all churches in conference
7. Pastor can view their church's data
8. Member can view only their own record

## Input/Output

**Input:**

- User role assignment: user_id, role, church_id (or organizational unit)
- API request with user session

**Output:**

- Role-based UI visibility
- Role-based API access control
- Permission denied errors for unauthorized actions

## Validation Requirements

- Role must be valid (Church Clerk, Treasurer, Conference Admin, Pastor, Member)
- User must be assigned to a church or organizational unit
- Role-based permissions must be enforced at API level
- Role-based UI must hide features not available to user
- User cannot escalate their own permissions

## Acceptance Criteria

- [ ] System User can be assigned a role
- [ ] Role is stored in database
- [ ] UI displays only features available to user's role
- [ ] Church Clerk can access member management features
- [ ] Treasurer can access financial features
- [ ] Conference Admin can access conference-level data
- [ ] Pastor can access their church's data
- [ ] Member can access only their own record
- [ ] API endpoints enforce role-based permissions
- [ ] Unauthorized actions return 403 Forbidden
- [ ] User cannot escalate their own permissions
- [ ] Role changes take effect immediately
- [ ] Loading state displays while checking permissions
- [ ] Error state displays if permission check fails

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/agents/contracts/auth-api.md` — update with role-based endpoints
- `docs/agents/schemas/role.json` — Role data model schema
- `docs/adr/0004-rbac-row-level-security.md` — RBAC implementation ADR
- `CHANGELOG.md` — entry for role-based access control feature
