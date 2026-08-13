import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { initKeys, signMagicLink, signSession } from './jwt';
import { handleVerify } from './handlers';
import { authenticate } from './middleware';
import type { Env } from '../env';
import type { GrantRole } from '@theobase/shared';

const testEnv = env as unknown as Env;

async function hashForKV(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function insertOrgUnit(id: string, level = 'conference', kind = 'conference'): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO org_unit (id, parent_id, name, level, kind, status, code, facets) VALUES (?, NULL, ?, ?, ?, 'organized', NULL, '[]')`,
  )
    .bind(id, id, level, kind)
    .run();
}

async function insertUser(
  id: string,
  email: string,
  tokenVersion = 1,
  isSuperAdmin = false,
): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO user (id, email, name, token_version, is_super_admin, mfa_enabled) VALUES (?, ?, ?, ?, ?, 0)`,
  )
    .bind(id, email, email, tokenVersion, isSuperAdmin ? 1 : 0)
    .run();
}

async function insertGrant(
  id: string,
  userId: string,
  unitId: string,
  role: GrantRole,
  expiresAt: number | null = null,
): Promise<void> {
  await testEnv.DB!.prepare(
    `INSERT INTO role_grant (id, user_id, unit_id, role, expires_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, userId, unitId, role, expiresAt)
    .run();
}

async function makeVerifyRequest(token: string, unitParam?: string): Promise<Response> {
  const url = new URL('http://localhost/auth/verify');
  url.searchParams.set('token', token);
  if (unitParam) url.searchParams.set('unit', unitParam);
  return handleVerify(new Request(url), testEnv);
}

async function getSessionToken(response: Response): Promise<string> {
  const body = (await response.json()) as { token: string };
  return body.token;
}

describe('grant-scoped sessions (ADR-0018 §7)', () => {
  beforeAll(async () => {
    await initKeys();
  });

  it('mints a session carrying the active grant for a user with a roleGrant', async () => {
    await insertOrgUnit('fiji-mission');
    await insertUser('user-1', 'officer@mission.org');
    await insertGrant('grant-1', 'user-1', 'fiji-mission', 'conference-treasurer');

    const token = await signMagicLink({
      sub: 'officer@mission.org',
      churchId: '',
      role: 'member',
      tokenVersion: 0,
      unitId: null,
      isSuperAdmin: false,
    });
    await testEnv.theobase_auth!.put(`token:${await hashForKV(token)}`, 'valid');

    const response = await makeVerifyRequest(token);
    expect(response.status).toBe(200);

    const { verify } = await import('./jwt');
    const { payload } = await verify(await getSessionToken(response));
    expect(payload.sub).toBe('user-1');
    expect(payload.unitId).toBe('fiji-mission');
    expect(payload.role).toBe('conference-treasurer');
    expect(payload.churchId).toBe('fiji-mission');
    expect(payload.isSuperAdmin).toBe(false);
    expect(payload.tokenVersion).toBe(1);
  });

  it('switches the active grant via the ?unit= param', async () => {
    await insertOrgUnit('suva-central', 'church', 'church');
    await insertUser('user-2', 'officer2@mission.org');
    await insertGrant('grant-2', 'user-2', 'fiji-mission', 'conference-treasurer');
    await insertGrant('grant-3', 'user-2', 'suva-central', 'clerk');

    const token = await signMagicLink({
      sub: 'officer2@mission.org',
      churchId: '',
      role: 'member',
      tokenVersion: 0,
      unitId: null,
      isSuperAdmin: false,
    });
    await testEnv.theobase_auth!.put(`token:${await hashForKV(token)}`, 'valid');

    const { verify } = await import('./jwt');
    const { payload } = await verify(await getSessionToken(await makeVerifyRequest(token, 'suva-central')));
    expect(payload.unitId).toBe('suva-central');
    expect(payload.role).toBe('clerk');
  });

  it('mints an operator session by flag for a super admin without grants', async () => {
    await insertUser('user-3', 'operator@theobase.app', 1, true);

    const token = await signMagicLink({
      sub: 'operator@theobase.app',
      churchId: '',
      role: 'member',
      tokenVersion: 0,
      unitId: null,
      isSuperAdmin: false,
    });
    await testEnv.theobase_auth!.put(`token:${await hashForKV(token)}`, 'valid');

    const { verify } = await import('./jwt');
    const { payload } = await verify(await getSessionToken(await makeVerifyRequest(token)));
    expect(payload.isSuperAdmin).toBe(true);
    expect(payload.unitId).toBe(null);
    expect(payload.role).toBe('operator');
  });

  it('rejects a session whose tokenVersion is stale after a grant change', async () => {
    await insertUser('user-4', 'stale@mission.org', 2, false);

    const staleToken = await signSession({
      sub: 'user-4',
      churchId: 'fiji-mission',
      role: 'conference-treasurer',
      tokenVersion: 1,
      unitId: 'fiji-mission',
      isSuperAdmin: false,
    });

    const authed = await authenticate(
      new Request('http://localhost/church/x/mutate', {
        headers: { Authorization: `Bearer ${staleToken}` },
      }),
      testEnv,
    );
    expect(authed).toBeNull();
  });

  it('resolves a plain login magic link to the church granted at registration', async () => {
    await insertUser('user-5', 'clerk@newchurch.org');
    await insertGrant('grant-4', 'user-5', 'suva-central', 'clerk');

    const token = await signMagicLink({
      sub: 'clerk@newchurch.org',
      churchId: '',
      role: 'member',
      tokenVersion: 0,
      unitId: null,
      isSuperAdmin: false,
    });
    await testEnv.theobase_auth!.put(`token:${await hashForKV(token)}`, 'valid');

    const { verify } = await import('./jwt');
    const { payload } = await verify(await getSessionToken(await makeVerifyRequest(token)));
    expect(payload.churchId).toBe('suva-central');
    expect(payload.role).toBe('clerk');
    expect(payload.unitId).toBe('suva-central');
  });
});