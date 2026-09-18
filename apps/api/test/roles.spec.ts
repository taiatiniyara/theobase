import { env } from 'cloudflare:test'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { type AppEnv, requireAuth, requireRole } from '../src/auth/middleware'
import { assertValidScope } from '../src/auth/roles'
import { canAccessChurch, canAccessDistrict, canAccessMission } from '../src/auth/scope'
import { getDb } from '../src/db/client'
import { createChurch, createDistrict } from '../src/db/queries'
import { accounts } from '../src/db/schema'
import { createTestActor, createTestChurch, createTestMission, loginAs } from './helpers'

// Builds a district/church under a *specific* mission that a test
// already created, rather than createTestChurch's own independent
// Mission -> District -> Church chain — needed for the mission_admin
// scope test below, which checks access across two churches that
// must genuinely share a mission.
async function createDistrictFor(db: ReturnType<typeof getDb>, missionId: number, actorId: number) {
  return createDistrict(db, missionId, 'Scoped District', { actorId })
}
async function createChurchFor(db: ReturnType<typeof getDb>, districtId: number, actorId: number) {
  return createChurch(db, districtId, 'Scoped Church', { actorId })
}

describe('accounts_role_matches_account_type CHECK', () => {
  it('rejects a local-accountType row with an institutional role', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    await expect(
      db.insert(accounts).values({
        displayName: 'Bad Row',
        accountType: 'local',
        role: 'mission_admin', // mismatched on purpose
        phone: '+6790001111',
        pinHash: 'irrelevant',
        churchId: null, // also violates scope, but role/type is checked too
        missionId: church.districtId, // nonsense value, just needs to be non-null
      }),
    ).rejects.toThrow()
  })
})

describe('accounts_scope_matches_role CHECK', () => {
  it('rejects a treasurer with no churchId', async () => {
    const db = getDb(env.DB)
    await expect(
      db.insert(accounts).values({
        displayName: 'Bad Treasurer',
        accountType: 'local',
        role: 'treasurer',
        phone: '+6790002222',
        pinHash: 'irrelevant',
        churchId: null,
      }),
    ).rejects.toThrow()
  })

  it('rejects a pastor with a churchId instead of a districtId', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    await expect(
      db.insert(accounts).values({
        displayName: 'Bad Pastor',
        accountType: 'local',
        role: 'pastor',
        phone: '+6790003333',
        pinHash: 'irrelevant',
        churchId: church.id, // wrong — pastor needs districtId
      }),
    ).rejects.toThrow()
  })

  it('rejects a platform-operator with any org scope set', async () => {
    const db = getDb(env.DB)
    const mission = await createTestMission(db)
    await expect(
      db.insert(accounts).values({
        displayName: 'Bad Operator',
        accountType: 'institutional',
        role: 'platform_operator',
        email: 'bad-operator@example.test',
        passwordHash: 'irrelevant',
        missionId: mission.id, // wrong — platform_operator must have no scope
      }),
    ).rejects.toThrow()
  })
})

describe('assertValidScope', () => {
  it('accepts each role with its correct scope shape', () => {
    expect(() =>
      assertValidScope('treasurer', { churchId: 1, districtId: null, missionId: null }),
    ).not.toThrow()
    expect(() =>
      assertValidScope('pastor', { churchId: null, districtId: 1, missionId: null }),
    ).not.toThrow()
    expect(() =>
      assertValidScope('mission_admin', { churchId: null, districtId: null, missionId: 1 }),
    ).not.toThrow()
    expect(() =>
      assertValidScope('platform_operator', { churchId: null, districtId: null, missionId: null }),
    ).not.toThrow()
  })

  it('rejects a role with the wrong scope shape', () => {
    expect(() =>
      assertValidScope('treasurer', { churchId: null, districtId: null, missionId: null }),
    ).toThrow()
    expect(() =>
      assertValidScope('clerk', { churchId: 1, districtId: 1, missionId: null }),
    ).toThrow()
  })
})

