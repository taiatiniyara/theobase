import { Hono } from 'hono';
import type { Env, AuthPayload, AuditLog } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';

type Variables = { auth: AuthPayload; tenantId: string };

export const auditRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

auditRoutes.use('*', authMiddleware);
auditRoutes.use('*', tenantMiddleware);

// Query audit log with filters
auditRoutes.get('/', async (c) => {
  const tenantId = getTenantId(c);
  const auth = c.get('auth');

  const entityType = c.req.query('entity_type');
  const entityId = c.req.query('entity_id');
  const userId = c.req.query('user_id');
  const action = c.req.query('action');
  const from = c.req.query('from');
  const to = c.req.query('to');

  let query = 'SELECT * FROM audit_log WHERE tenant_id = ?';
  const params: any[] = [tenantId];

  if (entityType) {
    query += ' AND entity_type = ?';
    params.push(entityType);
  }
  if (entityId) {
    query += ' AND entity_id = ?';
    params.push(entityId);
  }
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  if (from) {
    query += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND created_at <= ?';
    params.push(to + 'T23:59:59Z');
  }

  query += ' ORDER BY created_at DESC';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<AuditLog>();

  return c.json(result.results);
});
