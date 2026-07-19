import { Hono } from 'hono';
import type { Env, AuthPayload, Remittance, Balance, FundType } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';

type Variables = {
  auth: AuthPayload;
  tenantId: string;
};

export const remittanceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

remittanceRoutes.use('*', authMiddleware);
remittanceRoutes.use('*', tenantMiddleware);
remittanceRoutes.use('*', permissionMiddleware);

// Create a remittance (transfer funds from source to destination)
remittanceRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { destination_org_id, fund_type, amount, remittance_date, notes } = await c.req.json();

  // Validate
  if (!amount || amount <= 0) {
    return c.json({ error: 'Amount must be a positive number' }, 400);
  }
  if (fund_type !== 'tithe' && fund_type !== 'offering') {
    return c.json({ error: 'Invalid fund type' }, 400);
  }

  // Check source balance
  const sourceBalance = await c.env.DB.prepare(
    'SELECT * FROM balances WHERE organization_id = ? AND fund_type = ? AND tenant_id = ?'
  )
    .bind(auth.organizationId, fund_type, tenantId)
    .first<Balance>();

  if (!sourceBalance || sourceBalance.amount < amount) {
    return c.json({ error: 'Insufficient balance for remittance' }, 400);
  }

  // Check destination org exists
  const destOrg = await c.env.DB.prepare(
    'SELECT id FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(destination_org_id, tenantId)
    .first();

  if (!destOrg) {
    return c.json({ error: 'Destination organization not found' }, 400);
  }

  const now = new Date().toISOString();
  const remittanceId = crypto.randomUUID();

  // Atomic remittance: insert remittance + update both balances in a batch
  const newSourceBalance = sourceBalance.amount - amount;

  const destBalance = await c.env.DB.prepare(
    'SELECT * FROM balances WHERE organization_id = ? AND fund_type = ? AND tenant_id = ?'
  )
    .bind(destination_org_id, fund_type, tenantId)
    .first<Balance>();

  const destBalanceInsertId = crypto.randomUUID();
  const newDestBalance = destBalance ? destBalance.amount + amount : amount;

  const statements: D1PreparedStatement[] = [
    // Insert remittance record
    c.env.DB.prepare(
      `INSERT INTO remittances (id, tenant_id, source_org_id, destination_org_id, fund_type, amount, user_id, remittance_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(remittanceId, tenantId, auth.organizationId, destination_org_id, fund_type, amount, auth.userId, remittance_date, notes || null, now),
    // Decrease source balance
    c.env.DB.prepare(
      'UPDATE balances SET amount = ?, updated_at = ? WHERE id = ?'
    ).bind(newSourceBalance, now, sourceBalance.id),
  ];

  if (destBalance) {
    statements.push(
      c.env.DB.prepare(
        'UPDATE balances SET amount = ?, updated_at = ? WHERE id = ?'
      ).bind(newDestBalance, now, destBalance.id)
    );
  } else {
    statements.push(
      c.env.DB.prepare(
        'INSERT INTO balances (id, tenant_id, organization_id, fund_type, amount, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(destBalanceInsertId, tenantId, destination_org_id, fund_type, amount, now)
    );
  }

  await c.env.DB.batch(statements);

  // Fetch the created remittance
  const remittance = await c.env.DB.prepare(
    'SELECT * FROM remittances WHERE id = ?'
  )
    .bind(remittanceId)
    .first<Remittance>();

  return c.json(remittance, 201);
});

// List remittances for the authenticated user's organization
remittanceRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const remittances = await c.env.DB.prepare(
    'SELECT * FROM remittances WHERE tenant_id = ? AND source_org_id = ? ORDER BY remittance_date DESC'
  )
    .bind(tenantId, auth.organizationId)
    .all<Remittance>();

  return c.json(remittances.results);
});
