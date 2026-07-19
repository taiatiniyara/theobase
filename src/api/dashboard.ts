import { Hono } from 'hono';
import type { Env, AuthPayload, Transaction } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';

type Variables = { auth: AuthPayload; tenantId: string };

export const dashboardRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

dashboardRoutes.use('*', authMiddleware);
dashboardRoutes.use('*', tenantMiddleware);

async function requireMissionLevel(c: any, next: any) {
  const auth = c.get('auth');
  const userOrg = await c.env.DB.prepare(
    'SELECT type FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(auth.organizationId, auth.tenantId)
    .first<{ type: string }>();

  if (!userOrg) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  const allowedLevels = ['mission', 'conference', 'union', 'general_conference'];
  if (!allowedLevels.includes(userOrg.type)) {
    return c.json({ error: 'Access denied: Mission-level or higher required' }, 403);
  }

  await next();
}

dashboardRoutes.use('*', requireMissionLevel);

// Get all churches under this mission with current month summary
dashboardRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const now = new Date();
  const year = c.req.query('year') || String(now.getFullYear());
  const month = c.req.query('month') || String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const nextMonth = parseInt(month) === 12 ? `1` : String(parseInt(month) + 1).padStart(2, '0');
  const nextYear = parseInt(month) === 12 ? String(parseInt(year) + 1) : year;
  const monthEnd = `${nextYear}-${nextMonth}-01`;

  const userOrg = await c.env.DB.prepare(
    'SELECT type, parent_id, id FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(auth.organizationId, tenantId)
    .first<{ type: string; parent_id: string | null; id: string }>();

  if (!userOrg) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  let churches;
  if (userOrg.type === 'mission') {
    churches = await c.env.DB.prepare(
      `SELECT id, name FROM organizations WHERE tenant_id = ? AND type = 'local_church' AND parent_id = ?`
    )
      .bind(tenantId, userOrg.id)
      .all<{ id: string; name: string }>();
  } else {
    churches = await c.env.DB.prepare(
      `SELECT id, name FROM organizations WHERE tenant_id = ? AND type = 'local_church'`
    )
      .bind(tenantId)
      .all<{ id: string; name: string }>();
  }

  const summary = await Promise.all(
    churches.results.map(async (church) => {
      const titheResult = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE tenant_id = ? AND organization_id = ? AND fund_type = 'tithe'
         AND transaction_date >= ? AND transaction_date < ?`
      )
        .bind(tenantId, church.id, monthStart, monthEnd)
        .first<{ total: number }>();

      const offeringResult = await c.env.DB.prepare(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE tenant_id = ? AND organization_id = ? AND fund_type = 'offering'
         AND transaction_date >= ? AND transaction_date < ?`
      )
        .bind(tenantId, church.id, monthStart, monthEnd)
        .first<{ total: number }>();

      const lastTxn = await c.env.DB.prepare(
        `SELECT transaction_date FROM transactions
         WHERE tenant_id = ? AND organization_id = ?
         ORDER BY transaction_date DESC LIMIT 1`
      )
        .bind(tenantId, church.id)
        .first<{ transaction_date: string }>();

      return {
        church_id: church.id,
        church_name: church.name,
        current_month_tithe: titheResult?.total || 0,
        current_month_offering: offeringResult?.total || 0,
        submission_status: lastTxn ? 'submitted' : 'late',
        last_transaction_date: lastTxn?.transaction_date || null,
      };
    })
  );

  return c.json(summary);
});

// Get transactions for a specific church
dashboardRoutes.get('/churches/:id/transactions', async (c) => {
  const tenantId = getTenantId(c);
  const churchId = c.req.param('id');
  const now = new Date();
  const year = c.req.query('year') || String(now.getFullYear());
  const month = c.req.query('month') || String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = `${year}-${month}-01`;
  const nextMonth = parseInt(month) === 12 ? `1` : String(parseInt(month) + 1).padStart(2, '0');
  const nextYear = parseInt(month) === 12 ? String(parseInt(year) + 1) : year;
  const monthEnd = `${nextYear}-${nextMonth}-01`;

  const church = await c.env.DB.prepare(
    `SELECT id, name, type FROM organizations WHERE id = ? AND tenant_id = ? AND type = 'local_church'`
  )
    .bind(churchId, tenantId)
    .first<{ id: string; name: string; type: string }>();

  if (!church) {
    return c.json({ error: 'Church not found' }, 404);
  }

  const transactions = await c.env.DB.prepare(
    `SELECT * FROM transactions
     WHERE tenant_id = ? AND organization_id = ?
     AND transaction_date >= ? AND transaction_date < ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, churchId, monthStart, monthEnd)
    .all<Transaction>();

  return c.json({
    church: { id: church.id, name: church.name },
    month: `${year}-${month}`,
    transactions: transactions.results,
  });
});
