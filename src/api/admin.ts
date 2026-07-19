import { Hono } from 'hono';
import type { Env, AuthPayload } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { sendMonthlyReminders } from '../lib/reminders';

type Variables = { auth: AuthPayload; tenantId: string };

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', tenantMiddleware);

async function requireAdmin(c: any, next: any) {
  const auth = c.get('auth');
  if (auth.role !== 'administrator') {
    return c.json({ error: 'Access denied: Administrator role required' }, 403);
  }
  await next();
}

adminRoutes.use('*', requireAdmin);

adminRoutes.get('/health', async (c) => {
  const tenantId = getTenantId(c);

  const orgCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM organizations WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const memberCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM members WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const txnCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const recentErrors = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM audit_log
     WHERE tenant_id = ? AND action = 'delete' AND created_at >= datetime('now', '-7 days')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const recentActivity = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM audit_log
     WHERE tenant_id = ? AND created_at >= datetime('now', '-24 hours')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const activeMembers = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT user_id) as count FROM audit_log
     WHERE tenant_id = ? AND created_at >= datetime('now', '-7 days')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  return c.json({
    status: 'ok',
    checked_at: new Date().toISOString(),
    organizations: orgCount?.count || 0,
    members: memberCount?.count || 0,
    transactions: txnCount?.count || 0,
    recent_errors_7d: recentErrors?.count || 0,
    activity_24h: recentActivity?.count || 0,
    active_members_7d: activeMembers?.count || 0,
  });
});

adminRoutes.post('/send-reminders', async (c) => {
  const tenantId = getTenantId(c);

  if (!c.env.EMAIL) {
    return c.json({ error: 'Email binding not configured' }, 503);
  }

  const result = await sendMonthlyReminders(c.env.DB, c.env.EMAIL, c.env, tenantId);
  return c.json({ success: true, ...result });
});
