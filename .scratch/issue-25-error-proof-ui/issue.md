# Issue 25: Error-Proof UI Patterns

## What to build

Cross-cutting UI patterns that prevent errors through design. Duplicate detection, inline validation, undo instead of confirm, friendly error messages.

## Input/Output

**Input:** All user interactions (form submissions, deletions, edits, transfers), duplicate detection candidates
**Output:** Guaranteed: no technical error messages visible to users, duplicate detection prompts, inline validation before submit, undo patterns, destructive action confirmations

## Validation Requirements

- Duplicate detection: match on name + phone OR name + email; prompt with merge option, never reject silently
- Inline validation fires on blur (field exit), not on submit; invalid fields show friendly message immediately
- All error messages use user language ("Baptism date should be in the past"), never technical terms or codes
- Undo actions provide 5-second window with clear "Undo" button; undo reverses all side effects
- Destructive actions (remove, transfer, disfellowship) require explicit second-step confirmation stating consequences
- Any server error that reaches the UI shows: "Something went wrong. Tap to retry." with retry action
- Smart defaults verified per field: baptism date (empty), report period (current quarter), transfer source (current church)
- No stack trace, error code, or technical term ever rendered in UI

## Acceptance Criteria

- [ ] Duplicate detection: same name + phone/email → "Is this the same person? Merge or keep separate?"
- [ ] Duplicate detection: same email → "This email is already in use by John Smith"
- [ ] Inline validation as user types (not on submit)
- [ ] Friendly messages: "Baptism date should be in the past" not "Invalid date format"
- [ ] Undo pattern: "John removed. Undo?" (5-second window)
- [ ] Destructive actions require deliberate second step confirmation
- [ ] No stack traces, error codes, or technical jargon ever shown
- [ ] No blank screens on error — always show "Something went wrong. Tap to retry."
- [ ] Smart defaults: baptism date empty, reports default to current quarter

## Blocked by

- Issue 1: Add First Member

## Docs

- `docs/adr/0011-error-proof-design.md`
- `CHANGELOG.md`
