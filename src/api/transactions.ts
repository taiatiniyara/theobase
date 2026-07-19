import { Hono } from 'hono';
import type { Env, AuthPayload, Transaction, FundType, FundAllocation } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { allocateTithe, allocateOffering, allocateRestricted, getAllocationsForTransaction } from '../lib/allocation';
import { writeAuditLog } from '../lib/audit';

type Variables = {
  auth: AuthPayload;
  tenantId: string;
};

export const transactionRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

transactionRoutes.use('*', authMiddleware);
transactionRoutes.use('*', tenantMiddleware);
transactionRoutes.use('*', permissionMiddleware);

function validateFundType(fund_type: string): fund_type is FundType {
  return fund_type === 'tithe' || fund_type === 'offering' || fund_type === 'restricted';
}

function validateAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && amount > 0;
}

function validateDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && date.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
}

async function validateMemberExists(db: D1Database, tenantId: string, memberId: string): Promise<boolean> {
  const member = await db.prepare('SELECT id FROM members WHERE id = ? AND tenant_id = ?')
    .bind(memberId, tenantId)
    .first();
  return !!member;
}

async function validateOrganizationExists(db: D1Database, tenantId: string, orgId: string): Promise<boolean> {
  const org = await db.prepare('SELECT id FROM organizations WHERE id = ? AND tenant_id = ?')
    .bind(orgId, tenantId)
    .first();
  return !!org;
}

async function createTransactionRecord(
  db: D1Database,
  tenantId: string,
  orgId: string,
  memberId: string | null,
  fundType: FundType,
  amount: number,
  transactionDate: string,
  notes: string | null
): Promise<Transaction> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, tenantId, orgId, memberId, fundType, amount, transactionDate, notes, now, now)
    .run();

  const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ?')
    .bind(id)
    .first<Transaction>();

  return transaction!;
}

// Create a single transaction (with automatic fund allocation)
transactionRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { member_id, fund_type, amount, transaction_date, notes } = await c.req.json();

  if (!validateAmount(amount)) {
    return c.json({ error: 'Amount must be a positive number' }, 400);
  }
  if (!validateFundType(fund_type)) {
    return c.json({ error: 'Invalid fund type' }, 400);
  }
  if (!validateDate(transaction_date)) {
    return c.json({ error: 'Invalid date format (YYYY-MM-DD)' }, 400);
  }

  const orgExists = await validateOrganizationExists(c.env.DB, tenantId, auth.organizationId);
  if (!orgExists) {
    return c.json({ error: 'Organization not found' }, 400);
  }

  if (member_id) {
    const memberExists = await validateMemberExists(c.env.DB, tenantId, member_id);
    if (!memberExists) {
      return c.json({ error: 'Member not found' }, 400);
    }
  }

  // Create transaction
  const transaction = await createTransactionRecord(
    c.env.DB, tenantId, auth.organizationId, member_id || null, fund_type, amount, transaction_date, notes || null
  );

  // Auto-allocate funds
  try {
    if (fund_type === 'tithe') {
      await allocateTithe(c.env.DB, tenantId, transaction.id, amount, auth.organizationId);
    } else if (fund_type === 'offering') {
      await allocateOffering(c.env.DB, tenantId, transaction.id, amount, auth.organizationId);
    } else if (fund_type === 'restricted') {
      await allocateRestricted(c.env.DB, tenantId, transaction.id, amount, auth.organizationId);
    }
  } catch (err) {
    return c.json({ error: `Allocation failed: ${(err as Error).message}` }, 500);
  }

  // Write audit log
  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'transaction',
    entityId: transaction.id,
    action: 'create',
    userId: auth.userId,
    afterValues: { amount, fund_type, member_id: member_id || null, organization_id: auth.organizationId },
  });

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

  const orgExists = await validateOrganizationExists(c.env.DB, tenantId, auth.organizationId);
  if (!orgExists) {
    return c.json({ error: 'Organization not found' }, 400);
  }

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
    if (txn.member_id) {
      const memberExists = await validateMemberExists(c.env.DB, tenantId, txn.member_id);
      if (!memberExists) {
        return c.json({ error: `Transaction ${i + 1}: member not found` }, 400);
      }
    }
  }

  const createdTransactions: Transaction[] = [];

  for (const txn of transactions) {
    const transaction = await createTransactionRecord(
      c.env.DB, tenantId, auth.organizationId, txn.member_id || null,
      txn.fund_type, txn.amount, txn.transaction_date, txn.notes || null
    );

    try {
      if (txn.fund_type === 'tithe') {
        await allocateTithe(c.env.DB, tenantId, transaction.id, txn.amount, auth.organizationId);
      } else if (txn.fund_type === 'offering') {
        await allocateOffering(c.env.DB, tenantId, transaction.id, txn.amount, auth.organizationId);
      } else if (txn.fund_type === 'restricted') {
        await allocateRestricted(c.env.DB, tenantId, transaction.id, txn.amount, auth.organizationId);
      }
    } catch (err) {
      return c.json({ error: `Allocation failed for transaction: ${(err as Error).message}` }, 500);
    }

    createdTransactions.push(transaction);
  }

  return c.json({ count: createdTransactions.length, transactions: createdTransactions }, 201);
});

