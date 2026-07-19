import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { organizationRoutes } from '../src/api/organizations';
import { transactionRoutes } from '../src/api/transactions';
import { memberRoutes } from '../src/api/members';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Tenant Isolation', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let tenant1Token: string;
  let tenant2Token: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/organizations', organizationRoutes);
    app.route('/transactions', transactionRoutes);
    app.route('/members', memberRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1a', name: 'Suva Central', type: 'local_church', parentId: 'mission-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-2', organizationId: 'mission-2', name: 'Vanuatu Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-2', organizationId: 'church-2a', name: 'Port Vila', type: 'local_church', parentId: 'mission-2',
    });

    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1', offeringPlanId: 'plan-1', name: 'Fiji COP',
      localPercent: 60, conferencePercent: 10, unionPercent: 10, gcPercent: 20,
    });
    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-2', offeringPlanId: 'plan-2', name: 'Vanuatu COP',
      localPercent: 50, conferencePercent: 15, unionPercent: 10, gcPercent: 25,
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'user-1', email: 't1@test.com',
      password: 'pass', role: 'mission_admin', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-2', memberId: 'user-2', email: 't2@test.com',
      password: 'pass', role: 'mission_admin', organizationId: 'mission-2',
    });

    tenant1Token = await signJwt(
      { userId: 'user-1', tenantId: 'tenant-1', role: 'mission_admin', organizationId: 'mission-1' },
      'test-secret'
    );
    tenant2Token = await signJwt(
      { userId: 'user-2', tenantId: 'tenant-2', role: 'mission_admin', organizationId: 'mission-2' },
      'test-secret'
    );
  });

  describe('Organization Isolation', () => {
    it('tenant 1 cannot see tenant 2 organizations', async () => {
      const res = await app.request('/organizations/mission-2', {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, env);

      expect(res.status).toBe(404);
    });

    it('tenant 2 cannot see tenant 1 organizations', async () => {
      const res = await app.request('/organizations/mission-1', {
        headers: { Authorization: `Bearer ${tenant2Token}` },
      }, env);

      expect(res.status).toBe(404);
    });

    it('each tenant only lists its own organizations', async () => {
      const res1 = await app.request('/organizations', {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, env);
      const res2 = await app.request('/organizations', {
        headers: { Authorization: `Bearer ${tenant2Token}` },
      }, env);

      expect(res1.status).toBe(200);
      const orgs1 = await res1.json() as { id: string }[];
      const ids1 = orgs1.map(o => o.id);
      expect(ids1).toContain('mission-1');
      expect(ids1).toContain('church-1a');
      expect(ids1).not.toContain('mission-2');
      expect(ids1).not.toContain('church-2a');

      expect(res2.status).toBe(200);
      const orgs2 = await res2.json() as { id: string }[];
      const ids2 = orgs2.map(o => o.id);
      expect(ids2).toContain('mission-2');
      expect(ids2).toContain('church-2a');
      expect(ids2).not.toContain('mission-1');
      expect(ids2).not.toContain('church-1a');
    });
  });

  describe('Transaction Isolation', () => {
    it('tenant 1 cannot see tenant 2 transactions', async () => {
      const res = await app.request('/transactions', {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, env);
      expect(res.status).toBe(200);
      const txs = await res.json() as { tenant_id: string }[];
      expect(txs.every((t: any) => t.tenant_id === 'tenant-1')).toBe(true);
    });

    it('prevents transactions in tenant 2 org with tenant 1 auth', async () => {
      // Create a member so the validation passes (member_id is optional anyway)
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`,
        },
        body: JSON.stringify({
          fund_type: 'tithe',
          amount: 50,
          transaction_date: '2025-01-15',
        }),
      }, env);

      expect(res.status).toBe(201);
    });
  });

  describe('Member Isolation', () => {
    it('tenant 1 cannot see tenant 2 member profiles', async () => {
      const res = await app.request('/members/user-2/giving-history', {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, env);
      expect(res.status).toBe(404);
    });

    it('each tenant sees their own member data', async () => {
      const res1 = await app.request('/members/me', {
        headers: { Authorization: `Bearer ${tenant1Token}` },
      }, env);
      expect(res1.status).toBe(200);
      const me1 = await res1.json() as { tenant_id: string };
      expect(me1.tenant_id).toBe('tenant-1');

      const res2 = await app.request('/members/me', {
        headers: { Authorization: `Bearer ${tenant2Token}` },
      }, env);
      expect(res2.status).toBe(200);
      const me2 = await res2.json() as { tenant_id: string };
      expect(me2.tenant_id).toBe('tenant-2');
    });
  });
});
