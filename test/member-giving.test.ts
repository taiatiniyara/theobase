import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { transactionRoutes } from '../src/api/transactions';
import { memberRoutes } from '../src/api/members';
import { auditRoutes } from '../src/api/audit';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Member Giving + Audit Trail', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let churchTreasurerToken: string;
  let otherChurchTreasurerToken: string;
  let memberToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/transactions', transactionRoutes);
    app.route('/members', memberRoutes);
    app.route('/audit', auditRoutes);

    // Seed hierarchy
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Church A', type: 'local_church', parentId: 'mission-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-2', name: 'Church B', type: 'local_church', parentId: 'mission-1',
    });

    // Seed members
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 'treasurer-a@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-2', email: 'treasurer-b@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-2',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'giver-1', email: 'giver@test.com',
      password: 'pass', role: 'pastor', organizationId: 'church-1',
    });

    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1', offeringPlanId: 'plan-1', name: 'COP',
      localPercent: 60, conferencePercent: 0, unionPercent: 20, gcPercent: 20,
    });

    churchTreasurerToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
    otherChurchTreasurerToken = await signJwt(
      { userId: 'treasurer-2', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-2' },
      'test-secret'
    );
    memberToken = await signJwt(
      { userId: 'giver-1', tenantId: 'tenant-1', role: 'pastor', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('Member Giving History', () => {
    it('returns giving totals by year and fund type', async () => {
      // Create tithe and offering transactions for giver-1
      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 100, transaction_date: '2026-01-15' }),
      }, env);

      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'offering', amount: 50, transaction_date: '2026-03-10' }),
      }, env);

      const res = await app.request('/members/giver-1/giving-history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const history = await res.json() as any[];
      expect(history.length).toBeGreaterThanOrEqual(2);

      const tithe = history.find(h => h.fund_type === 'tithe');
      expect(tithe?.total).toBe(100);

      const offering = history.find(h => h.fund_type === 'offering');
      expect(offering?.total).toBe(50);
    });

    it('blocks cross-church access (treasurer B cannot see church A members)', async () => {
      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 100, transaction_date: '2026-01-15' }),
      }, env);

      const res = await app.request('/members/giver-1/giving-history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${otherChurchTreasurerToken}` },
      }, env);

      expect(res.status).toBe(403);
    });
  });

  describe('Audit Trail', () => {
    it('logs transaction creation', async () => {
      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 200, transaction_date: '2026-07-19' }),
      }, env);

      const res = await app.request('/audit?entity_type=transaction', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const logs = await res.json() as any[];
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].entity_type).toBe('transaction');
      expect(logs[0].action).toBe('create');
      expect(logs[0].user_id).toBe('treasurer-1');
    });

    it('supports filtering by date range', async () => {
      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 100, transaction_date: '2026-01-15' }),
      }, env);

      const res = await app.request('/audit?from=2026-01-01&to=2026-12-31', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const logs = await res.json() as any[];
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it('logs transaction edits with before/after values', async () => {
      const createRes = await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 100, transaction_date: '2026-07-19' }),
      }, env);

      const created = await createRes.json() as any;

      await app.request(`/transactions/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ amount: 150, notes: 'Updated amount' }),
      }, env);

      const res = await app.request('/audit?entity_type=transaction&action=update', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const logs = await res.json() as any[];
      expect(logs.length).toBeGreaterThanOrEqual(1);
      const updateLog = logs.find((l: any) => l.action === 'update');
      expect(updateLog).toBeDefined();
      const beforeValues = JSON.parse(updateLog.before_values);
      expect(beforeValues.amount).toBe(100);
      const afterValues = JSON.parse(updateLog.after_values);
      expect(afterValues.amount).toBe(150);
    });
  });

  describe('Member Self-Service', () => {
    it('allows member to view own giving history', async () => {
      await app.request('/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchTreasurerToken}` },
        body: JSON.stringify({ member_id: 'giver-1', fund_type: 'tithe', amount: 100, transaction_date: '2026-07-19' }),
      }, env);

      const res = await app.request('/members/me/giving-history', {
        method: 'GET',
        headers: { Authorization: `Bearer ${memberToken}` },
      }, env);

      expect(res.status).toBe(200);
      const history = await res.json() as any[];
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].member_id).toBe('giver-1');
    });

    it('returns member profile for self', async () => {
      const res = await app.request('/members/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${memberToken}` },
      }, env);

      expect(res.status).toBe(200);
      const profile = await res.json() as any;
      expect(profile.email).toBe('giver@test.com');
      expect(profile.role).toBe('pastor');
    });
  });
});
