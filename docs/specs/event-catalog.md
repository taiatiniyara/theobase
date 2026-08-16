# Event Catalog

The append-only event log (ADR-0007, ADR-0019). Events are the sync unit and the audit trail.

## Common shape

Every event carries: `id`, `unit`, `type`, `occurredAt` (business date), `recordedAt` (capture time), `author` (acting officer), `evidence` refs, and a type-specific payload. Correcting events additionally carry `voids` (the event they reverse).

## Correcting events

**Reverse, never delete.** The voided event stays in the log, flagged voided; projections subtract it (ADR-0007).

## Membership events

- `baptism`, `re-baptism`, `profession-of-faith` — authorizing act: a Church-in-Session vote.
- `transfer-out` — recorded by the sending church, carries the letter of transfer.
- `transfer-in` — recorded by the receiving church, references the `transfer-out`; the member settles on the new roll only after this. Until the letter is accepted, the member stays on the granting church's roll.
- `death` — no authorizing act; the clerk records it.
- `removal` — two paths: resignation (the board records it) or discipline (a Church-in-Session vote).
- `marked-missing` — authorizing act: a church vote, not a board action.
- `appointment` — office + person + unit + authorizing act + effective period.
- `name-change` — evidence photo (legal document), no vote.
- `family-reassignment` — clerical, no vote, no evidence.

## Transfer bridge (ACMS/eAdventist interop)

A transfer is fully two-sided only when both churches are in Theobase. During adoption, churches migrate at different times, so transfers must cross the Theobase↔ACMS boundary. The **Letter of Transfer** is the interoperable artifact:

- `transfer-out` to an ACMS church — the sending church records the transfer-out and produces a Letter of Transfer for the receiving church to enter manually.
- `transfer-in` from an ACMS church — the receiving church records the transfer-in against an imported letter (typed or scanned), the letter as its evidence.

This bridge lets adoption spread church-to-church along the transfer graph; it is a strategic dependency, not a technical detail. A future ACMS/eAdventist API can replace the manual letter, but the letter is the baseline that always works.

## Finance events

- `tithe`, `offering` — the two kinds of money given, per line item; envelope (optional), fund, amount. The fund's type determines which.
- `cash-count confirm` — one per counter, carries that counter's tally + signature.
- `deposit` — 1:N cash counts; amount, date, bank reference, slip photo.
- `disbursement` — amount, payee, fund/budget line, invoice/receipt photo, approval, dual signature.
- `remittance` — computed amount, date, evidence.

## Evidence rule

An authorizing act is required for every state-changing event except death (recorded by the clerk without one). Correcting events need none. Evidence photos are required only for money events (cash count, deposit, disbursement) — ADR-0009.