// List transactions
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

// Get allocations for the most recent transaction (for testing/demo)
transactionRoutes.get('/allocations', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  // Get the most recent transaction for this org
  const transactions = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE tenant_id = ? AND organization_id = ? ORDER BY created_at DESC LIMIT 1'
  )
    .bind(tenantId, auth.organizationId)
    .all<Transaction>();

  if (transactions.results.length === 0) {
    return c.json([]);
  }

  const allocations = await getAllocationsForTransaction(c.env.DB, transactions.results[0].id, tenantId);
  return c.json(allocations);
});

// Get allocations for a specific transaction
transactionRoutes.get('/:id/allocations', async (c) => {
  const transactionId = c.req.param('id');
  const tenantId = getTenantId(c);
  const allocations = await getAllocationsForTransaction(c.env.DB, transactionId, tenantId);
  return c.json(allocations);
});

// Get a single transaction by ID
transactionRoutes.get('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const transactionId = c.req.param('id');

  const transaction = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ? AND tenant_id = ? AND organization_id = ?'
  )
    .bind(transactionId, tenantId, auth.organizationId)
    .first<Transaction>();

  if (!transaction) {
    return c.json({ error: 'Transaction not found' }, 404);
  }

  return c.json(transaction);
});

// Edit a transaction (with before/after audit)
transactionRoutes.put('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const transactionId = c.req.param('id');
  const { amount, fund_type, transaction_date, notes, member_id } = await c.req.json();

  const existing = await c.env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ? AND tenant_id = ? AND organization_id = ?'
  )
    .bind(transactionId, tenantId, auth.organizationId)
    .first<Transaction>();

  if (!existing) {
    return c.json({ error: 'Transaction not found' }, 404);
  }

  if (amount !== undefined && !validateAmount(amount)) {
    return c.json({ error: 'Amount must be a positive number' }, 400);
  }
  if (fund_type !== undefined && !validateFundType(fund_type)) {
    return c.json({ error: 'Invalid fund type' }, 400);
  }
  if (transaction_date !== undefined && !validateDate(transaction_date)) {
    return c.json({ error: 'Invalid date format (YYYY-MM-DD)' }, 400);
  }

  const beforeValues = {
    amount: existing.amount,
    fund_type: existing.fund_type,
    transaction_date: existing.transaction_date,
    notes: existing.notes,
    member_id: existing.member_id,
  };

  const newAmount = amount !== undefined ? amount : existing.amount;
  const newFundType = fund_type !== undefined ? fund_type : existing.fund_type;
  const newDate = transaction_date !== undefined ? transaction_date : existing.transaction_date;
  const newNotes = notes !== undefined ? notes : existing.notes;
  const newMemberId = member_id !== undefined ? member_id : existing.member_id;

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `UPDATE transactions SET amount = ?, fund_type = ?, transaction_date = ?, notes = ?, member_id = ?, updated_at = ?
     WHERE id = ? AND tenant_id = ? AND organization_id = ?`
  )
    .bind(newAmount, newFundType, newDate, newNotes, newMemberId, now, transactionId, tenantId, auth.organizationId)
    .run();

  const afterValues = {
    amount: newAmount,
    fund_type: newFundType,
    transaction_date: newDate,
    notes: newNotes,
    member_id: newMemberId,
  };

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'transaction',
    entityId: transactionId,
    action: 'update',
    userId: auth.userId,
    beforeValues,
    afterValues,
  });

  const updated = await c.env.DB.prepare('SELECT * FROM transactions WHERE id = ?')
    .bind(transactionId)
    .first<Transaction>();

  return c.json(updated);
});
