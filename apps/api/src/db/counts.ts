import { eq } from 'drizzle-orm'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { countLines, counts } from './schema'

export interface CreateCountInput {
  clientRecordId: string
  churchId: number
  enteredByAccountId: number
  sabbathDate: string
  recordedAt: string
  lines: { fundCategoryId: number; amountCents: number }[]
}

// Idempotent by clientRecordId — a retried sync (client never saw the
// first response, doesn't know if it landed) returns the existing
// record rather than erroring or creating a duplicate financial
// record. See the comment on `counts` in schema.ts.
//
// Not fully atomic: the count row and its lines are two separate D1
// round-trips (D1's batch() can't thread a just-inserted id from one
// statement into the next within the same batch), so a crash between
// them could in principle leave a lineless count. Accepted risk for
// MVP — this runs within a single Worker invocation, so the window is
// tiny, and it's not defended against with extra repair logic here.
export async function createCount(db: Database, input: CreateCountInput, ctx: AuditContext) {
  const existing = await db.query.counts.findFirst({
    where: eq(counts.clientRecordId, input.clientRecordId),
  })
  if (existing) return existing

  const [count] = await db
    .insert(counts)
    .values({
      clientRecordId: input.clientRecordId,
      churchId: input.churchId,
      enteredByAccountId: input.enteredByAccountId,
      sabbathDate: input.sabbathDate,
      recordedAt: input.recordedAt,
    })
    .returning()

  if (input.lines.length > 0) {
    await db.insert(countLines).values(
      input.lines.map((line) => ({
        countId: count.id,
        fundCategoryId: line.fundCategoryId,
        amountCents: line.amountCents,
      })),
    )
  }

  await recordAudit(db, 'count', count.id, 'create', {
    ...ctx,
    metadata: { sabbathDate: input.sabbathDate, lineCount: input.lines.length },
  })

  return count
}

export function listLinesForCount(db: Database, countId: number) {
  return db.select().from(countLines).where(eq(countLines.countId, countId))
}
