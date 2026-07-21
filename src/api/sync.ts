import { Hono } from 'hono';
import type { Env, AuthPayload, SyncPayload, Transaction, FundType } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { allocateTithe, allocateOffering, allocateRestricted } from '../lib/allocation';
import { writeAuditLog } from '../lib/audit';

type Variables = { auth: AuthPayload; tenantId: string };

export const syncRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

syncRoutes.use('*', authMiddleware);
syncRoutes.use('*', tenantMiddleware);
syncRoutes.use('*', permissionMiddleware);

function validateFundType(fund_type: string): fund_type is FundType {
  return fund_type === 'tithe' || fund_type === 'offering' || fund_type === 'restricted';
}

function validateDate(date: string): boolean {
  return !isNaN(new Date(date).getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

syncRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const payload = await c.req.json<SyncPayload>();

  if (!Array.isArray(payload.transactions) || payload.transactions.length === 0) {
    return c.json({ error: 'Transactions array is required' }, 400);
  }

  const created: Transaction[] = [];
  const errors: { index: number; error: string }[] = [];

  for (let i = 0; i < payload.transactions.length; i++) {
    const txn = payload.transactions[i];

    if (typeof txn.amount !== 'number' || txn.amount <= 0) {
      errors.push({ index: i, error: 'Amount must be a positive number' });
      continue;
    }
    if (!validateFundType(txn.fund_type)) {
      errors.push({ index: i, error: 'Invalid fund type' });
      continue;
    }
    if (!validateDate(txn.transaction_date)) {
      errors.push({ index: i, error: 'Invalid date format (YYYY-MM-DD)' });
      continue;
    }
    if (txn.member_id) {
      const member = await c.env.DB.prepare('SELECT id FROM members WHERE id = ? AND tenant_id = ?')
        .bind(txn.member_id, tenantId)
        .first();
      if (!member) {
        errors.push({ index: i, error: 'Member not found' });
        continue;
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, offering_sub_category, amount, transaction_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id, tenantId, auth.organizationId, txn.member_id || null,
        txn.fund_type, txn.offering_sub_category || null, txn.amount, txn.transaction_date, txn.notes || null, now, now
      )
      .run();

    try {
      if (txn.fund_type === 'tithe') {
        await allocateTithe(c.env.DB, tenantId, id, txn.amount, auth.organizationId);
      } else if (txn.fund_type === 'offering') {
        await allocateOffering(c.env.DB, tenantId, id, txn.amount, auth.organizationId);
      } else if (txn.fund_type === 'restricted') {
        await allocateRestricted(c.env.DB, tenantId, id, txn.amount, auth.organizationId);
      }
    } catch (err) {
      errors.push({ index: i, error: `Allocation failed: ${(err as Error).message}` });
      continue;
    }

    await writeAuditLog(c.env.DB, {
      tenantId,
      entityType: 'transaction',
      entityId: id,
      action: 'create',
      userId: auth.userId,
      afterValues: { amount: txn.amount, fund_type: txn.fund_type, member_id: txn.member_id || null, organization_id: auth.organizationId },
    });

    const transaction = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ?')
      .bind(id)
      .first<Transaction>();
    if (transaction) {
      created.push(transaction);
    }
  }

  return c.json({
    success: true,
    synced_at: new Date().toISOString(),
    total_processed: payload.transactions.length,
    created: created.length,
    errors: errors.length > 0 ? errors : undefined,
    transactions: created,
  }, errors.length > 0 ? 207 : 200);
});
