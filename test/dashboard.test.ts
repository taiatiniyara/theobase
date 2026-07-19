import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { dashboardRoutes } from '../src/api/dashboard';
import { reportRoutes } from '../src/api/reports';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Mission Dashboard + Reports', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let missionTreasurerToken: string;
  let localTreasurerToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/dashboard', dashboardRoutes);
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
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-3', name: 'Nadi', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'mission-treasurer', email: 'mission-treasurer@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'local-treasurer', email: 'local-treasurer@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });

    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1', offeringPlanId: 'plan-1', name: 'COP',
      localPercent: 60, conferencePercent: 0, unionPercent: 20, gcPercent: 20,
    });

    missionTreasurerToken = await signJwt(
      { userId: 'mission-treasurer', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'mission-1' },
      'test-secret'
    );
    localTreasurerToken = await signJwt(
      { userId: 'local-treasurer', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('Access control', () => {
    it('blocks local church treasurer from dashboard', async () => {
      const res = await app.request('/dashboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${localTreasurerToken}` },
      }, env);
      expect(res.status).toBe(403);
    });

    it('allows mission treasurer to access dashboard', async () => {
      const res = await app.request('/dashboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);
      expect(res.status).toBe(200);
    });

    it('blocks unauthenticated requests', async () => {
      const res = await app.request('/dashboard', { method: 'GET' }, env);
      expect(res.status).toBe(401);
    });
  });

  describe('Dashboard overview', () => {
    it('lists all churches with current month totals', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      const res = await app.request('/dashboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as any[];
      expect(data.length).toBe(3);

      data.forEach((church: any) => {
        expect(church).toHaveProperty('church_id');
        expect(church).toHaveProperty('church_name');
        expect(church).toHaveProperty('current_month_tithe');
        expect(church).toHaveProperty('current_month_offering');
        expect(church).toHaveProperty('submission_status');
        expect(church.submission_status).toBe('late');
      });
    });

    it('shows submitted status for churches with transactions', async () => {
      const today = new Date().toISOString().split('T')[0];
      await env.DB.prepare(
        `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind('txn-1', 'tenant-1', 'church-1', null, 'tithe', 1000, today, new Date().toISOString(), new Date().toISOString())
        .run();

      const res = await app.request('/dashboard', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as any[];

      const submittedChurch = data.find((c: any) => c.church_id === 'church-1');
      expect(submittedChurch?.submission_status).toBe('submitted');
      expect(submittedChurch?.current_month_tithe).toBe(1000);
    });
  });

  describe('Monthly remittance report', () => {
    it('returns report with totals by church and fund type', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');

      await env.DB.prepare(
        `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind('txn-1', 'tenant-1', 'church-1', null, 'tithe', 500, `${year}-${month}-15`, new Date().toISOString(), new Date().toISOString())
        .run();

      await env.DB.prepare(
        `INSERT INTO transactions (id, tenant_id, organization_id, member_id, fund_type, amount, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind('txn-2', 'tenant-1', 'church-2', null, 'offering', 300, `${year}-${month}-10`, new Date().toISOString(), new Date().toISOString())
        .run();

      const res = await app.request('/reports/remittance', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const report = await res.json() as any;
      expect(report.mission).toBe('Fiji Mission');
      expect(report.rows.length).toBe(3);

      const church1 = report.rows.find((r: any) => r.church_id === 'church-1');
      expect(church1.tithe).toBe(500);
      expect(church1.offering).toBe(0);

      const church2 = report.rows.find((r: any) => r.church_id === 'church-2');
      expect(church2.offering).toBe(300);

      expect(report.totals.tithe).toBe(500);
      expect(report.totals.offering).toBe(300);
      expect(report.totals.total).toBe(800);
    });

    it('returns CSV format when format=csv', async () => {
      const res = await app.request('/reports/remittance?format=csv', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionTreasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
      expect(res.headers.get('Content-Disposition')).toMatch(/attachment;/);
      const body = await res.text();
      expect(body).toContain('Church Name');
      expect(body).toContain('Suva Central');
    });
  });
});
