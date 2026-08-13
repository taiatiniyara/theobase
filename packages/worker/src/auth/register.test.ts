import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { handleChurchRegister } from './register';
import { handleOrgTree } from '../org/tree';
import type { Env } from '../env';

const testEnv = env as unknown as Env;

async function insertOrgUnit(
  id: string,
  parentId: string | null,
  level: string,
  kind: string,
  name: string,
): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO org_unit (id, parent_id, name, level, kind, status, code, facets) VALUES (?, ?, ?, ?, ?, 'organized', NULL, '[]')`,
  )
    .bind(id, parentId, name, level, kind)
    .run();
}

async function seedFijiSpine(): Promise<void> {
  await insertOrgUnit('gc', null, 'gc', 'general-conference', 'General Conference');
  await insertOrgUnit('spd', 'gc', 'division', 'division', 'South Pacific Division');
  await insertOrgUnit('tpum', 'spd', 'union', 'union-mission', 'Trans-Pacific Union Mission');
  await insertOrgUnit('fiji-mission', 'tpum', 'conference', 'mission', 'Fiji Mission');
}

describe('org tree (ADR-0018 picker)', () => {
  beforeAll(async () => {
    await seedFijiSpine();
  });

  it('returns nested Division → Union → Conference units', async () => {
    const response = await handleOrgTree(new Request('http://localhost/org/tree'), testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      divisions: Array<{
        id: string;
        name: string;
        unions: Array<{
          id: string;
          name: string;
          conferences: Array<{ id: string; name: string }>;
        }>;
      }>;
    };
    expect(body.divisions).toHaveLength(1);
    expect(body.divisions[0]!.id).toBe('spd');
    expect(body.divisions[0]!.unions).toHaveLength(1);
    expect(body.divisions[0]!.unions[0]!.id).toBe('tpum');
    expect(body.divisions[0]!.unions[0]!.conferences).toHaveLength(1);
    expect(body.divisions[0]!.unions[0]!.conferences[0]!.id).toBe('fiji-mission');
  });
});

describe('church registration under a Conference/Mission (ADR-0019 §5)', () => {
  async function postRegister(body: Record<string, unknown>): Promise<Response> {
    return handleChurchRegister(
      new Request('http://localhost/church/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      testEnv,
    );
  }

  it('places the church under the chosen Conference/Mission', async () => {
    const response = await postRegister({
      name: 'Lautoka Central SDA Church',
      address: '1 Tavewa Ave, Lautoka',
      email: 'lautoka@example.com',
      parentId: 'fiji-mission',
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { churchId: string; parentId: string; parentName: string };
    expect(body.parentId).toBe('fiji-mission');
    expect(body.parentName).toBe('Fiji Mission');

    const unit = await testEnv.DB!.prepare(
      'SELECT id, parent_id, name, level, kind, status, facets FROM org_unit WHERE id = ?',
    )
      .bind(body.churchId)
      .first();
    expect(unit).toEqual({
      id: body.churchId,
      parent_id: 'fiji-mission',
      name: 'Lautoka Central SDA Church',
      level: 'church',
      kind: 'church',
      status: 'organized',
      facets: '["tenant"]',
    });

    const extension = await testEnv.DB!.prepare(
      'SELECT id, do_class, status FROM church_extension WHERE id = ?',
    )
      .bind(body.churchId)
      .first();
    expect(extension).toEqual({
      id: body.churchId,
      do_class: 'ChurchDO',
      status: 'active',
    });

    const audit = await testEnv.DB!.prepare(
      "SELECT actor, action, unit_id FROM org_audit WHERE action = 'unit:create' AND unit_id = ?",
    )
      .bind(body.churchId)
      .first();
    expect(audit).toEqual({
      actor: expect.any(String),
      action: 'unit:create',
      unit_id: body.churchId,
    });

    const clerk = await testEnv.DB!.prepare(
      'SELECT id, email FROM user WHERE email = ?',
    )
      .bind('lautoka@example.com')
      .first();
    expect(clerk).toEqual({ id: expect.any(String), email: 'lautoka@example.com' });

    const grant = await testEnv.DB!.prepare(
      'SELECT user_id, unit_id, role FROM role_grant WHERE unit_id = ?',
    )
      .bind(body.churchId)
      .first();
    expect(grant).toEqual({
      user_id: (clerk as { id: string }).id,
      unit_id: body.churchId,
      role: 'clerk',
    });
  });

  it('rejects registration without a parent', async () => {
    const response = await postRegister({
      name: 'No Parent Church',
      email: 'noparent@example.com',
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('Conference/Mission');
  });

  it('rejects registration under a non-conference unit', async () => {
    const response = await postRegister({
      name: 'Bad Parent Church',
      email: 'bad@example.com',
      parentId: 'tpum',
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('Conference/Mission');
  });

  it('rejects registration under a parent that is not yet organized (ADR-0019 §4)', async () => {
    await insertOrgUnit(
      'pending-mission',
      'tpum',
      'conference',
      'mission',
      'Pending Mission',
    );
    await testEnv.DB!.prepare(
      "UPDATE org_unit SET status = 'constituted' WHERE id = 'pending-mission'",
    ).run();

    const response = await postRegister({
      name: 'Early Church',
      email: 'early@example.com',
      parentId: 'pending-mission',
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('not yet active');
  });

  it('rejects registration with an unknown parent', async () => {
    const response = await postRegister({
      name: 'Ghost Church',
      email: 'ghost@example.com',
      parentId: 'does-not-exist',
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('not found');
  });
});