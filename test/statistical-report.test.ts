import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { reportRoutes } from '../src/api/reports';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Annual Statistical Report', () => {
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
      tenantId: 'tenant-1', memberId: 'clerk-1', email: 'clerk@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });

    missionToken = await signJwt(
      { userId: 'mission-admin', tenantId: 'tenant-1', role: 'mission_admin', organizationId: 'mission-1' },
      'test-secret'
    );
    churchToken = await signJwt(
      { userId: 'clerk-1', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-1' },
      'test-secret'
    );
  });

  it('returns beginning/end membership counts for the year', async () => {
    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.year).toBe('2026');
    expect(typeof report.beginning_count).toBe('number');
    expect(typeof report.end_count).toBe('number');
    expect(typeof report.accessions).toBe('number');
    expect(typeof report.transfers_in).toBe('number');
    expect(typeof report.transfers_out).toBe('number');
    expect(typeof report.losses).toBe('number');
    expect(typeof report.net_change).toBe('number');
  });

  it('uses current year when year param is omitted', async () => {
    const res = await app.request('/reports/statistical', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    const currentYear = String(new Date().getFullYear());
    expect(report.year).toBe(currentYear);
  });

  it('rejects non-mission-level users', async () => {
    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${churchToken}` },
    }, env);

    expect(res.status).toBe(403);
  });

  it('includes accessions breakdown: baptisms and professions of faith', async () => {
    const today = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, baptism_date, membership_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind('mem-bapt', 'tenant-1', 'church-1', 'New', 'Member', '2026-03-15', today, today)
      .run();

    await env.DB.prepare(
      `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, profession_of_faith_date, membership_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
      .bind('mem-pof', 'tenant-1', 'church-1', 'Another', 'One', '2026-05-01', today, today)
      .run();

    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.accessions).toBeGreaterThanOrEqual(2);
    expect(report.baptisms).toBeGreaterThanOrEqual(1);
    expect(report.professions_of_faith).toBeGreaterThanOrEqual(1);
  });

  it('includes losses: deceased and removed members', async () => {
    const today = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, membership_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'deceased', ?, ?)`
    )
      .bind('mem-dec', 'tenant-1', 'church-1', 'Dead', 'Member', today, today)
      .run();

    await env.DB.prepare(
      `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, membership_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'removed', ?, ?)`
    )
      .bind('mem-rem', 'tenant-1', 'church-1', 'Gone', 'One', today, today)
      .run();

    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.losses).toBeGreaterThanOrEqual(2);
    expect(report.deaths).toBeGreaterThanOrEqual(1);
    expect(report.removed).toBeGreaterThanOrEqual(1);
  });

  it('includes transfers in and out', async () => {
    const today = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO member_transfers (id, tenant_id, member_id, sending_org_id, receiving_org_id, status, initiated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?, ?)`
    )
      .bind('tr-in', 'tenant-1', 'clerk-1', 'mission-1', 'church-1', 'clerk-1', today, today)
      .run();

    await env.DB.prepare(
      `INSERT INTO member_transfers (id, tenant_id, member_id, sending_org_id, receiving_org_id, status, initiated_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?, ?)`
    )
      .bind('tr-out', 'tenant-1', 'mission-admin', 'church-1', 'mission-1', 'mission-admin', today, today)
      .run();

    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.transfers_in).toBeGreaterThanOrEqual(1);
    expect(report.transfers_out).toBeGreaterThanOrEqual(1);
  });

  it('calculates net change correctly', async () => {
    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.net_change).toBe(
      report.accessions + report.transfers_in - report.transfers_out - report.losses
    );
  });

  it('exports statistical report as CSV', async () => {
    const res = await app.request('/reports/statistical?year=2026&format=csv', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('csv');
    expect(res.headers.get('Content-Disposition')).toMatch(/attachment;.*\.csv/);
    const csv = await res.text();
    expect(csv).toContain('Baptisms');
    expect(csv).toContain('Net Change');
  });

  it('statistical report JSON has no other_accessions field', async () => {
    const res = await app.request('/reports/statistical?year=2026', {
      method: 'GET',
      headers: { Authorization: `Bearer ${missionToken}` },
    }, env);

    expect(res.status).toBe(200);
    const report = await res.json() as any;
    expect(report.other_accessions).toBeUndefined();
  });
});
