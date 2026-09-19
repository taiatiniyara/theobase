import { eq } from 'drizzle-orm'
import { findAccountById } from '../auth/accounts'
import { canAccessChurch } from '../auth/scope'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { countLines, counts, reconciliations } from './schema'

export interface CreateCountInput {
  clientRecordId: string
  churchId: number
  enteredByAccountId: number
  coSignerAccountId: number
  sabbathDate: string
  recordedAt: string
  lines: { fundCategoryId: number; amountCents: number }[]
}

// Thrown for a co-signer that fails eligibility — the route layer maps
// this to a 400 with the message as-is, distinct from validation
// errors (missing/malformed fields) that never reach this function.
export class IneligibleCoSignerError extends Error {}

// See CONTEXT.md > UI/UX > Co-signer eligibility: any account at the
// church other than the treasurer who entered the count, or a
// district-scoped Pastor covering that church. Reuses canAccessChurch
// (#9) rather than duplicating its church/district matching — the
// shapes happen to coincide exactly once accountType local-only is
// enforced, since mission_admin/mission_staff/platform_operator can
// never reach here anyway (see the comment below on why that's worth
// checking explicitly rather than assumed).
async function assertEligibleCoSigner(
  db: Database,
  coSignerAccountId: number,
  enteredByAccountId: number,
  churchId: number,
): Promise<void> {
  if (coSignerAccountId === enteredByAccountId) {
    throw new IneligibleCoSignerError('The co-signer cannot be the same person who entered the count')
  }

  const coSigner = await findAccountById(db, coSignerAccountId)
  if (!coSigner) {
    throw new IneligibleCoSignerError('No such co-signer account')
  }
  // The client already verified this account's PIN before ever
  // reaching this call (locally cached, or via /auth/local/verify-pin
  // — see #23); this endpoint takes the resulting accountId on trust
  // for *whether the PIN was right*, the same way the rest of a
  // treasurer's authenticated session is trusted. What it does
  // re-check server-side is *eligibility* — accountType here is
  // defense in depth against a malformed/malicious request supplying
  // an arbitrary id: verify-pin could never itself have returned an
  // institutional account (they have no phone/PIN to check), but
  // nothing stops a client from sending one directly to this endpoint.
  if (coSigner.accountType !== 'local') {
    throw new IneligibleCoSignerError('The co-signer must be a local-church account')
  }
  const eligible = await canAccessChurch(db, coSigner, churchId)
  if (!eligible) {
    throw new IneligibleCoSignerError('This account is not eligible to co-sign at this church')
  }
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

  await assertEligibleCoSigner(db, input.coSignerAccountId, input.enteredByAccountId, input.churchId)

  const [count] = await db
    .insert(counts)
    .values({
      clientRecordId: input.clientRecordId,
      churchId: input.churchId,
      enteredByAccountId: input.enteredByAccountId,
      coSignerAccountId: input.coSignerAccountId,
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
    metadata: {
      sabbathDate: input.sabbathDate,
      lineCount: input.lines.length,
      coSignerAccountId: input.coSignerAccountId,
    },
  })

  // #14: a count isn't just "entered" once dual-signed-off — it starts
  // a reconciliation lifecycle (Submitted -> In Transit -> Received)
  // that the Mission and the originating church both track. Created
  // here, not lazily on first status-changing action, so "does this
  // count have a reconciliation record yet" is never a question a
  // caller has to handle.
  await db.insert(reconciliations).values({ countId: count.id })

  return count
}

export function listLinesForCount(db: Database, countId: number) {
  return db.select().from(countLines).where(eq(countLines.countId, countId))
}
