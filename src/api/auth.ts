import { Hono } from 'hono';
import { hashPassword, signJwt, verifyPassword } from '../lib/crypto';
import type { Env, AuthPayload } from '../types';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const env = c.env;

  // Find member by email
  const member = await env.DB.prepare(
    'SELECT id, tenant_id, email, password_hash, role, organization_id FROM members WHERE email = ?'
  )
    .bind(email)
    .first<{
      id: string;
      tenant_id: string;
      email: string;
      password_hash: string;
      role: string;
      organization_id: string;
    }>();

  if (!member) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, member.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Create JWT token
  const payload: AuthPayload = {
    userId: member.id,
    tenantId: member.tenant_id,
    role: member.role as AuthPayload['role'],
    organizationId: member.organization_id,
  };

  const token = await signJwt(payload as unknown as Record<string, unknown>, env.JWT_SECRET);

  return c.json({ token });
});

authRoutes.post('/logout', async (c) => {
  // JWT is stateless - logout is client-side (discard token)
  return c.json({ message: 'Logged out successfully' });
});
