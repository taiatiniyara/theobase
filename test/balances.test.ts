import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { balanceRoutes } from '../src/api/balances';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Balances: Fund Balances Per Org', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let token: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/balances', balanceRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 'treas@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });

    token = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('GET /balances', () => {
    it('returns balances for the org', async () => {
      const res = await app.request('/balances', {
        headers: { Authorization: `Bearer ${token}` },
      }, env);

      expect(res.status).toBe(200);
      const balances = await res.json() as unknown[];
      expect(Array.isArray(balances)).toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await app.request('/balances', {}, env);
      expect(res.status).toBe(401);
    });
  });
});
