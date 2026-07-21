import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { adminRoutes } from '../src/api/admin';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';
import { sendMonthlyReminders } from '../src/lib/reminders';

describe('Admin', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let adminToken: string;
  let missionToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/admin', adminRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'admin-1', email: 'admin@test.com',
      password: 'pass', role: 'super_admin', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'mission-treasurer', email: 'mt@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'mission-1',
    });

    adminToken = await signJwt(
      { userId: 'admin-1', tenantId: 'tenant-1', role: 'super_admin', organizationId: 'mission-1' },
      'test-secret'
    );
    missionToken = await signJwt(
      { userId: 'mission-treasurer', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'mission-1' },
      'test-secret'
    );
  });

  describe('Health Dashboard', () => {
    it('blocks non-admin users', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);
      expect(res.status).toBe(403);
    });

    it('allows super_admin access', async () => {
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
      expect(health.checked_at).toBeTruthy();
      expect(health.organizations).toBeGreaterThanOrEqual(2);
      expect(health.churches).toBeGreaterThanOrEqual(1);
      expect(health.members).toBeGreaterThanOrEqual(2);
      expect(health.transactions).toBeGreaterThanOrEqual(0);
      expect(health.totals).toBeDefined();
      expect(health.totals.tithe).toBe(0);
      expect(health.totals.offering).toBe(0);
      expect(health.totals.restricted).toBe(0);
    });

    it('includes storage usage metric', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const health = await res.json() as any;
      expect(health.storage).toBeDefined();
      expect(typeof health.storage.total_rows).toBe('number');
      expect(typeof health.storage.estimated_bytes).toBe('number');
      expect(health.storage.estimated_bytes).toBeGreaterThan(0);
    });

    it('includes expense and audit entry counts', async () => {
      const res = await app.request('/admin/health', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const health = await res.json() as any;
      expect(typeof health.expenses).toBe('number');
      expect(typeof health.audit_entries).toBe('number');
    });
  });

  describe('Signup Approval Queue', () => {
    beforeEach(async () => {
      await env.DB.prepare(
        `INSERT INTO tenant_signups (id, church_name, church_type, parent_mission_id, clerk_name, clerk_email, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind('su-1', 'Nadi Church', 'local_church', 'mission-1', 'Clerk Nadi', 'clerk@nadi.test', 'pending', new Date().toISOString(), new Date().toISOString())
        .run();
    });

    it('lists pending signups', async () => {
      const res = await app.request('/admin/signups?status=pending', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const signups = await res.json() as any;
      expect(Array.isArray(signups)).toBe(true);
      expect(signups.length).toBeGreaterThanOrEqual(1);
      expect(signups[0].church_name).toBe('Nadi Church');
      expect(signups[0].status).toBe('pending');
    });

    it('blocks non-admin from viewing signups', async () => {
      const res = await app.request('/admin/signups?status=pending', {
        method: 'GET',
        headers: { Authorization: `Bearer ${missionToken}` },
      }, env);

      expect(res.status).toBe(403);
    });

    it('approves a signup and creates organization + member', async () => {
      const res = await app.request('/admin/signups/su-1/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as any;
      expect(result.status).toBe('approved');
      expect(result.organization_id).toBeTruthy();
      expect(result.member_id).toBeTruthy();
      expect(result.church_name).toBe('Nadi Church');
    });

    it('declines a signup with reason', async () => {
      const res = await app.request('/admin/signups/su-1/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ reason: 'Duplicate church in this district' }),
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as any;
      expect(result.status).toBe('declined');
    });

    it('rejects approval of already-processed signup', async () => {
      await app.request('/admin/signups/su-1/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      const res = await app.request('/admin/signups/su-1/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe('Email Reminders', () => {
    it('manual trigger endpoint sends reminders (admin only)', async () => {
      const res = await app.request('/admin/send-reminders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json() as any;
      expect(data.success).toBe(true);
      expect(data.totalChurches).toBeGreaterThanOrEqual(0);
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
