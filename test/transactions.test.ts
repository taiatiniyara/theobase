import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { transactionRoutes } from '../src/api/transactions';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Financial Pipeline Seam', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let authToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/transactions', transactionRoutes);

    // Seed test data
    await seedTestOrganization(env, {
      tenantId: 'tenant-1',
      organizationId: 'church-1',
      name: 'Test Church',
      type: 'local_church',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1',
      memberId: 'member-1',
      email: 'treasurer@test.com',
      password: 'password123',
      role: 'treasurer',
      organizationId: 'church-1',
    });

    // Generate auth token
    authToken = await signJwt(
      {
        userId: 'member-1',
        tenantId: 'tenant-1',
        role: 'treasurer',
        organizationId: 'church-1',
      },
      'test-secret'
    );
  });

  describe('POST /transactions - Transaction Creation', () => {
    it('creates a tithe transaction linked to a member', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          member_id: 'member-1',
          fund_type: 'tithe',
          amount: 100,
          transaction_date: '2026-07-19',
          notes: 'Weekly tithe',
        }),
      }, env);

      expect(res.status).toBe(201);
      const data = await res.json() as { id: string; fund_type: string; amount: number };
      expect(data.id).toBeDefined();
      expect(data.fund_type).toBe('tithe');
      expect(data.amount).toBe(100);
    });

    it('creates an offering transaction linked to a member', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          member_id: 'member-1',
          fund_type: 'offering',
          amount: 50,
          transaction_date: '2026-07-19',
        }),
      }, env);

      expect(res.status).toBe(201);
      const data = await res.json() as { fund_type: string; amount: number };
      expect(data.fund_type).toBe('offering');
      expect(data.amount).toBe(50);
    });

    it('rejects transaction with invalid amount', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          member_id: 'member-1',
          fund_type: 'tithe',
          amount: 0,
          transaction_date: '2026-07-19',
        }),
      }, env);

      expect(res.status).toBe(400);
    });

    it('rejects transaction with non-existent member', async () => {
      const res = await app.request('/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          member_id: 'non-existent',
          fund_type: 'tithe',
          amount: 100,
          transaction_date: '2026-07-19',
        }),
      }, env);

      expect(res.status).toBe(400);
      const data = await res.json() as { error: string };
      expect(data.error).toContain('Member not found');
    });
  });

  describe('POST /transactions/batch - Batch Transaction Creation', () => {
    it('creates multiple transactions without member linkage', async () => {
      const res = await app.request('/transactions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transactions: [
            {
              fund_type: 'offering',
              amount: 20,
              transaction_date: '2026-07-19',
              notes: 'Visitor 1',
            },
            {
              fund_type: 'offering',
              amount: 30,
              transaction_date: '2026-07-19',
              notes: 'Visitor 2',
            },
          ],
        }),
      }, env);

      expect(res.status).toBe(201);
      const data = await res.json() as { count: number; transactions: any[] };
      expect(data.count).toBe(2);
      expect(data.transactions).toHaveLength(2);
    });

    it('rejects batch with invalid transaction', async () => {
      const res = await app.request('/transactions/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          transactions: [
            {
              fund_type: 'offering',
              amount: 20,
              transaction_date: '2026-07-19',
            },
            {
              fund_type: 'offering',
              amount: 0, // Invalid
              transaction_date: '2026-07-19',
            },
          ],
        }),
      }, env);

      expect(res.status).toBe(400);
    });
  });
});
