import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { transferRoutes } from '../src/api/transfers';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Member Transfers: State Machine', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let clerkAToken: string;
  let clerkBToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/transfers', transferRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-a', name: 'Suva Central', type: 'local_church',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-b', name: 'Lautoka', type: 'local_church',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'clerk-a', email: 'a@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-a',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'clerk-b', email: 'b@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-b',
    });

    clerkAToken = await signJwt(
      { userId: 'clerk-a', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-a' },
      'test-secret'
    );
    clerkBToken = await signJwt(
      { userId: 'clerk-b', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-b' },
      'test-secret'
    );
  });

  describe('POST /transfers', () => {
    it('initiates a member transfer', async () => {
      const res = await app.request('/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkAToken}`,
        },
        body: JSON.stringify({
          member_id: 'clerk-a',
          receiving_org_id: 'church-b',
        }),
      }, env);

      expect(res.status).toBe(201);
      const transfer = await res.json() as { status: string; member_id: string; sending_org_id: string; receiving_org_id: string };
      expect(transfer.status).toBe('pending_sending_approval');
      expect(transfer.member_id).toBe('clerk-a');
      expect(transfer.sending_org_id).toBe('church-a');
      expect(transfer.receiving_org_id).toBe('church-b');
    });

    it('rejects transfer to same church', async () => {
      const res = await app.request('/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkAToken}`,
        },
        body: JSON.stringify({
          member_id: 'clerk-a',
          receiving_org_id: 'church-a',
        }),
      }, env);

      expect(res.status).toBe(400);
    });

    it('requires member_id and receiving_org_id', async () => {
      const res = await app.request('/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkAToken}`,
        },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe('Transfer workflow', () => {
    let transferId: string;

    beforeEach(async () => {
      const res = await app.request('/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkAToken}`,
        },
        body: JSON.stringify({
          member_id: 'clerk-a',
          receiving_org_id: 'church-b',
        }),
      }, env);
      const transfer = await res.json() as { id: string };
      transferId = transfer.id;
    });

    it('sending church approves sending (board vote)', async () => {
      const res = await app.request(`/transfers/${transferId}/approve-sending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clerkAToken}` },
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as { status: string };
      expect(result.status).toBe('pending_receiving_approval');
    });

    it('receiving church accepts transfer', async () => {
      await app.request(`/transfers/${transferId}/approve-sending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clerkAToken}` },
      }, env);

      const res = await app.request(`/transfers/${transferId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clerkBToken}` },
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as { status: string };
      expect(result.status).toBe('accepted');
    });

    it('receiving church rejects transfer', async () => {
      await app.request(`/transfers/${transferId}/approve-sending`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clerkAToken}` },
      }, env);

      const res = await app.request(`/transfers/${transferId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkBToken}`,
        },
        body: JSON.stringify({ reason: 'Church is at capacity' }),
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as { status: string };
      expect(result.status).toBe('rejected');
    });
  });

  describe('GET /transfers', () => {
    it('lists transfers for the org', async () => {
      const res = await app.request('/transfers', {
        headers: { Authorization: `Bearer ${clerkAToken}` },
      }, env);

      expect(res.status).toBe(200);
      const transfers = await res.json() as unknown[];
      expect(Array.isArray(transfers)).toBe(true);
    });
  });
});
