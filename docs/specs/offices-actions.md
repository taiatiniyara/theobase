# Offices & Actions

The fixed office vocabulary and action vocabulary, and how the two relate (ADR-0014). Offices are level-scoped policy data; actions are a code-level enum that policy maps to offices.

## Offices

Church level: **Church Clerk, Church Treasurer, Counter, Church Board, Church in Session, Pastor/Elder, First Elder, Deacon, Deaconess**.

Conference level: **Conference Secretary, Conference Treasurer, Conference President, Auditor**.

Notes:

- An office is scoped to the unit kind where it is held — a Church Treasurer and a Conference Treasurer are different offices (ADR-0014).
- Church Board and Church in Session are bodies, not persons — they authorize via recorded votes, not appointments.
- Counter is Theobase's counting-room office — stricter than policy (the Church Manual names the treasurer plus another officer); a cash count requires two unrelated counters (dual signature). See ADR-0009.
- Auditor is read-only access to the churches they are assigned to audit.

## Actions

The action vocabulary is a **code-level enum** (a stable interface). Policy maps offices to actions; the mapping is data, the enum is code. Enum changes are rare releases.

Initial action set (v1):

- Membership: `record-baptism`, `record-re-baptism`, `record-profession-of-faith`, `record-transfer-out`, `record-transfer-in`, `record-death`, `record-removal`, `mark-missing`, `record-name-change`, `record-family-reassignment`, `record-appointment`, `record-correcting-event`
- Finance: `record-tithe`, `record-offering`, `confirm-cash-count`, `record-deposit`, `record-disbursement`, `record-remittance`, `record-correcting-event`
- Reporting: `approve-statistical-report`, `approve-tithe-offerings-report`

## Office → action mapping

Policy data (ADR-0014), versioned and tree-scoped (ADR-0004). For v1 we seed a default Fiji-Mission mapping so the system works before the real denomination policy feed arrives; the feed replaces it (ADR-0013).

Default seed mapping:

- **Church Clerk** — all membership actions, `approve-statistical-report`.
- **Church Treasurer** — all finance actions, `approve-tithe-offerings-report`.
- **Counter** — `confirm-cash-count` only.
- **Church in Session** — `record-baptism`, `record-re-baptism`, `record-profession-of-faith`, `record-transfer-out`, `record-transfer-in`, `record-removal` (discipline), `mark-missing` (the session vote is the authorizing act).
- **Church Board** — `record-removal` (resignation), and approving disbursements (the board vote is the authorizing act).
- **Conference Secretary** — `approve-statistical-report` (review).
- **Conference Treasurer** — `approve-tithe-offerings-report` (review).
- **Auditor** — read-only (no write actions).

## Authorizing acts

Not part of the mapping. An authorizing act rides on the event as evidence (ADR-0014); it does not grant the office.
