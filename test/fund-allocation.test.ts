import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { transactionRoutes } from '../src/api/transactions';
import { remittanceRoutes } from '../src/api/remittances';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Financial Pipeline - Fund Allocation + Remittance', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let churchTreasurerToken: string;
  let missionTreasurerToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/transactions', transactionRoutes);
    app.route('/remittances', remittanceRoutes);

    // Seed hierarchy: GC -> Union -> Conference -> Mission -> Church
    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'gc-1',
      name: 'General Conference',
      type: 'general_conference',
    });

    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'union-1',
      name: 'South Pacific Union',
      type: 'union',
      parentId: 'gc-1',
    });

    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'conference-1',
      name: 'Australian Conference',
      type: 'conference',
      parentId: 'union-1',
    });

    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'mission-1',
      name: 'Fiji Mission',
      type: 'mission',
      parentId: 'conference-1',
    });

    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'church-1',
      name: 'Suva Central Church',
      type: 'local_church',
      parentId: 'mission-1',
    });

    // Seed church treasurer
    await seedTestMember(env, {
      tenantId: 'tenant-1',
      memberId: 'church-treasurer',
      email: 'church@test.com',
      password: 'password123',
      role: 'treasurer',
      organizationId: 'church-1',
    });

    // Seed mission treasurer
    await seedTestMember(env, {
      tenantId: 'tenant-1',
      memberId: 'mission-treasurer',
      email: 'mission@test.com',
      password: 'password123',
      role: 'treasurer',
      organizationId: 'mission-1',
    });

    // Seed offering plan (50% local, 10% conference, 20% union, 20% GC)
    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1',
      offeringPlanId: 'plan-1',
      name: 'Combined Offering Plan',
      localPercent: 50,
      conferencePercent: 10,
      unionPercent: 20,
      gcPercent: 20,
    });

    // Generate tokens
    churchTreasurerToken = await signJwt(
      {
        userId: 'church-treasurer',
        tenantId: 'tenant-1',
        role: 'treasurer',
        organizationId: 'church-1',
      },
      'test-secret'
    );

    missionTreasurerToken = await signJwt(
      {
        userId: 'mission-treasurer',
        tenantId: 'tenant-1',
        role: 'treasurer',
        organizationId: 'mission-1',
      },
      'test-secret'
    );
  });

  describe('Fund Allocation Seam', () => {
    it('allocates 100% of tithe to parent Mission', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${churchTreasurerToken}`,
        },
        body: JSON.stringify({
          fund_type: 'tithe',
          amount: 100,
          transaction_date: '2026-07-19',
        }),
      }, env);

      expect(res.status).toBe(201);

      // Check allocations
      const allocRes = await app.request('/transactions/allocations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      const allocations = await allocRes.json() as any[];
      expect(allocations).toHaveLength(1);
      expect(allocations[0].fund_type).toBe('tithe');
      expect(allocations[0].amount).toBe(100);
      expect(allocations[0].destination_org_id).toBe('mission-1');
    });

    it('splits offering per Combined Offering Plan', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${churchTreasurerToken}`,
        },
        body: JSON.stringify({
          fund_type: 'offering',
          amount: 100,
          transaction_date: '2026-07-19',
        }),
      }, env);

      expect(res.status).toBe(201);

      // Check allocations (should be 4: local, conference, union, GC)
      const allocRes = await app.request('/transactions/allocations', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      const allocations = await allocRes.json() as any[];
      expect(allocations).toHaveLength(4);
      
      // 50% local (church-1)
      const local = allocations.find(a => a.destination_org_id === 'church-1');
      expect(local?.amount).toBe(50);
      
      // 10% conference (conference-1)
      const conference = allocations.find(a => a.destination_org_id === 'conference-1');
      expect(conference?.amount).toBe(10);
      
      // 20% union (union-1)
      const union = allocations.find(a => a.destination_org_id === 'union-1');
      expect(union?.amount).toBe(20);
      
      // 20% GC (gc-1)
      const gc = allocations.find(a => a.destination_org_id === 'gc-1');
      expect(gc?.amount).toBe(20);
    });
  });

  describe('Remittance Seam', () => {
    it('transfers funds atomically from church to Mission', async () => {
      // First create a tithe transaction (100% goes to Mission)
      await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${churchTreasurerToken}`,
        },
        body: JSON.stringify({
          fund_type: 'tithe',
          amount: 1000,
          transaction_date: '2026-07-19',
        }),
      }, env);

      // Check church balance (should be 0 for tithe, since it all goes to Mission)
      const churchBalRes = await app.request('/balances', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);
      const churchBalances = await churchBalRes.json() as any[];
      const churchTithe = churchBalances.find(b => b.organization_id === 'church-1' && b.fund_type === 'tithe');
      expect(churchTithe?.amount || 0).toBe(0);

      // Check Mission balance (should be 1000)
      const missionBalRes = await app.request('/balances', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);
      const missionBalances = await missionBalRes.json() as any[];
      const missionTithe = missionBalances.find(b => b.organization_id === 'mission-1' && b.fund_type === 'tithe');
      expect(missionTithe?.amount).toBe(1000);
    });

    it('creates remittance record with audit trail', async () => {
      // Create transaction
      await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${churchTreasurerToken}`,
        },
        body: JSON.stringify({
          fund_type: 'tithe',
          amount: 500,
          transaction_date: '2026-07-19',
        }),
      }, env);

      // Create remittance
      const remRes = await app.request('/remittances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${churchTreasurerToken}`,
        },
        body: JSON.stringify({
          destination_org_id: 'mission-1',
          fund_type: 'tithe',
          amount: 500,
          remittance_date: '2026-07-19',
          notes: 'Monthly tithe remittance',
        }),
      }, env);

      expect(remRes.status).toBe(201);
      const remittance = await remRes.json() as any;
      expect(remittance.source_org_id).toBe('church-1');
      expect(remittance.destination_org_id).toBe('mission-1');
      expect(remittance.amount).toBe(500);
      expect(remittance.user_id).toBe('church-treasurer');
    });
  });
});
