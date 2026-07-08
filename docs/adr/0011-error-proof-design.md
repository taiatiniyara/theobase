# ADR 0011: Error-Proof Design Principles

## Status

Accepted

## Context

Grassroots users (church clerks, volunteers, ages 30-70, mixed technical ability) should never encounter error messages, stack traces, or technical jargon. The system must prevent errors through design rather than reporting them after the fact.

## Decision

### Anti-Error Patterns (what users should NEVER see)

- Stack traces, error codes, "500 Internal Server Error"
- Technical terms: "idempotency," "foreign key constraint," "409 Conflict"
- Blank screens with no explanation
- "Invalid input" or "Duplicate key error" without context
- Spinners with no progress indication on slow networks

### Error Prevention Rules

**Duplicates:**

- Auto-detect: same name + same phone/email/baptism-date
- Friendly prompt: "John Smith already exists in your church. Is this the same person?"
- One-tap merge or cancel

**Inline validation:**

- Validate as user types, not on submit
- Friendly messages: "Baptism date should be in the past" not "Invalid date format"
- Never show raw validation errors

**Destructive actions:**

- Confirmation with deliberate second step
- "Are you sure you want to remove John Smith? This cannot be undone."

**Smart defaults:**

- Baptism date: empty (not today, not 1900-01-01)
- Transfer: keep current church as default
- Reports: current quarter as default

**Offline safety:**

- Queue actions locally when network drops
- Show "Saved (will sync when connected)" not "Network error"
- Background sync with TanStack Query

### Membership Integrity Guarantees

**Formula correctness:**

- Reports auto-generate from raw data, not manual formulas
- Beginning + baptisms + transfers-in - transfers-out - deaths - removals = ending
- Never correct a formula — the data IS the report

**Transfer integrity:**

- Single action, atomic change of church_id
- Member disappears from source church, appears at target church
- No double-counting possible

**Report deadlines:**

- Data is live — no "submit" workflow needed
- Conference can see current state anytime
- No forgotten deadlines, no reminder emails needed

## Consequences

### Positive

- Grassroots users can't make common mistakes
- Data integrity guaranteed by design, not by user diligence
- No technical error messages ever shown to users
- Offline-safe design works on unreliable connections
- Adoption easier when system feels bulletproof

### Negative

- More upfront design work for each form
- Offline queue adds complexity to sync logic
- Smart defaults require domain knowledge per field
