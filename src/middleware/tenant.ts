import { Context, Next } from 'hono';
import type { Env, AuthPayload } from '../types';

export async function tenantMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.get('auth') as AuthPayload | undefined;

  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Attach tenant context
  c.set('tenantId', auth.tenantId);

  await next();
}

export function getTenantId(c: Context<{ Bindings: Env }>): string {
  return c.get('tenantId');
}
