import { Hono } from 'hono';
import type { Env, AuthPayload, Transaction, FundType } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';

type Variables = {
  auth: AuthPayload;
  tenantId: string;
};

export const transactionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply middleware
transactionRoutes.use('*', authMiddleware);
transactionRoutes.use('*', tenantMiddleware);
transactionRoutes.use('*', permissionMiddleware);

// Create a single transaction
transactionRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { member_id, fund_type, amount, transaction_date, notes } = await c.req.json();

  // Validate amount
  if (!amount || amount <= 0) {
    return c.json({ error: 'Amount must be greater than 0' }, 400);
  }

  // Validate fund_type
  if (fund_type !== 'tithe' && fund_type !== 'offering') {
    return c.json({ error: 'Invalid fund type' }, 400);
  }

  // Validate member exists (if provided)
  if (member_id) {
    const member = await c.env.DB.prepare(
      'SELECT id FROM members WHERE id = ? AND tenant_id = ?'
    )
      .bind(member_id, tenantId)
      .first();

    if (!member) {
      return c.json({ error: 'Member not found' }, 400);
    }
  }

  // Create transaction
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, tenantId, auth.organizationId, member_id || null, fund_type, amount, transaction_date, notes || null, now, now)
    .run();

  // Fetch and return the created transaction
  const transaction = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ?'
  )
    .bind(id)
    .first<Transaction>();

  return c.json(transaction, 201);
});

// Create multiple transactions (batch)
transactionRoutes.post('/batch', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { transactions } = await c.req.json<{ transactions: any[] }>();

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return c.json({ error: 'Transactions array is required' }, 400);
  }

  // Validate all transactions first
  for (const txn of transactions) {
    if (!txn.amount || txn.amount <= 0) {
      return c.json({ error: 'All amounts must be greater than 0' }, 400);
    }
    if (txn.fund_type !== 'tithe' && txn.fund_type !== 'offering') {
      return c.json({ error: 'Invalid fund type' }, 400);
    }
  }

  const now = new Date().toISOString();
  const createdTransactions: Transaction[] = [];

  // Insert all transactions
  for (const txn of transactions) {
    const id = crypto.randomUUID();
    
    await c.env.DB.prepare(
      `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, tenantId, auth.organizationId, null, txn.fund_type, txn.amount, txn.transaction_date, txn.notes || null, now, now)
      .run();

    const transaction = await c.env.DB.prepare(
      'SELECT * FROM transactions WHERE id = ?'
    )
      .bind(id)
      .first<Transaction>();

    if (transaction) {
      createdTransactions.push(transaction);
    }
  }

  return c.json({ count: createdTransactions.length, transactions: createdTransactions }, 201);
});

// List transactions for the authenticated user's organization
transactionRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const transactions = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE tenant_id = ? AND organization_id = ? ORDER BY transaction_date DESC'
  )
    .bind(tenantId, auth.organizationId)
    .all<Transaction>();

  return c.json(transactions.results);
});
