# Finance Module

The first module (ADR-0006): counting room and giving, with dual-signoff and auto-generated reports.

## Fund chart & remittance

- Flat fund chart; each fund: name, type ∈ {tithe, offering}, and a remittance split. **Tithe is 100% upward** (to the mission); offerings split `{local%, upward%}` under the COP formula.
- The church's "upward" goes to the mission; how the mission then shares it up (union/division/GC) is the COP three-tier split, recorded in the policy feed (`policy-schema.md`), not the church's own ledger.
- The split is policy data; the remittance amount is computed, never hand-edited (ADR-0003).

## Counting-room state machine

`open → first-confirmed → committed → deposited`, with a `disputed` branch off `first-confirmed` that re-enters `committed` after a joint reconcile.

- **open** — counter 1 counting (device-local, not a log event).
- **first-confirmed** — counter 1's `cash-count confirm` event.
- The second counter counts independently; the system compares tallies.
  - match → **committed**.
  - mismatch → **disputed** → co-signed reconcile → **committed**.
- **deposited** — the treasurer records the deposit (1:N cash counts).

## Events

See `event-catalog.md`: `tithe` / `offering` (per line item), `cash-count confirm` (one per counter), `deposit`, `disbursement`, `remittance`.

## Counting-room UX

- Amounts via the numeric keypad (`inputmode="numeric"`), screen-reader-announced, never silently reformatted; the running total stays visible for self-checking.
- Commit is a distinct, explicit confirm with the total in words and numbers (WCAG 3.3.4 — financial data must be reversible / checked / confirmed).
- A mismatch dispute corrects only the diverging line item, never clears the whole sheet.
- Pass-the-phone states whose turn it is in plain words — "now [name] signs" — never an icon or color alone.

## Disbursement

amount, payee, fund/budget line, invoice/receipt photo (evidence), approval (authorizing act), dual signature (distinct + unrelated, ADR-0014).

## Reports

The Tithe & Offerings report and the statistical report are projections (ADR-0007) requiring only human approval. The cash count sheet is a projection; the two signatures live on the confirm events.
