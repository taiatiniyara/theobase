# 007 — Volunteer Treasury Interface + Audit Binder

**Status: Implemented** (API endpoints + page exist; acceptance criteria need review)

## What to build

A simplified ledger dashboard showing weekly fund balances by department with automatic fund splits. The audit binder explicitly links every expense entry to its receipt image and the board decision that authorized it. Designed for a volunteer treasurer — no general ledger, no double-entry accounting.

## Acceptance criteria

- [ ] Drizzle schema: `expense` (amount, description, category, receipt_id, board_decision_id, congregation_id), `fund_balance` (department, amount, congregation_id, updated_at)
- [ ] Hono endpoint `GET /treasury/balance` — returns current fund balances by department
- [ ] Hono endpoint `POST /treasury/expenses` — creates expense linked to receipt and board decision
- [ ] Hono endpoint `GET /treasury/expenses` — paginated list with receipt image and board decision links
- [ ] Auto-update: when a receipt is verified (from Slice 004), fund balances update automatically per the fund split
- [ ] Audit view: single page showing expense → receipt image → board decision → bank statement reference
- [ ] Export: generate PDF/CSV of expenses for a date range
- [ ] Test: verify receipt → fund balances update → create expense linked to that receipt and a board decision → audit view shows complete chain
- [ ] Test: treasurer sees only their congregation's finances

## Blocked by

- 004 — Digital Receipt Registry
- 005 — Boardroom Management Ledger
