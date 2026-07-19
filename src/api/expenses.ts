import { Hono } from 'hono';
import type { Env, AuthPayload, Expense, ExpenseCategory } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { writeAuditLog } from '../lib/audit';

type Variables = { auth: AuthPayload; tenantId: string };

export const expenseRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

expenseRoutes.use('*', authMiddleware);
expenseRoutes.use('*', tenantMiddleware);
expenseRoutes.use('*', permissionMiddleware);

expenseRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { amount, payee, expense_date, category_id, notes } = await c.req.json();

  if (!amount || amount <= 0) {
    return c.json({ error: 'Amount must be a positive number' }, 400);
  }
  if (!payee || !expense_date) {
    return c.json({ error: 'payee and expense_date are required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO expenses (id, tenant_id, organization_id, category_id, amount, payee, expense_date, notes, created_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, tenantId, auth.organizationId, category_id || null, amount, payee, expense_date, notes || null, auth.userId, now, now)
    .run();

  const expense = await c.env.DB.prepare('SELECT * FROM expenses WHERE id = ?')
    .bind(id)
    .first<Expense>();

  if (expense) {
    await writeAuditLog(c.env.DB, {
      tenantId,
      entityType: 'expense',
      entityId: id,
      action: 'create',
      userId: auth.userId,
      afterValues: { amount, payee, expense_date, organization_id: auth.organizationId },
    });
  }

  return c.json(expense, 201);
});

expenseRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const expenses = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE tenant_id = ? AND organization_id = ? ORDER BY expense_date DESC'
  )
    .bind(tenantId, auth.organizationId)
    .all<Expense>();

  return c.json(expenses.results);
});

expenseRoutes.get('/categories', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const categories = await c.env.DB.prepare(
    'SELECT * FROM expense_categories WHERE tenant_id = ? ORDER BY name'
  )
    .bind(tenantId)
    .all<ExpenseCategory>();

  return c.json(categories.results);
});

expenseRoutes.get('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const id = c.req.param('id');

  const expense = await c.env.DB.prepare(
    'SELECT * FROM expenses WHERE id = ? AND tenant_id = ? AND organization_id = ?'
  )
    .bind(id, tenantId, auth.organizationId)
    .first<Expense>();

  if (!expense) {
    return c.json({ error: 'Expense not found' }, 404);
  }

  return c.json(expense);
});