describe('requireAuth / requireRole middleware', () => {
  const app = new Hono<AppEnv>()
  app.get('/protected', requireAuth, (c) => c.json({ ok: true }))
  app.get('/mission-admin-only', requireAuth, requireRole('mission_admin'), (c) =>
    c.json({ ok: true }),
  )

  it('requireAuth rejects when there is no session', async () => {
    const res = await app.request('/protected', {}, env)
    expect(res.status).toBe(401)
  })

  it('requireAuth passes a valid session through', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const account = await createLocalAccount(db, {
      displayName: 'Mid Test Treasurer',
      phone: '+6790004444',
      pin: '1357',
      role: 'treasurer',
      churchId: church.id,
    })
    const cookie = await loginAs(db, account.id)

    const res = await app.request('/protected', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
  })

  it('requireRole rejects an authenticated account with the wrong role', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const account = await createLocalAccount(db, {
      displayName: 'Not An Admin',
      phone: '+6790005555',
      pin: '2468',
      role: 'treasurer',
      churchId: church.id,
    })
    const cookie = await loginAs(db, account.id)

    const res = await app.request('/mission-admin-only', { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('requireRole passes an account with the matching role', async () => {
    const db = getDb(env.DB)
    const mission = await createTestMission(db)
    const account = await createInstitutionalAccount(db, {
      displayName: 'Real Admin',
      email: 'real-admin@example.test',
      password: 'correct-horse-battery-staple',
      role: 'mission_admin',
      missionId: mission.id,
    })
    const cookie = await loginAs(db, account.id)

    const res = await app.request('/mission-admin-only', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
  })
})

describe('org-scope checks', () => {
  it('a treasurer can access their own church but not another', async () => {
    const db = getDb(env.DB)
    const churchA = await createTestChurch(db)
    const churchB = await createTestChurch(db)
    const treasurer = { role: 'treasurer' as const, churchId: churchA.id, districtId: null, missionId: null }

    expect(await canAccessChurch(db, treasurer, churchA.id)).toBe(true)
    expect(await canAccessChurch(db, treasurer, churchB.id)).toBe(false)
  })

  it('a pastor can access any church in their district, not outside it', async () => {
    const db = getDb(env.DB)
    const churchInDistrict = await createTestChurch(db)
    const otherChurch = await createTestChurch(db)

    const pastor = {
      role: 'pastor' as const,
      churchId: null,
      districtId: churchInDistrict.districtId,
      missionId: null,
    }

    expect(await canAccessChurch(db, pastor, churchInDistrict.id)).toBe(true)
    expect(await canAccessChurch(db, pastor, otherChurch.id)).toBe(false)
    expect(await canAccessDistrict(db, pastor, churchInDistrict.districtId)).toBe(true)
  })

  it('mission_admin can access any church/district in their mission, not outside it', async () => {
    const db = getDb(env.DB)
    const mission = await createTestMission(db)
    const actorId = await createTestActor(db)
    const districtInMission = await createDistrictFor(db, mission.id, actorId)
    const churchInMission = await createChurchFor(db, districtInMission.id, actorId)
    const churchElsewhere = await createTestChurch(db)

    const missionAdmin = {
      role: 'mission_admin' as const,
      churchId: null,
      districtId: null,
      missionId: mission.id,
    }

    expect(await canAccessChurch(db, missionAdmin, churchInMission.id)).toBe(true)
    expect(await canAccessChurch(db, missionAdmin, churchElsewhere.id)).toBe(false)
    expect(await canAccessDistrict(db, missionAdmin, districtInMission.id)).toBe(true)
    expect(canAccessMission(missionAdmin, mission.id)).toBe(true)
    expect(canAccessMission(missionAdmin, mission.id + 1)).toBe(false)
  })

  it('platform_operator has no standing access to any church/district/mission', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const platformOperator = {
      role: 'platform_operator' as const,
      churchId: null,
      districtId: null,
      missionId: null,
    }

    expect(await canAccessChurch(db, platformOperator, church.id)).toBe(false)
    expect(await canAccessDistrict(db, platformOperator, church.districtId)).toBe(false)
    expect(canAccessMission(platformOperator, 1)).toBe(false)
  })
})
