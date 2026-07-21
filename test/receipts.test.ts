import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { reportRoutes } from '../src/api/reports';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Contribution Receipts', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let missionToken: string;
  let churchToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/reports', reportRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'mission-admin', email: 'ma@test.com',
      password: 'pass', role: 'mission_admin', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 't1@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'member-1', email: 'm1@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'member-2', email: 'm2@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });

    missionToken = await signJwt(
      { userId: 'mission-admin', tenantId: 'tenant-1', role: 'mission_admin', organizationId: 'mission-1' },
      'test-secret'
    );
    churchToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  function insertTransaction(id: string, memberId: string, fundType: string, amount: number, date: string, subCategory?: string) {
    return env.DB.prepare(
      `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, offering_sub_category, amount, transaction_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, 'tenant-1', 'church-1', memberId, fundType, subCategory || null, amount, date, null, '2026-07-19', '2026-07-19')
      .run();
  }

  describe('Single member receipt', () => {
    it('returns receipt for a single member with totals', async () => {
      await insertTransaction('txn-1', 'member-1', 'tithe', 1000, '2026-07-19');
      await insertTransaction('txn-2', 'member-1', 'offering', 200, '2026-07-19', 'sabbath_school');

      const res = await app.request('/reports/receipts/member-1?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res.status).toBe(200);
      const receipt = await res.json() as any;
      expect(receipt.member_name).toBeTruthy();
      expect(receipt.year).toBe('2026');
      expect(receipt.church_name).toBeTruthy();
      expect(receipt.transactions).toHaveLength(2);
      expect(typeof receipt.totals_by_fund).toBe('object');
    });

    it('returns 404 for non-existent member', async () => {
      const res = await app.request('/reports/receipts/nonexistent?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe('Batch member receipts', () => {
    it('returns receipts for all members with transactions', async () => {
      await insertTransaction('txn-1', 'member-1', 'tithe', 1000, '2026-07-19');
      await insertTransaction('txn-2', 'member-2', 'offering', 500, '2026-07-19');

      const res = await app.request('/reports/receipts?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res.status).toBe(200);
      const batch = await res.json() as any;
      expect(Array.isArray(batch.receipts)).toBe(true);
      expect(batch.receipts.length).toBeGreaterThanOrEqual(2);
      expect(batch.year).toBe('2026');
      expect(batch.generated_at).toBeTruthy();
    });

    it('scopes receipts by year', async () => {
      await insertTransaction('txn-1', 'member-1', 'tithe', 1000, '2026-07-19');
      await insertTransaction('txn-2', 'member-1', 'offering', 500, '2025-01-15');

      const res2026 = await app.request('/reports/receipts?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res2026.status).toBe(200);
      const batch2026 = await res2026.json() as any;
      const member1_2026 = batch2026.receipts.find((r: any) => r.member_id === 'member-1');
      expect(member1_2026).toBeTruthy();

      const res2025 = await app.request('/reports/receipts?year=2025', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res2025.status).toBe(200);
      const batch2025 = await res2025.json() as any;
      const member1_2025 = batch2025.receipts.find((r: any) => r.member_id === 'member-1');
      expect(member1_2025).toBeTruthy();
    });

    it('breaks down totals by fund type and offering sub-category', async () => {
      await insertTransaction('txn-1', 'member-1', 'tithe', 1000, '2026-07-19');
      await insertTransaction('txn-2', 'member-1', 'offering', 200, '2026-07-19', 'sabbath_school');
      await insertTransaction('txn-3', 'member-1', 'restricted', 300, '2026-07-19');

      const res = await app.request('/reports/receipts/member-1?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res.status).toBe(200);
      const receipt = await res.json() as any;
      expect(receipt.totals_by_fund).toBeDefined();
      expect(Object.keys(receipt.totals_by_fund).length).toBeGreaterThanOrEqual(2);
      expect(receipt.transactions).toHaveLength(3);
    });

    it('returns empty receipts array when no transactions exist', async () => {
      const res = await app.request('/reports/receipts?year=2026', {
        method: 'GET',
        headers: { Authorization: `Bearer ${churchToken}` },
      }, env);

      expect(res.status).toBe(200);
      const batch = await res.json() as any;
      expect(batch.receipts).toEqual([]);
    });

    it('requires authentication', async () => {
      const res = await app.request('/reports/receipts?year=2026', {
        method: 'GET',
      }, env);

      expect(res.status).toBe(401);
    });
  });
});
