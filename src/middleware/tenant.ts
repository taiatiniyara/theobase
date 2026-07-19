import { Context, Next } from 'hono';
import type { Env, AuthPayload } from '../types';

type Variables = {
  auth: AuthPayload;
  tenantId: string;
};

export async function tenantMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const auth = c.get('auth');

  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Attach tenant context
  c.set('tenantId', auth.tenantId);

  await next();
}

export function getTenantId(c: Context<{ Bindings: Env; Variables: Variables }>): string {
  return c.get('tenantId');
}
