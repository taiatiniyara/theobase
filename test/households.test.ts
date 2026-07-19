import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { householdRoutes } from '../src/api/households';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Households: CRUD + Linking', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let clerkToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/households', householdRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'clerk-1', email: 'clerk@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });

    clerkToken = await signJwt(
      { userId: 'clerk-1', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('POST /households', () => {
    it('creates a household', async () => {
      const res = await app.request('/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ name: 'Doe Family' }),
      }, env);

      expect(res.status).toBe(201);
      const household = await res.json() as { name: string };
      expect(household.name).toBe('Doe Family');
    });

    it('sets head of household', async () => {
      const res = await app.request('/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ name: 'Smith Family', head_of_household_id: 'clerk-1' }),
      }, env);

      expect(res.status).toBe(201);
    });

    it('requires a name', async () => {
      const res = await app.request('/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /households', () => {
    it('lists households for the org', async () => {
      const res = await app.request('/households', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(200);
      const list = await res.json() as unknown[];
      expect(Array.isArray(list)).toBe(true);
    });
  });
});
