import { eq } from 'drizzle-orm'
import type { Account } from '../auth/middleware'
import { canAccessChurch } from '../auth/scope'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { countLines, counts, reconciliationLines, reconciliations } from './schema'

export class ReconciliationNotFoundError extends Error {}
// Org-scope failure — the account has no standing to act on this
// specific record's church (wrong church, wrong district, wrong
// mission). Mirrors requireRole's 403, not the 400s below, since this
// is about *who* the actor is rather than what they sent.
export class ReconciliationAccessError extends Error {}
// The record isn't in the right lifecycle state for the attempted
// action (already sent, not yet received, no discrepancy to resolve,
// already resolved, confirming your own proposal, ...).
export class ReconciliationStateError extends Error {}
// The received-amounts body doesn't itemize exactly the same fund
// categories the original count did.
export class ReconciliationLineMismatchError extends Error {}

async function loadReconciliationWithCount(db: Database, reconciliationId: number) {
  const reconciliation = await db.query.reconciliations.findFirst({
    where: eq(reconciliations.id, reconciliationId),
  })
  if (!reconciliation) {
    throw new ReconciliationNotFoundError('No such reconciliation')
  }
  // FK-guaranteed to exist — reconciliations.countId is NOT NULL with a
  // real reference, and counts are never deleted.
  const count = await db.query.counts.findFirst({ where: eq(counts.id, reconciliation.countId) })
  return { reconciliation, count: count! }
}

// accountType is checked explicitly, not left to canAccessChurch alone
// or to the route layer's requireRole — canAccessChurch's job is org
// *scope* (right church/district/mission), not local-vs-institutional,
// and a route's requireRole guard is one thing that could be missed by
// a future caller. Same defense-in-depth reasoning as db/counts.ts's
// co-signer accountType check: "local church" actions (mark-sent) and
// "Mission staff" actions (receive, propose/confirm resolution) should
// never succeed for the wrong kind of account even if something
// upstream forgets to gate on role.
async function assertChurchAccess(
  db: Database,
  actor: Account,
  churchId: number,
  expectedAccountType: 'local' | 'institutional',
): Promise<void> {
  if (actor.accountType !== expectedAccountType) {
    throw new ReconciliationAccessError("This account cannot act on this church's records")
  }
  const eligible = await canAccessChurch(db, actor, churchId)
  if (!eligible) {
    throw new ReconciliationAccessError("This account cannot act on this church's records")
  }
}

export function getReconciliationByCountId(db: Database, countId: number) {
  return db.query.reconciliations.findFirst({ where: eq(reconciliations.countId, countId) })
}

export function listLinesForReconciliation(db: Database, reconciliationId: number) {
  return db
    .select()
    .from(reconciliationLines)
    .where(eq(reconciliationLines.reconciliationId, reconciliationId))
}

// Submitted -> In Transit. Callers are role-gated to treasurer/clerk/
// pastor at the route layer (requireRole) — canAccessChurch here is
// the org-scope check on top of that (same church for Treasurer/Clerk,
// same district for a Pastor), the same split used throughout #9/#12.
export async function markSent(
  db: Database,
  reconciliationId: number,
  actor: Account,
  courierName: string | null,
  ctx: AuditContext,
) {
  const { reconciliation, count } = await loadReconciliationWithCount(db, reconciliationId)
  await assertChurchAccess(db, actor, count.churchId, 'local')

  if (reconciliation.status !== 'submitted') {
    throw new ReconciliationStateError(`Cannot mark as sent from status '${reconciliation.status}'`)
  }

  const [updated] = await db
    .update(reconciliations)
    .set({
      status: 'in_transit',
      courierName,
      sentAt: new Date().toISOString(),
      sentByAccountId: actor.id,
    })
    .where(eq(reconciliations.id, reconciliationId))
    .returning()

  await recordAudit(db, 'reconciliation', reconciliationId, 'mark_sent', {
    ...ctx,
    metadata: { countId: count.id, courierName },
  })

  return updated
}

