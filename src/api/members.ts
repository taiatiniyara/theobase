import { Hono } from 'hono';
import type { Env, AuthPayload, GivingHistory, FundType, Member } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';

type Variables = { auth: AuthPayload; tenantId: string };

export const memberRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

memberRoutes.use('*', authMiddleware);
memberRoutes.use('*', tenantMiddleware);
memberRoutes.use('*', permissionMiddleware);

// Get current member's profile
memberRoutes.get('/me', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const member = await c.env.DB.prepare(
    'SELECT id, tenant_id, email, role, organization_id, created_at, updated_at FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(auth.userId, tenantId)
    .first<Omit<Member, 'password_hash'>>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json(member);
});

// Get current member's own giving history
memberRoutes.get('/me/giving-history', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = auth.userId;

  const transactions = await c.env.DB.prepare(
    `SELECT fund_type, amount, transaction_date
     FROM transactions
     WHERE tenant_id = ? AND member_id = ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, memberId)
    .all<{ fund_type: FundType; amount: number; transaction_date: string }>();

  const historyMap = new Map<string, GivingHistory>();

  for (const txn of transactions.results) {
    const year = new Date(txn.transaction_date).getFullYear();
    const key = `${year}-${txn.fund_type}`;

    const existing = historyMap.get(key);
    if (existing) {
      existing.total += txn.amount;
      existing.transaction_count += 1;
    } else {
      historyMap.set(key, {
        member_id: memberId,
        member_name: '',
        year,
        fund_type: txn.fund_type,
        total: txn.amount,
        transaction_count: 1,
      });
    }
  }

  return c.json(Array.from(historyMap.values()));
});

// Get giving history for a member
memberRoutes.get('/:id/giving-history', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('id');

  // Privacy check: only treasurer/pastor of the member's church can see records
  // Or the member themselves
  const member = await c.env.DB.prepare(
    'SELECT organization_id FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(memberId, tenantId)
    .first<{ organization_id: string }>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  // Check access: user must be in the same org, or be the member themselves
  if (auth.userId !== memberId && auth.organizationId !== member.organization_id) {
    return c.json({ error: 'Permission denied' }, 403);
  }

  // Query giving history grouped by year and fund type
  const transactions = await c.env.DB.prepare(
    `SELECT fund_type, amount, transaction_date
     FROM transactions
     WHERE tenant_id = ? AND member_id = ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, memberId)
    .all<{ fund_type: FundType; amount: number; transaction_date: string }>();

  // Group by year and fund type
  const historyMap = new Map<string, GivingHistory>();

  for (const txn of transactions.results) {
    const year = new Date(txn.transaction_date).getFullYear();
    const key = `${year}-${txn.fund_type}`;

    const existing = historyMap.get(key);
    if (existing) {
      existing.total += txn.amount;
      existing.transaction_count += 1;
    } else {
      historyMap.set(key, {
        member_id: memberId,
        member_name: '', // TODO: fetch member name when we have a name field
        year,
        fund_type: txn.fund_type,
        total: txn.amount,
        transaction_count: 1,
      });
    }
  }

  return c.json(Array.from(historyMap.values()));
});
