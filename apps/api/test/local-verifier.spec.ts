import app from '../src/index'
import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount, ensureLocalVerifierSeed } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { sessions } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { createTestChurch, createTestMission, loginAs } from './helpers'

const ORIGIN = 'http://localhost:5173'

function cookieFrom(res: Response): string {
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('expected a Set-Cookie header')
  return setCookie.split(';')[0]
}

async function createTreasurer(phone: string, pin: string) {
  const db = getDb(env.DB)
  const church = await createTestChurch(db)
  return createLocalAccount(db, {
    displayName: 'Test Treasurer',
    phone,
    pin,
    role: 'treasurer',
    churchId: church.id,
  })
}

describe('local-verifier seed issuance', () => {
  it('/auth/local/login returns a localVerifierSeed', async () => {
    await createTreasurer('+6797770001', '1234')

    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6797770001', pin: '1234' }),
      },
      env,
    )
    const body = await res.json<{ localVerifierSeed: string }>()
    expect(body.localVerifierSeed).toBeTruthy()
    expect(typeof body.localVerifierSeed).toBe('string')
  })

  it('is stable across repeated logins (the same device re-deriving is a no-op, not a rotation)', async () => {
    await createTreasurer('+6797770002', '1234')

    const login = async () => {
      const res = await app.request(
        '/auth/local/login',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: ORIGIN },
          body: JSON.stringify({ phone: '+6797770002', pin: '1234' }),
        },
        env,
      )
      return res.json<{ localVerifierSeed: string }>()
    }

    const first = await login()
    const second = await login()
    expect(second.localVerifierSeed).toBe(first.localVerifierSeed)
  })

  it('ensureLocalVerifierSeed is idempotent at the data layer too', async () => {
    const db = getDb(env.DB)
    const account = await createTreasurer('+6797770003', '1234')

    const first = await ensureLocalVerifierSeed(db, account.id)
    const second = await ensureLocalVerifierSeed(db, account.id)
    expect(second).toBe(first)
  })

  it('can never be issued to an institutional account through the actual login flow', async () => {
    // There's deliberately no DB-level CHECK for this (see the comment
    // on accounts.localVerifierSeed in schema.ts — D1 can't safely
    // rebuild `accounts` while sessions/audit_log/counts still
    // reference it). The real guarantee is structural instead:
    // institutional accounts always have phone = null, and both
    // /auth/local/login and /auth/local/verify-pin look accounts up
    // *by phone* — so there is no way to reach ensureLocalVerifierSeed
    // for one through the app's actual entry points, regardless of
    // what credentials are supplied.
    const db = getDb(env.DB)
    const mission = await createTestMission(db)
    await createInstitutionalAccount(db, {
      displayName: 'CFO No Seed',
      email: 'cfo-no-seed@example.test',
      password: 'correct-horse-battery-staple',
      role: 'mission_admin',
      missionId: mission.id,
    })

    // Institutional accounts don't have a phone at all — this can
    // only ever resolve to "no such account," never to the CFO's row.
    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: 'cfo-no-seed@example.test', pin: '1234' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })
})

describe('POST /auth/local/verify-pin', () => {
  it('requires the caller to already be authenticated', async () => {
    await createTreasurer('+6797771001', '1234')
    const res = await app.request(
      '/auth/local/verify-pin',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6797771001', pin: '1234' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })

  it("verifies a *different* account's PIN without disturbing the caller's own session", async () => {
    const db = getDb(env.DB)
    const treasurer = await createTreasurer('+6797771002', '1111')
    const coSigner = await createTreasurer('+6797771003', '2222')
    const callerCookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/auth/local/verify-pin',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, cookie: callerCookie },
        body: JSON.stringify({ phone: '+6797771003', pin: '2222' }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = await res.json<{ account: { id: number }; localVerifierSeed: string }>()
    expect(body.account.id).toBe(coSigner.id)
    expect(body.localVerifierSeed).toBeTruthy()

    // No new session was created for the co-signer — no Set-Cookie at all.
    expect(res.headers.get('set-cookie')).toBeNull()

    // The caller's own session is still perfectly valid afterwards.
    const meRes = await app.request('/auth/me', { headers: { cookie: callerCookie, origin: ORIGIN } }, env)
    expect(meRes.status).toBe(200)
    const meBody = await meRes.json<{ account: { id: number } }>()
    expect(meBody.account.id).toBe(treasurer.id)
  })

  it('rejects a wrong PIN for the target account', async () => {
    const db = getDb(env.DB)
    const treasurer = await createTreasurer('+6797771004', '1111')
    await createTreasurer('+6797771005', '2222')
    const callerCookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/auth/local/verify-pin',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, cookie: callerCookie },
        body: JSON.stringify({ phone: '+6797771005', pin: 'wrong' }),
      },
      env,
    )
    expect(res.status).toBe(401)
  })

  it("shares lockout state with full login — repeated failures here lock the target's real login too", async () => {
    const db = getDb(env.DB)
    const treasurer = await createTreasurer('+6797771006', '1111')
    const target = await createTreasurer('+6797771007', '2222')
    const callerCookie = await loginAs(db, treasurer.id)
    void target

    for (let i = 0; i < 5; i++) {
      const res = await app.request(
        '/auth/local/verify-pin',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: ORIGIN, cookie: callerCookie },
          body: JSON.stringify({ phone: '+6797771007', pin: 'wrong' }),
        },
        env,
      )
      expect(res.status).toBe(401)
    }

    const lockedViaFullLogin = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6797771007', pin: '2222' }), // even the *correct* PIN now
      },
      env,
    )
    expect(lockedViaFullLogin.status).toBe(423)
  })
})

describe('sessions never hard-expire (#23)', () => {
  it('a newly created session has no expiresAt', async () => {
    const db = getDb(env.DB)
    const treasurer = await createTreasurer('+6797772001', '1234')
    await loginAs(db, treasurer.id)

    const rows = await db.select().from(sessions).where(eq(sessions.accountId, treasurer.id))
    expect(rows).toHaveLength(1)
    expect(rows[0].expiresAt).toBeNull()
  })

  it('a session cookie set on login carries a long (not session-only) max-age', async () => {
    await createTreasurer('+6797772002', '1234')
    const res = await app.request(
      '/auth/local/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN },
        body: JSON.stringify({ phone: '+6797772002', pin: '1234' }),
      },
      env,
    )
    const setCookie = cookieFrom(res) && res.headers.get('set-cookie')!
    expect(setCookie).toMatch(/Max-Age=34560000/) // 400 days, in seconds
  })
})
