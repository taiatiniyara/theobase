import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { authRoutes } from '../src/api/auth';
import { createMockEnv, seedTestMember } from './helpers';

describe('Auth Seam', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/auth', authRoutes);
    
    // Seed test tenant and member
    await seedTestMember(env, {
      tenantId: 'tenant-1',
      memberId: 'member-1',
      email: 'treasurer@test.com',
      password: 'password123',
      role: 'treasurer',
      organizationId: 'org-1',
    });
  });

  describe('POST /auth/login', () => {
    it('returns a JWT token for valid credentials', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'treasurer@test.com',
          password: 'password123',
        }),
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as { token: string };
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });

    it('returns 401 for invalid password', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'treasurer@test.com',
          password: 'wrongpassword',
        }),
      }, env);

      expect(res.status).toBe(401);
      const data = await res.json() as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });

    it('returns 401 for non-existent member', async () => {
      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'password123',
        }),
      }, env);

      expect(res.status).toBe(401);
      const data = await res.json() as { error: string };
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/logout', () => {
    it('returns success message', async () => {
      const res = await app.request('/auth/logout', {
        method: 'POST',
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as { message: string };
      expect(data.message).toBe('Logged out successfully');
    });
  });
});
