import { Hono } from 'hono';
import type { Env, Organization, OrganizationType } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';

export const organizationRoutes = new Hono<{ Bindings: Env }>();

// Apply auth, tenant, and permission middleware to all routes
organizationRoutes.use('*', authMiddleware);
organizationRoutes.use('*', tenantMiddleware);
organizationRoutes.use('*', permissionMiddleware);

// Get organization by ID
organizationRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const tenantId = getTenantId(c);

  const org = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .first<Organization>();

  if (!org) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  return c.json(org);
});

// List organizations (optionally by parent)
organizationRoutes.get('/', async (c) => {
  const tenantId = getTenantId(c);
  const parentId = c.req.query('parent_id');

  let query = 'SELECT * FROM organizations WHERE tenant_id = ?';
  const params: any[] = [tenantId];

  if (parentId) {
    query += ' AND parent_id = ?';
    params.push(parentId);
  }

  const orgs = await c.env.DB.prepare(query)
    .bind(...params)
    .all<Organization>();

  return c.json(orgs.results);
});

// Create organization
organizationRoutes.post('/', async (c) => {
  const tenantId = getTenantId(c);
  const { name, type, parent_id } = await c.req.json();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'INSERT INTO organizations (id, tenant_id, name, type, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, tenantId, name, type, parent_id || null, now, now)
    .run();

  const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?')
    .bind(id)
    .first<Organization>();

  return c.json(org, 201);
});

// Get children of an organization
organizationRoutes.get('/:id/children', async (c) => {
  const id = c.req.param('id');
  const tenantId = getTenantId(c);

  const children = await c.env.DB.prepare(
    'SELECT * FROM organizations WHERE parent_id = ? AND tenant_id = ?'
  )
    .bind(id, tenantId)
    .all<Organization>();

  return c.json(children.results);
});
