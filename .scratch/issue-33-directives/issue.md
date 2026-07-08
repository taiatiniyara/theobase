# Issue 33: Directives Management

## What to build

Top-down directives from higher organizational units — Conference issuing policy to churches, Union issuing goals to Conferences.

## Input/Output

**Input:** Directive type, title, body, effective date, issuing unit ID, target scope (specific churches or all subordinates)
**Output:** Directive record with status (draft/issued/acknowledged/implemented), recipient acknowledgment tracking

## Validation Requirements

- Issuing unit must be higher in hierarchy than target units
- Title and body are required
- Effective date must be valid
- Target scope must include at least one valid subordinate unit
- Status must follow progression: draft → issued → acknowledged → implemented
- Only authorized roles can issue directives (Conference Admin and above)
- Data filtered by user's organizational scope

## Acceptance Criteria

- [ ] Higher unit creates directive (type, title, body, effective date, scope)
- [ ] Directive targets subordinate units (specific churches, all conferences, etc.)
- [ ] Recipients acknowledge receipt
- [ ] Status tracked: draft, issued, acknowledged, implemented
- [ ] Directives visible to recipients' dashboards

## Blocked by

- Issue 1: Add First Member
- Issue 9: User Roles and Permissions

## Docs

- `docs/agents/contracts/directive-api.md`, `docs/agents/schemas/directive.json`, `CHANGELOG.md`
