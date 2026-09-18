import type { Database } from './client'
import { auditLog } from './schema'

export interface AuditContext {
  actorId: number
  reason?: string
  metadata?: unknown
}

// The only write path onto audit_log — insert-only, by design. There
// is deliberately no updateAuditLog/deleteAuditLog export; the DB
// trigger backs this up if that discipline is ever broken.
export async function recordAudit(
  db: Database,
  entityType: string,
  entityId: number,
  action: string,
  ctx: AuditContext,
) {
  await db.insert(auditLog).values({
    actorId: ctx.actorId,
    entityType,
    entityId,
    action,
    reason: ctx.reason ?? null,
    metadata: ctx.metadata === undefined ? null : JSON.stringify(ctx.metadata),
  })
}
