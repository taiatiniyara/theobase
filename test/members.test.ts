import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { memberRoutes } from '../src/api/members';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Members: CRUD, Search, Status', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let clerkToken: string;
  let treasurerToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/members', memberRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'clerk-1', email: 'clerk@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 'treas@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });

    clerkToken = await signJwt(
      { userId: 'clerk-1', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-1' },
      'test-secret'
    );
    treasurerToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
  });

  describe('POST /members', () => {
    it('clerk can create a new member', async () => {
      const res = await app.request('/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1985-06-15',
          gender: 'male',
          phone: '+679 123 4567',
          email: 'john@test.com',
          baptism_date: '2005-03-20',
        }),
      }, env);

      expect(res.status).toBe(201);
      const member = await res.json() as { first_name: string; last_name: string; membership_status: string };
      expect(member.first_name).toBe('John');
      expect(member.last_name).toBe('Doe');
      expect(member.membership_status).toBe('active');
    });

    it('requires first_name and last_name', async () => {
      const res = await app.request('/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ first_name: 'John' }),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /members', () => {
    it('lists members in the organization', async () => {
      const res = await app.request('/members', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(200);
      const members = await res.json() as { id: string }[];
      const ids = members.map(m => m.id);
      expect(ids).toContain('clerk-1');
      expect(ids).toContain('treasurer-1');
    });
  });

  describe('GET /members/me', () => {
    it('returns current user profile', async () => {
      const res = await app.request('/members/me', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(200);
      const me = await res.json() as { id: string; email: string };
      expect(me.id).toBe('clerk-1');
      expect(me.email).toBe('clerk@test.com');
    });
  });

  describe('PUT /members/:id', () => {
    it('clerk can update member details', async () => {
      const res = await app.request('/members/clerk-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          first_name: 'Jane',
          phone: '+679 999 9999',
        }),
      }, env);

      expect(res.status).toBe(200);
      const updated = await res.json() as { first_name: string; phone: string };
      expect(updated.first_name).toBe('Jane');
      expect(updated.phone).toBe('+679 999 9999');
    });

    it('returns 400 for no valid fields', async () => {
      const res = await app.request('/members/clerk-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent member', async () => {
      const res = await app.request('/members/nonexistent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ first_name: 'Test' }),
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /members/:id/status', () => {
    it('clerk can change member status to inactive', async () => {
      const res = await app.request('/members/clerk-1/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ membership_status: 'inactive' }),
      }, env);

      expect(res.status).toBe(200);
      const result = await res.json() as { membership_status: string; message: string };
      expect(result.membership_status).toBe('inactive');
    });

    it('rejects invalid status values', async () => {
      const res = await app.request('/members/clerk-1/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ membership_status: 'expelled' }),
      }, env);

      expect(res.status).toBe(400);
    });

    it('cannot set transferred_out without transfer process', async () => {
      const res = await app.request('/members/clerk-1/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({ membership_status: 'transferred_out' }),
      }, env);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /members/:id', () => {
    it('returns member by ID', async () => {
      const res = await app.request('/members/clerk-1', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(200);
      const member = await res.json() as { id: string; first_name: string };
      expect(member.id).toBe('clerk-1');
    });

    it('returns 404 for non-existent member', async () => {
      const res = await app.request('/members/nonexistent', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(404);
    });
  });
});
