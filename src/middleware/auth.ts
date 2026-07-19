import { Context, Next } from 'hono';
import { verifyJwt } from '../lib/crypto';
import type { Env, AuthPayload } from '../types';

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJwt(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  // Attach auth payload to context
  c.set('auth', payload as AuthPayload);

  await next();
}
