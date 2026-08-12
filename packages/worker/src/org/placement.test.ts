import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { initKeys, signSession } from '../auth/jwt';
import { handlePlacementRequest } from './placement';
import type { Env } from '../env';
import type { GrantRole } from '@theobase/shared';

const testEnv = env as unknown as Env;

async function insertOrgUnit(
  id: string,
  parentId: string | null,
  level: string,
  kind: string,
  name = id,
): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO org_unit (id, parent_id, name, level, kind, status, code, facets) VALUES (?, ?, ?, ?, ?, 'organized', NULL, '[]')`,
  )
    .bind(id, parentId, name, level, kind)
    .run();
}

async function insertUser(id: string, email: string, isSuperAdmin = false): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO user (id, email, name, token_version, is_super_admin, mfa_enabled) VALUES (?, ?, ?, 1, ?, 0)`,
  )
    .bind(id, email, email, isSuperAdmin ? 1 : 0)
    .run();
}

async function insertGrant(
  id: string,
  userId: string,
  unitId: string,
  role: GrantRole,
): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO role_grant (id, user_id, unit_id, role, expires_at) VALUES (?, ?, ?, ?, NULL)`,
  )
    .bind(id, userId, unitId, role)
    .run();
}

async function seedFijiSpine(): Promise<void> {
  await insertOrgUnit('gc', null, 'gc', 'general-conference', 'General Conference');
  await insertOrgUnit('spd', 'gc', 'division', 'division', 'South Pacific Division');
  await insertOrgUnit('tpum', 'spd', 'union', 'union-mission', 'Trans-Pacific Union Mission');
  await insertOrgUnit('fiji-mission', 'tpum', 'conference', 'mission', 'Fiji Mission');
}

function conferenceSession(sub: string, unitId: string, role: GrantRole): Promise<string> {
  return signSession({
    sub,
    churchId: unitId,
    role,
    tokenVersion: 1,
    unitId,
    isSuperAdmin: false,
  });
}

describe('placement request (ADR-0019 §2)', () => {
  beforeAll(async () => {
    await initKeys();
    await seedFijiSpine();
    await insertUser('user-1', 'officer@fiji-mission.org');
    await insertUser('user-2', 'member@fiji-mission.org');
    await insertGrant('grant-1', 'user-1', 'fiji-mission', 'conference-treasurer');
  });

  async function postRequest(token: string, body: Record<string, unknown>): Promise<Response> {
    return handlePlacementRequest(
      new Request('http://localhost/placement/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }),
      testEnv,
    );
  }

  it('files a placement request with a tree-derived suggested parent, no org_unit row', async () => {
    const token = await conferenceSession('user-1', 'fiji-mission', 'conference-treasurer');
    const response = await postRequest(token, {
      name: 'Rotuma Mission',
      territory: 'Rotuma, Fiji',
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      id: string;
      suggestedParentId: string;
      status: string;
    };
    expect(body.status).toBe('pending');
    // Walk up from Fiji Mission: nearest Union/Division ancestor is TPUM.
    expect(body.suggestedParentId).toBe('tpum');

    const requestRow = await testEnv.DB!.prepare(
      'SELECT id, requested_by, name, territory, suggested_parent_id, status FROM placement_request WHERE id = ?',
    )
      .bind(body.id)
      .first();
    expect(requestRow).toEqual({
      id: body.id,
      requested_by: 'user-1',
      name: 'Rotuma Mission',
      territory: 'Rotuma, Fiji',
      suggested_parent_id: 'tpum',
      status: 'pending',
    });

    const audit = await testEnv.DB!.prepare(
      "SELECT actor, action, unit_id, after FROM org_audit WHERE action = 'unit:requested' AND unit_id = 'tpum' ORDER BY timestamp DESC LIMIT 1",
    )
      .first();
    expect(audit).toBeTruthy();
    expect((audit as { actor: string }).actor).toBe('user-1');

    // No org_unit row was created by the request itself.
    const rotuma = await testEnv.DB!.prepare(
      "SELECT id FROM org_unit WHERE name = 'Rotuma Mission'",
    )
      .first();
    expect(rotuma).toBeNull();
    const totalUnits = await testEnv.DB!.prepare('SELECT COUNT(*) AS n FROM org_unit').first();
    expect((totalUnits as { n: number }).n).toBe(4);
  });

  it('rejects a signed-in user without a conference admin grant', async () => {
    const token = await conferenceSession('user-2', 'fiji-mission', 'member');
    const response = await postRequest(token, {
      name: 'Vanua Levu Mission',
      territory: 'Vanua Levu, Fiji',
    });
    expect(response.status).toBe(403);
  });

  it('rejects unauthenticated requests', async () => {
    const response = await postRequest('not-a-token', {
      name: 'Nope',
      territory: 'Nowhere',
    });
    expect(response.status).toBe(401);
  });

  it('rejects a request missing name or territory', async () => {
    const token = await conferenceSession('user-1', 'fiji-mission', 'conference-treasurer');
    const response = await postRequest(token, { name: 'No Territory' });
    expect(response.status).toBe(400);
  });
});