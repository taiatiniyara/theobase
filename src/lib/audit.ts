import type { AuditEntityType, AuditAction } from '../types';

/**
 * Write an immutable audit log entry.
 */
export async function writeAuditLog(
  db: D1Database,
  data: {
    tenantId: string;
    entityType: AuditEntityType;
    entityId: string;
    action: AuditAction;
    userId: string;
    beforeValues?: object | null;
    afterValues?: object | null;
  }
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO audit_log (id, tenant_id, entity_type, entity_id, action, user_id, before_values, after_values, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      data.tenantId,
      data.entityType,
      data.entityId,
      data.action,
      data.userId,
      data.beforeValues ? JSON.stringify(data.beforeValues) : null,
      data.afterValues ? JSON.stringify(data.afterValues) : null,
      now
    )
    .run();
}
