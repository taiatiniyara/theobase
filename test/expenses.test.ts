import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { expenseRoutes } from '../src/api/expenses';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Expenses: CRUD + Categories', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let treasurerToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/expenses', expenseRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 'treas@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });

    treasurerToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('POST /expenses', () => {
    it('records an expense', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${treasurerToken}`,
        },
        body: JSON.stringify({
          amount: 250,
          payee: 'Utility Company',
          expense_date: '2025-06-01',
          notes: 'Electricity bill',
        }),
      }, env);

      expect(res.status).toBe(201);
      const expense = await res.json() as { amount: number; payee: string; notes: string };
      expect(expense.amount).toBe(250);
      expect(expense.payee).toBe('Utility Company');
      expect(expense.notes).toBe('Electricity bill');
    });

    it('requires amount, payee, and expense_date', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${treasurerToken}`,
        },
        body: JSON.stringify({ amount: 100 }),
      }, env);

      expect(res.status).toBe(400);
    });

    it('rejects zero or negative amount', async () => {
      const res = await app.request('/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${treasurerToken}`,
        },
        body: JSON.stringify({ amount: -10, payee: 'Test', expense_date: '2025-01-01' }),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /expenses', () => {
    it('lists expenses for the org', async () => {
      const res = await app.request('/expenses', {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const expenses = await res.json() as unknown[];
      expect(Array.isArray(expenses)).toBe(true);
    });
  });

  describe('GET /expenses/categories', () => {
    it('lists expense categories', async () => {
      const res = await app.request('/expenses/categories', {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const categories = await res.json() as unknown[];
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe('GET /expenses/:id', () => {
    it('returns expense by ID', async () => {
      const createRes = await app.request('/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${treasurerToken}`,
        },
        body: JSON.stringify({ amount: 500, payee: 'Supplier', expense_date: '2025-05-01' }),
      }, env);
      const created = await createRes.json() as { id: string };

      const res = await app.request(`/expenses/${created.id}`, {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const expense = await res.json() as { id: string };
      expect(expense.id).toBe(created.id);
    });

    it('returns 404 for non-existent expense', async () => {
      const res = await app.request('/expenses/nonexistent', {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(404);
    });
  });
});
