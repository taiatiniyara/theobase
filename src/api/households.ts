import { Hono } from 'hono';
import type { Env, AuthPayload, Household } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { writeAuditLog } from '../lib/audit';

type Variables = { auth: AuthPayload; tenantId: string };

export const householdRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

householdRoutes.use('*', authMiddleware);
householdRoutes.use('*', tenantMiddleware);
householdRoutes.use('*', permissionMiddleware);

householdRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const households = await c.env.DB.prepare(
    'SELECT * FROM households WHERE tenant_id = ? AND organization_id = ? ORDER BY name'
  )
    .bind(tenantId, auth.organizationId)
    .all<Household>();

  return c.json(households.results);
});

householdRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { name, head_of_household_id } = await c.req.json();

  if (!name) {
    return c.json({ error: 'Household name is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO households (id, tenant_id, organization_id, name, head_of_household_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, tenantId, auth.organizationId, name, head_of_household_id || null, now, now)
    .run();

  if (head_of_household_id) {
    await c.env.DB.prepare(
      'UPDATE members SET household_id = ? WHERE id = ? AND tenant_id = ?'
    )
      .bind(id, head_of_household_id, tenantId)
      .run();
  }

  const household = await c.env.DB.prepare('SELECT * FROM households WHERE id = ?')
    .bind(id)
    .first<Household>();

  if (household) {
    await writeAuditLog(c.env.DB, {
      tenantId,
      entityType: 'organization',
      entityId: id,
      action: 'create',
      userId: auth.userId,
      afterValues: { name, head_of_household_id: head_of_household_id || null, organization_id: auth.organizationId },
    });
  }

  return c.json(household, 201);
});

householdRoutes.get('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const id = c.req.param('id');

  const household = await c.env.DB.prepare(
    'SELECT * FROM households WHERE id = ? AND tenant_id = ? AND organization_id = ?'
  )
    .bind(id, tenantId, auth.organizationId)
    .first<Household>();

  if (!household) {
    return c.json({ error: 'Household not found' }, 404);
  }

  return c.json(household);
});

householdRoutes.get('/:id/members', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const id = c.req.param('id');

  const members = await c.env.DB.prepare(
    'SELECT id, first_name, last_name, membership_status FROM members WHERE household_id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .all<{ id: string; first_name: string; last_name: string; membership_status: string }>();

  return c.json(members.results);
});
