import { desc, eq, sql } from 'drizzle-orm'
import type { Database } from './client'
import { countLines, counts, reconciliations } from './schema'

// All of a church's records, most recent Sabbath first — not filtered
// to "entered by me" (see CONTEXT.md > UI/UX > Local-church-side
// reconciliation view placement: a Treasurer plausibly cares about all
// their church's activity, so narrowing to "entered by me" would be a
// false restriction). Shared by the Treasurer's history tab (#17) and
// Clerk's landing oversight view (#18) — same settled design: one
// component, not two separate builds.
export function listChurchRecords(db: Database, churchId: number) {
  return db
    .select({
      countId: counts.id,
      reconciliationId: reconciliations.id,
      sabbathDate: counts.sabbathDate,
      totalAmountCents: sql<number>`coalesce(sum(${countLines.amountCents}), 0)`,
      status: reconciliations.status,
      hasDiscrepancy: reconciliations.hasDiscrepancy,
      discrepancyResolvedAt: reconciliations.discrepancyResolvedAt,
    })
    .from(counts)
    .innerJoin(reconciliations, eq(reconciliations.countId, counts.id))
    .leftJoin(countLines, eq(countLines.countId, counts.id))
    .where(eq(counts.churchId, churchId))
    .groupBy(counts.id, reconciliations.id)
    .orderBy(desc(counts.sabbathDate))
}
