# Issue 12: Transfer Request Workflow

## What to build

Full transfer request lifecycle — member requests transfer, source church approves, letter issued, target church receives and confirms.

## Input/Output

**Input:** Person ID, target church ID, reason (optional)
**Output:** TransferRequest record with letter number, approval workflow, status

## Validation Requirements

- Target church must be in same Conference
- Transfer request must be approved by source church
- Letter number must be generated

## Acceptance Criteria

- [ ] Clerk can initiate transfer request
- [ ] Source church clerk receives notification
- [ ] Source church approves/rejects
- [ ] Letter number auto-generated
- [ ] Target church receives notification and confirms
- [ ] Person's church updated on confirmation
- [ ] Audit log entries at both churches

## Blocked by

- Issue 2: View Member List
- Issue 3: Edit Member Details
- Issue 4: Transfer Member (simple transfer must work before approval workflow)

## Docs

- `docs/agents/contracts/transfer-api.md`
- `docs/agents/schemas/transfer-request.json`
- `CHANGELOG.md`
