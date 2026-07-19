import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { syncRoutes } from '../src/api/sync';
import { adminRoutes } from '../src/api/admin';
import { reportRoutes } from '../src/api/reports';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';
import { sendMonthlyReminders } from '../src/lib/reminders';

describe('Polish: Excel Export, Sync, Admin Health', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let missionToken: string;
  let adminToken: string;
  let churchToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/sync', syncRoutes);
    app.route('/admin', adminRoutes);
    app.route('/reports', reportRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church', parentId: 'mission-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-2', name: 'Lautoka', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'mission-treasurer', email: 'mission-t@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'admin-1', email: 'admin@test.com',
      password: 'pass', role: 'administrator', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'church-treasurer', email: 'church-t@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'member-1', email: 'member@test.com',
      password: 'pass', role: 'pastor', organizationId: 'church-1',
    });

    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1', offeringPlanId: 'plan-1', name: 'COP',
      localPercent: 60, conferencePercent: 0, unionPercent: 20, gcPercent: 20,
    });

    missionToken = await signJwt(
      { userId: 'mission-treasurer', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'mission-1' },
      'test-secret'
    );
    adminToken = await signJwt(
      { userId: 'admin-1', tenantId: 'tenant-1', role: 'administrator', organizationId: 'mission-1' },
      'test-secret'
    );
    churchToken = await signJwt(
      { userId: 'church-treasurer', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('Excel Export', () => {
    it('returns XLSX format for remittance report', async () => {
      const res = await app.request('/reports/remittance?format=xlsx', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('spreadsheet');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment;.*\.xlsx"/);
    });

    it('includes church names and totals in XLSX', async () => {
      const res = await app.request('/reports/remittance?format=xlsx', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);

      const body = await res.text();
      expect(body).toContain('Suva Central');
      expect(body).toContain('Lautoka');
      expect(body).toContain('Church Name');
      expect(body).toContain('Tithe');
      expect(body).toContain('Offering');
      expect(body).toContain('Total');
    });
  });

  describe('Sync Endpoint', () => {
    it('accepts a sync payload and creates transactions', async () => {
      const res = await app.request('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
        body: JSON.stringify({
          transactions: [
            { fund_type: 'tithe', amount: 1000, transaction_date: '2026-07-19', member_id: 'member-1' },
            { fund_type: 'offering', amount: 500, transaction_date: '2026-07-19', member_id: 'member-1' },
          ],
        }),
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as any;
      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
      expect(result.total_processed).toBe(2);
      expect(result.synced_at).toBeTruthy();
      expect(result.transactions).toHaveLength(2);
    });

    it('validates sync payload and reports errors', async () => {
      const res = await app.request('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
        body: JSON.stringify({
          transactions: [
            { fund_type: 'tithe', amount: -100, transaction_date: '2026-07-19', member_id: 'member-1' },
            { fund_type: 'invalid', amount: 100, transaction_date: '2026-07-19' },
          ],
        }),
      }, env);

      expect(res.status).toBe(207);
      const result = await res.json() as any;
      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(2);
    });

    it('rejects empty transactions array', async () => {
      const res = await app.request('/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
        body: JSON.stringify({ transactions: [] }),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe('Admin Health Dashboard', () => {
    it('blocks non-admin users', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);
      expect(res.status).toBe(403);
    });

    it('allows administrator access', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);
      expect(res.status).toBe(200);
    });

    it('returns system health stats', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const health = await res.json() as any;
      expect(health.status).toBe('ok');
      expect(health.organizations).toBeGreaterThanOrEqual(3);
      expect(health.members).toBeGreaterThanOrEqual(4);
      expect(health.transactions).toBeGreaterThanOrEqual(0);
      expect(health.checked_at).toBeTruthy();
    });
  });

  describe('Email Reminders', () => {
    let reminderEnv: ReturnType<typeof createMockEnv>;

    beforeEach(async () => {
      reminderEnv = createMockEnv();
      await seedTestOrganization(reminderEnv, {
        tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
      });
      await seedTestOrganization(reminderEnv, {
        tenantId: 'tenant-1', organizationId: 'church-a', name: 'Church A', type: 'local_church', parentId: 'mission-1',
      });
      await seedTestOrganization(reminderEnv, {
        tenantId: 'tenant-1', organizationId: 'church-b', name: 'Church B', type: 'local_church', parentId: 'mission-1',
      });
      // Church A treasurer (has submitted)
      await seedTestMember(reminderEnv, {
        tenantId: 'tenant-1', memberId: 'treas-a', email: 'treas-a@test.com',
        password: 'pass', role: 'treasurer', organizationId: 'church-a',
      });
      // Church B treasurer (has NOT submitted)
      await seedTestMember(reminderEnv, {
        tenantId: 'tenant-1', memberId: 'treas-b', email: 'treas-b@test.com',
        password: 'pass', role: 'treasurer', organizationId: 'church-b',
      });
    });

    it('sends reminders to treasurers who have not submitted this month', async () => {
      const today = new Date().toISOString().split('T')[0];

      await reminderEnv.DB.prepare(
        `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind('txn-sub', 'tenant-1', 'church-a', null, 'tithe', 500, today, new Date().toISOString(), new Date().toISOString())
        .run();

      const result = await sendMonthlyReminders(reminderEnv.DB, reminderEnv.EMAIL, reminderEnv as any, 'tenant-1');

      expect(result.totalChurches).toBe(2);
      expect(result.skippedSubmitted).toBe(1);
      expect(result.remindersSent).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('manual trigger endpoint sends reminders (admin only)', async () => {
      const res = await app.request('/admin/send-reminders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.totalChurches).toBeGreaterThanOrEqual(1);
    });

    it('blocks non-admin from manual trigger', async () => {
      const res = await app.request('/admin/send-reminders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);

      expect(res.status).toBe(403);
    });
  });
});
