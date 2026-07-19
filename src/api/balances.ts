import { Hono } from 'hono';
import type { Env, AuthPayload, Balance } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';

type Variables = {
  auth: AuthPayload;
  tenantId: string;
};

export const balanceRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

balanceRoutes.use('*', authMiddleware);
balanceRoutes.use('*', tenantMiddleware);
balanceRoutes.use('*', permissionMiddleware);

// Get balances for the authenticated user's organization
balanceRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const balances = await c.env.DB.prepare(
    'SELECT * FROM balances WHERE tenant_id = ? AND organization_id = ?'
  )
    .bind(tenantId, auth.organizationId)
    .all<Balance>();

  return c.json(balances.results);
});
