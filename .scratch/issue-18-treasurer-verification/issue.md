# Issue 18: Treasurer Verification and Weekly Summary

## What to build

Treasurer counts physical envelopes, verifies against member self-reports, flags discrepancies, produces weekly financial summary with COP distribution.

## Input/Output

**Input:** EnvelopeCount (envelope identifier, counted amounts JSON), AnonymousOffering (amount JSON, source type), weekly period, deposit slip upload
**Output:** Matched/verified MemberGiving records, flagged discrepancies, WeeklyFinancialSummary with COP distribution breakdown, deposit slip stored in R2

## Validation Requirements

- EnvelopeCount must match a MemberGiving record by envelope identifier
- Amounts are positive numbers
- Discrepancy threshold: any difference between self-report and count is flagged
- AnonymousOffering source must be "unnamed_envelope" or "loose_cash"
- WeeklyFinancialSummary totalling: verified + anonymous = total
- Deposit slip must be a valid image or PDF
- Only treasurer role can verify and finalize summaries
- Data filtered by user's church

## Acceptance Criteria

- [ ] Treasurer creates EnvelopeCount for each envelope (identified or anonymous)
- [ ] System matches EnvelopeCount to MemberGiving record
- [ ] Discrepancies flagged (self-report vs physical count differs)
- [ ] AnonymousOfferings recorded (unnamed envelopes, loose cash)
- [ ] WeeklyFinancialSummary auto-calculated with COP distribution (per-division formula: local 50-60%, GC world mission 20%, remainder to Conference/Union/Division)
- [ ] COP formula configurable per Division by GC Admin
- [ ] Conference can view aggregated offering distribution from all churches
- [ ] Treasurer uploads deposit slip (R2)
- [ ] Treasurer marks summary as verified

## Blocked by

- Issue 17: Photo-Based Giving

## Docs: `docs/agents/contracts/financial-api.md`, `docs/agents/schemas/envelope-count.json`, `weekly-summary.json`
