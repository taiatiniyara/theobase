import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { syncRoutes } from '../src/api/sync';
import { createMockEnv, seedTestMember, seedTestOrganization, seedTestOfferingPlan } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Offline Sync', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let churchToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/sync', syncRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 't1@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'member-1', email: 'm1@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });

    await seedTestOfferingPlan(env, {
      tenantId: 'tenant-1', offeringPlanId: 'plan-1', name: 'COP',
      localPercent: 60, conferencePercent: 0, unionPercent: 20, gcPercent: 20,
    });

    churchToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

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

  it('rejects invalid date format', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'tithe', amount: 100, transaction_date: 'not-a-date', member_id: 'member-1' },
        ],
      }),
    }, env);

    expect(res.status).toBe(207);
    const result = await res.json() as any;
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0].error).toContain('date');
  });

  it('rejects unknown member_id', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'tithe', amount: 100, transaction_date: '2026-07-19', member_id: 'unknown-member' },
        ],
      }),
    }, env);

    expect(res.status).toBe(207);
    const result = await res.json() as any;
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors![0].error).toContain('Member');
  });

  it('handles offering_sub_category in sync payload', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'offering', offering_sub_category: 'sabbath_school', amount: 200, transaction_date: '2026-07-19', member_id: 'member-1' },
        ],
      }),
    }, env);

    expect(res.status).toBe(200);
    const result = await res.json() as any;
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.transactions[0].offering_sub_category).toBe('sabbath_school');
  });

  it('processes mixed valid and invalid transactions in one payload', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'tithe', amount: 1000, transaction_date: '2026-07-19', member_id: 'member-1' },
          { fund_type: 'tithe', amount: -500, transaction_date: '2026-07-19' },
          { fund_type: 'restricted', amount: 300, transaction_date: '2026-07-19', member_id: 'member-1' },
        ],
      }),
    }, env);

    expect(res.status).toBe(207);
    const result = await res.json() as any;
    expect(result.created).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.total_processed).toBe(3);
  });

  it('requires authentication', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'tithe', amount: 100, transaction_date: '2026-07-19' },
        ],
      }),
    }, env);

    expect(res.status).toBe(401);
  });

  it('allows transactions without member_id', async () => {
    const res = await app.request('/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${churchToken}` },
      body: JSON.stringify({
        transactions: [
          { fund_type: 'tithe', amount: 250, transaction_date: '2026-07-19' },
        ],
      }),
    }, env);

    expect(res.status).toBe(200);
    const result = await res.json() as any;
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.transactions[0].member_id).toBeNull();
  });
});
