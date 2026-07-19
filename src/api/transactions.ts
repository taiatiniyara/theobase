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

// Validation helpers
function validateFundType(fund_type: string): fund_type is FundType {
  return fund_type === 'tithe' || fund_type === 'offering';
}

function validateAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && amount > 0;
}

function validateDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && date.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
}

async function validateMemberExists(db: D1Database, tenantId: string, memberId: string): Promise<boolean> {
  const member = await db.prepare(
    'SELECT id FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(memberId, tenantId)
    .first();
  return !!member;
}

async function validateOrganizationExists(db: D1Database, tenantId: string, orgId: string): Promise<boolean> {
  const org = await db.prepare(
    'SELECT id FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(orgId, tenantId)
    .first();
  return !!org;
}

// Create a single transaction
transactionRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { member_id, fund_type, amount, transaction_date, notes } = await c.req.json();

  // Validate amount
  if (!validateAmount(amount)) {
    return c.json({ error: 'Amount must be a positive number' }, 400);
  }

  // Validate fund_type
  if (!validateFundType(fund_type)) {
    return c.json({ error: 'Invalid fund type' }, 400);
  }

  // Validate date
  if (!validateDate(transaction_date)) {
    return c.json({ error: 'Invalid date format (YYYY-MM-DD)' }, 400);
  }

  // Validate organization exists
  const orgExists = await validateOrganizationExists(c.env.DB, tenantId, auth.organizationId);
  if (!orgExists) {
    return c.json({ error: 'Organization not found' }, 400);
  }

  // Validate member exists (if provided)
  if (member_id) {
    const memberExists = await validateMemberExists(c.env.DB, tenantId, member_id);
    if (!memberExists) {
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

  // Validate organization exists
  const orgExists = await validateOrganizationExists(c.env.DB, tenantId, auth.organizationId);
  if (!orgExists) {
    return c.json({ error: 'Organization not found' }, 400);
  }

  // Validate all transactions first
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    
    if (!validateAmount(txn.amount)) {
      return c.json({ error: `Transaction ${i + 1}: amount must be a positive number` }, 400);
    }
    
    if (!validateFundType(txn.fund_type)) {
      return c.json({ error: `Transaction ${i + 1}: invalid fund type` }, 400);
    }
    
    if (!validateDate(txn.transaction_date)) {
      return c.json({ error: `Transaction ${i + 1}: invalid date format` }, 400);
    }
    
    // Validate member if provided
    if (txn.member_id) {
      const memberExists = await validateMemberExists(c.env.DB, tenantId, txn.member_id);
      if (!memberExists) {
        return c.json({ error: `Transaction ${i + 1}: member not found` }, 400);
      }
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
      .bind(id, tenantId, auth.organizationId, txn.member_id || null, txn.fund_type, txn.amount, txn.transaction_date, txn.notes || null, now, now)
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
// For hierarchical access, this should be extended to include child organizations
transactionRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  // TODO: For Mission/Conference treasurers, this should include child organizations
  // Current implementation only returns transactions for the user's direct organization
  const transactions = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE tenant_id = ? AND organization_id = ? ORDER BY transaction_date DESC'
  )
    .bind(tenantId, auth.organizationId)
    .all<Transaction>();

  return c.json(transactions.results);
});