// In Transit -> Received. Callers are role-gated to mission_admin/
// mission_staff at the route layer; canAccessChurch checks the Mission
// scope matches this record's church.
//
// The per-category comparison (not just a total) is the whole point of
// this ticket's acceptance criterion — a mismatch is detected
// automatically, never a manual judgment call, and a match in one
// category can't hide a shortfall in another.
export async function markReceived(
  db: Database,
  reconciliationId: number,
  actor: Account,
  lines: { fundCategoryId: number; amountCents: number }[],
  ctx: AuditContext,
) {
  const { reconciliation, count } = await loadReconciliationWithCount(db, reconciliationId)
  await assertChurchAccess(db, actor, count.churchId, 'institutional')

  if (reconciliation.status !== 'in_transit') {
    throw new ReconciliationStateError(`Cannot mark as received from status '${reconciliation.status}'`)
  }

  const submittedLines = await db.select().from(countLines).where(eq(countLines.countId, count.id))
  const submittedByCategory = new Map(submittedLines.map((l) => [l.fundCategoryId, l.amountCents]))
  const receivedByCategory = new Map(lines.map((l) => [l.fundCategoryId, l.amountCents]))

  const sameCategories =
    submittedByCategory.size === receivedByCategory.size &&
    [...submittedByCategory.keys()].every((id) => receivedByCategory.has(id))
  if (!sameCategories) {
    throw new ReconciliationLineMismatchError(
      'Received amounts must be itemized for exactly the same fund categories as the original submission',
    )
  }

  let hasDiscrepancy = false
  for (const [fundCategoryId, submittedAmountCents] of submittedByCategory) {
    if (receivedByCategory.get(fundCategoryId) !== submittedAmountCents) {
      hasDiscrepancy = true
      break
    }
  }

  await db.insert(reconciliationLines).values(
    lines.map((line) => ({
      reconciliationId,
      fundCategoryId: line.fundCategoryId,
      receivedAmountCents: line.amountCents,
    })),
  )

  const [updated] = await db
    .update(reconciliations)
    .set({
      status: 'received',
      receivedAt: new Date().toISOString(),
      receivedByAccountId: actor.id,
      hasDiscrepancy,
    })
    .where(eq(reconciliations.id, reconciliationId))
    .returning()

  await recordAudit(db, 'reconciliation', reconciliationId, 'receive', {
    ...ctx,
    metadata: {
      countId: count.id,
      hasDiscrepancy,
      lines: lines.map((line) => ({
        fundCategoryId: line.fundCategoryId,
        submittedAmountCents: submittedByCategory.get(line.fundCategoryId),
        receivedAmountCents: line.amountCents,
      })),
    },
  })

  return updated
}

// First half of dual-control discrepancy resolution — see CONTEXT.md >
// UI/UX > Mission-level staff/CFO role > Dual control. A required
// reason, same pattern as the Pastor account-removal rejection flow.
export async function proposeDiscrepancyResolution(
  db: Database,
  reconciliationId: number,
  actor: Account,
  reason: string,
  ctx: AuditContext,
) {
  const { reconciliation, count } = await loadReconciliationWithCount(db, reconciliationId)
  await assertChurchAccess(db, actor, count.churchId, 'institutional')

  if (!reconciliation.hasDiscrepancy) {
    throw new ReconciliationStateError('This reconciliation has no discrepancy to resolve')
  }
  if (reconciliation.discrepancyProposedByAccountId !== null) {
    throw new ReconciliationStateError('A resolution has already been proposed for this discrepancy')
  }

  const [updated] = await db
    .update(reconciliations)
    .set({
      discrepancyProposedByAccountId: actor.id,
      discrepancyProposedReason: reason,
      discrepancyProposedAt: new Date().toISOString(),
    })
    .where(eq(reconciliations.id, reconciliationId))
    .returning()

  await recordAudit(db, 'reconciliation', reconciliationId, 'propose_resolution', {
    ...ctx,
    reason,
    metadata: { countId: count.id },
  })

  return updated
}

// Second half of dual-control discrepancy resolution: a *different*
// Mission staffer confirms before the discrepancy actually clears from
// the exceptions tab. The reconciliations_resolution_confirmer_differs_
// from_proposer CHECK constraint is the real guarantee of "different
// person" — this check exists only to fail with a clear application
// error instead of a raw constraint violation.
export async function confirmDiscrepancyResolution(
  db: Database,
  reconciliationId: number,
  actor: Account,
  ctx: AuditContext,
) {
  const { reconciliation, count } = await loadReconciliationWithCount(db, reconciliationId)
  await assertChurchAccess(db, actor, count.churchId, 'institutional')

  if (reconciliation.discrepancyProposedByAccountId === null) {
    throw new ReconciliationStateError('No resolution has been proposed yet for this discrepancy')
  }
  if (reconciliation.discrepancyResolvedAt !== null) {
    throw new ReconciliationStateError('This discrepancy has already been resolved')
  }
  if (actor.id === reconciliation.discrepancyProposedByAccountId) {
    throw new ReconciliationStateError(
      'The resolution must be confirmed by a different Mission staff account than the one who proposed it',
    )
  }

  const [updated] = await db
    .update(reconciliations)
    .set({
      discrepancyConfirmedByAccountId: actor.id,
      discrepancyResolvedAt: new Date().toISOString(),
    })
    .where(eq(reconciliations.id, reconciliationId))
    .returning()

  await recordAudit(db, 'reconciliation', reconciliationId, 'confirm_resolution', {
    ...ctx,
    metadata: { countId: count.id, proposedByAccountId: reconciliation.discrepancyProposedByAccountId },
  })

  return updated
}
