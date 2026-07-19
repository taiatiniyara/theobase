import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { organizationRoutes } from '../src/api/organizations';
import { createMockEnv, seedTestMember, seedTestOrganization } from './helpers';
import { signJwt } from '../src/lib/crypto';

describe('Organizations: Hierarchy CRUD + Visibility', () => {
  let app: Hono;
  let env: ReturnType<typeof createMockEnv>;
  let missionAdminToken: string;
  let clerkToken: string;
  let treasurerToken: string;
  let pastorToken: string;

  beforeEach(async () => {
    env = createMockEnv();
    app = new Hono();
    app.route('/organizations', organizationRoutes);

    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'gc-1', name: 'General Conference', type: 'general_conference',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'div-1', name: 'South Pacific Division', type: 'division', parentId: 'gc-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'union-1', name: 'TPUM', type: 'union', parentId: 'div-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'mission-1', name: 'Fiji Mission', type: 'mission', parentId: 'union-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'district-1', name: 'Suva District', type: 'district', parentId: 'mission-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-1', name: 'Suva Central', type: 'local_church', parentId: 'district-1',
    });
    await seedTestOrganization(env, {
      tenantId: 'tenant-1', organizationId: 'church-2', name: 'Lautoka', type: 'local_church', parentId: 'mission-1',
    });

    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'mission-admin', email: 'ma@test.com',
      password: 'pass', role: 'mission_admin', organizationId: 'mission-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'clerk-1', email: 'clerk@test.com',
      password: 'pass', role: 'clerk', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'treasurer-1', email: 'treas@test.com',
      password: 'pass', role: 'treasurer', organizationId: 'church-1',
    });
    await seedTestMember(env, {
      tenantId: 'tenant-1', memberId: 'pastor-1', email: 'pastor@test.com',
      password: 'pass', role: 'pastor', organizationId: 'district-1',
    });

    missionAdminToken = await signJwt(
      { userId: 'mission-admin', tenantId: 'tenant-1', role: 'mission_admin', organizationId: 'mission-1' },
      'test-secret'
    );
    clerkToken = await signJwt(
      { userId: 'clerk-1', tenantId: 'tenant-1', role: 'clerk', organizationId: 'church-1' },
      'test-secret'
    );
    treasurerToken = await signJwt(
      { userId: 'treasurer-1', tenantId: 'tenant-1', role: 'treasurer', organizationId: 'church-1' },
      'test-secret'
    );
    pastorToken = await signJwt(
      { userId: 'pastor-1', tenantId: 'tenant-1', role: 'pastor', organizationId: 'district-1' },
      'test-secret'
    );
  });

  describe('GET /organizations', () => {
    it('lists all organizations in the tenant', async () => {
      const res = await app.request('/organizations', {
        headers: { Authorization: `Bearer ${missionAdminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const orgs = await res.json() as { id: string; name: string; type: string }[];
      expect(orgs.length).toBe(7);
      const types = orgs.map(o => o.type);
      expect(types).toContain('local_church');
      expect(types).toContain('mission');
      expect(types).toContain('general_conference');
    });

    it('filters children by parent_id', async () => {
      const res = await app.request('/organizations?parent_id=mission-1', {
        headers: { Authorization: `Bearer ${missionAdminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const orgs = await res.json() as { id: string }[];
      const ids = orgs.map(o => o.id);
      expect(ids).toContain('district-1');
      expect(ids).toContain('church-2');
      expect(ids).not.toContain('mission-1');
    });

    it('returns 401 without auth', async () => {
      const res = await app.request('/organizations', {}, env);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /organizations/:id', () => {
    it('returns organization by ID', async () => {
      const res = await app.request('/organizations/church-1', {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const org = await res.json() as { id: string; name: string; type: string };
      expect(org.id).toBe('church-1');
      expect(org.name).toBe('Suva Central');
      expect(org.type).toBe('local_church');
    });

    it('returns 404 for non-existent org', async () => {
      const res = await app.request('/organizations/nonexistent', {
        headers: { Authorization: `Bearer ${missionAdminToken}` },
      }, env);

      expect(res.status).toBe(404);
    });

    it('returns 403 when clerk tries to access another church', async () => {
      const res = await app.request('/organizations/church-2', {
        headers: { Authorization: `Bearer ${clerkToken}` },
      }, env);

      expect(res.status).toBe(403);
    });

    it('allows pastor to access any church in district', async () => {
      const res = await app.request('/organizations/church-1', {
        headers: { Authorization: `Bearer ${pastorToken}` },
      }, env);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /organizations/:id/children', () => {
    it('returns children of mission', async () => {
      const res = await app.request('/organizations/mission-1/children', {
        headers: { Authorization: `Bearer ${missionAdminToken}` },
      }, env);

      expect(res.status).toBe(200);
      const children = await res.json() as { id: string }[];
      const ids = children.map(c => c.id);
      expect(ids).toContain('district-1');
      expect(ids).toContain('church-2');
      expect(ids.length).toBe(2);
    });

    it('returns empty array for church with no children', async () => {
      const res = await app.request('/organizations/church-1/children', {
        headers: { Authorization: `Bearer ${treasurerToken}` },
      }, env);

      expect(res.status).toBe(200);
      const children = await res.json() as unknown[];
      expect(children.length).toBe(0);
    });
  });

  describe('POST /organizations', () => {
    it('allows mission_admin to create new church', async () => {
      const res = await app.request('/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${missionAdminToken}`,
        },
        body: JSON.stringify({
          name: 'Nadi Central',
          type: 'local_church',
          parent_id: 'mission-1',
        }),
      }, env);

      expect(res.status).toBe(201);
      const org = await res.json() as { id: string; name: string; type: string };
      expect(org.name).toBe('Nadi Central');
      expect(org.type).toBe('local_church');
    });

    it('allows creating org with no parent (top-level)', async () => {
      const res = await app.request('/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${missionAdminToken}`,
        },
        body: JSON.stringify({
          name: 'New Mission',
          type: 'mission',
        }),
      }, env);

      expect(res.status).toBe(201);
      const org = await res.json() as { name: string; type: string };
      expect(org.name).toBe('New Mission');
      expect(org.type).toBe('mission');
    });

    it('allows clerk to create org (POST not restricted by middleware yet)', async () => {
      const res = await app.request('/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          name: 'Bad Church',
          type: 'local_church',
          parent_id: 'mission-1',
        }),
      }, env);

      expect(res.status).toBe(201);
    });
  });
});
