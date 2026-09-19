import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount } from '../src/db/counts'
import {
  confirmDiscrepancyResolution,
  getReconciliationByCountId,
  markReceived,
  markSent,
  proposeDiscrepancyResolution,
} from '../src/db/reconciliations'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import { createMission } from '../src/db/queries'
import {
  getMissionExceptions,
  getMissionSettings,
  recentSaturdaysUTC,
  updateStuckReconciliationThreshold,
} from '../src/db/missions'
import app from '../src/index'
import { createTestActor, createTestChurch, loginAs } from './helpers'

let phoneCounter = 0
function nextPhone() {
  phoneCounter += 1
  return `+679555${String(3000 + phoneCounter)}`
}

let emailCounter = 0
function nextEmail() {
  emailCounter += 1
  return `mission-exceptions-${emailCounter}@example.test`
}

async function createTestTreasurer(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Treasurer', phone: nextPhone(), pin: '4321', role: 'treasurer', churchId })
}

async function createTestClerk(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Clerk', phone: nextPhone(), pin: '1357', role: 'clerk', churchId })
}

async function createTestMissionAccount(
  db: ReturnType<typeof getDb>,
  missionId: number,
  role: 'mission_admin' | 'mission_staff' = 'mission_staff',
) {
  const actorId = await createTestActor(db)
  return createInstitutionalAccount(
    db,
    { displayName: 'Test Mission Account', email: nextEmail(), password: 'correct-horse-battery-staple', role, missionId },
    actorId,
  )
}

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

const FAR_FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

describe('getMissionSettings / updateStuckReconciliationThreshold', () => {
  it('defaults to a 45-day threshold', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Threshold Test Mission', { actorId })
    expect(await getMissionSettings(db, mission.id)).toEqual({ stuckReconciliationThresholdDays: 45 })
  })

  it('is a per-Mission configurable setting, not a shared constant', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const missionA = await createMission(db, 'Mission A', { actorId })
    const missionB = await createMission(db, 'Mission B', { actorId })

    await updateStuckReconciliationThreshold(db, missionA.id, 10, { actorId })

    expect(await getMissionSettings(db, missionA.id)).toEqual({ stuckReconciliationThresholdDays: 10 })
    expect(await getMissionSettings(db, missionB.id)).toEqual({ stuckReconciliationThresholdDays: 45 })
  })
})

describe('getMissionExceptions — missing weekly count', () => {
  it('does not flag a church created too recently to have missed anything', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const exceptions = await getMissionExceptions(db, missionId)
    expect(exceptions.missingCount).toEqual([])
  })

  it('flags a church with zero counts once 2 consecutive Sabbaths have passed', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)

    const exceptions = await getMissionExceptions(db, missionId, FAR_FUTURE)
    expect(exceptions.missingCount).toEqual([
      { churchId: church.id, churchName: church.name, missedSabbaths: recentSaturdaysUTC(FAR_FUTURE, 2) },
    ])
  })

  it('does not flag a church that has a count for at least one of the last 2 Sabbaths', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const [mostRecentSabbath] = recentSaturdaysUTC(FAR_FUTURE, 2)

    await createCount(
      db,
      {
        clientRecordId: 'missing-count-partial',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: mostRecentSabbath,
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
      },
      { actorId: treasurer.id },
    )

    const exceptions = await getMissionExceptions(db, missionId, FAR_FUTURE)
    expect(exceptions.missingCount).toEqual([])
  })

  it('only flags churches in the queried Mission, not other Missions', async () => {
    const db = getDb(env.DB)
    const churchA = await createTestChurch(db)
    const missionA = await missionOf(db, churchA.districtId)
    const churchB = await createTestChurch(db)
    const missionB = await missionOf(db, churchB.districtId)

    const exceptionsA = await getMissionExceptions(db, missionA, FAR_FUTURE)
    expect(exceptionsA.missingCount.map((m) => m.churchId)).toEqual([churchA.id])

    const exceptionsB = await getMissionExceptions(db, missionB, FAR_FUTURE)
    expect(exceptionsB.missingCount.map((m) => m.churchId)).toEqual([churchB.id])
  })
})

describe('getMissionExceptions — stuck reconciliation', () => {
  async function setupSubmittedCount(db: ReturnType<typeof getDb>) {
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const count = await createCount(
      db,
      {
        clientRecordId: `stuck-${crypto.randomUUID()}`,
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-19',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
      },
      { actorId: treasurer.id },
    )
    const reconciliation = (await getReconciliationByCountId(db, count.id))!
    return { church, missionId, treasurer, count, reconciliation }
  }

  it('does not flag a freshly submitted reconciliation', async () => {
    const db = getDb(env.DB)
    const { missionId } = await setupSubmittedCount(db)
    const exceptions = await getMissionExceptions(db, missionId)
    expect(exceptions.stuckReconciliation).toEqual([])
  })

  it('flags a reconciliation still Submitted past the default 45-day threshold', async () => {
    const db = getDb(env.DB)
    const { missionId, church, count, reconciliation } = await setupSubmittedCount(db)
    const wellPastThreshold = new Date(Date.now() + 46 * 24 * 60 * 60 * 1000)

    const exceptions = await getMissionExceptions(db, missionId, wellPastThreshold)
    expect(exceptions.stuckReconciliation).toHaveLength(1)
    expect(exceptions.stuckReconciliation[0]).toMatchObject({
      reconciliationId: reconciliation.id,
      countId: count.id,
      churchId: church.id,
      churchName: church.name,
      status: 'submitted',
    })
  })

  it('also flags a reconciliation stuck In Transit, not just Submitted', async () => {
    const db = getDb(env.DB)
    const { missionId, treasurer, reconciliation } = await setupSubmittedCount(db)
    await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })

    const wellPastThreshold = new Date(Date.now() + 46 * 24 * 60 * 60 * 1000)
    const exceptions = await getMissionExceptions(db, missionId, wellPastThreshold)
    expect(exceptions.stuckReconciliation).toHaveLength(1)
    expect(exceptions.stuckReconciliation[0].status).toBe('in_transit')
  })

  it('respects a Mission-specific threshold lower than the 45-day default', async () => {
    const db = getDb(env.DB)
    const { missionId, reconciliation } = await setupSubmittedCount(db)
    await updateStuckReconciliationThreshold(db, missionId, 1, { actorId: 1 })

    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const exceptions = await getMissionExceptions(db, missionId, twoDaysLater)
    expect(exceptions.stuckReconciliation.map((s) => s.reconciliationId)).toContain(reconciliation.id)
  })
})

describe('getMissionExceptions — unresolved discrepancies', () => {
  async function setupDiscrepancy(db: ReturnType<typeof getDb>) {
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const missionStaff = await createTestMissionAccount(db, missionId)
    const count = await createCount(
      db,
      {
        clientRecordId: `exception-discrepancy-${crypto.randomUUID()}`,
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-19',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
      },
      { actorId: treasurer.id },
    )
    let reconciliation = (await getReconciliationByCountId(db, count.id))!
    await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })
    await markReceived(db, reconciliation.id, missionStaff, [{ fundCategoryId: categories[0].id, amountCents: 500 }], {
      actorId: missionStaff.id,
    })
    reconciliation = (await getReconciliationByCountId(db, count.id))!
    return { church, missionId, count, reconciliation, missionStaff }
  }

  it('lists an unresolved discrepancy', async () => {
    const db = getDb(env.DB)
    const { missionId, church, count, reconciliation } = await setupDiscrepancy(db)
    const exceptions = await getMissionExceptions(db, missionId)
    expect(exceptions.discrepancies).toHaveLength(1)
    expect(exceptions.discrepancies[0]).toMatchObject({
      reconciliationId: reconciliation.id,
      countId: count.id,
      churchId: church.id,
      churchName: church.name,
    })
  })

  it('drops off the list once resolved — CONTEXT.md: resolving "clears it from the exceptions tab"', async () => {
    const db = getDb(env.DB)
    const { missionId, reconciliation, missionStaff } = await setupDiscrepancy(db)
    const secondStaffer = await createTestMissionAccount(db, missionId, 'mission_admin')

    await proposeDiscrepancyResolution(db, reconciliation.id, missionStaff, 'Counting error', {
      actorId: missionStaff.id,
    })
    await confirmDiscrepancyResolution(db, reconciliation.id, secondStaffer, { actorId: secondStaffer.id })

    const exceptions = await getMissionExceptions(db, missionId)
    expect(exceptions.discrepancies).toEqual([])
  })
})

describe('HTTP routes', () => {
  it('GET /missions/me/settings requires mission_admin or mission_staff', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request('/missions/me/settings', { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('mission_staff can view but not update settings', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Staff View Mission', { actorId })
    const staff = await createTestMissionAccount(db, mission.id, 'mission_staff')
    const cookie = await loginAs(db, staff.id)

    const getRes = await app.request('/missions/me/settings', { headers: { cookie } }, env)
    expect(getRes.status).toBe(200)
    expect(await getRes.json()).toEqual({ settings: { stuckReconciliationThresholdDays: 45 } })

    const patchRes = await app.request(
      '/missions/me/settings',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ stuckReconciliationThresholdDays: 20 }),
      },
      env,
    )
    expect(patchRes.status).toBe(403)
  })

  it('mission_admin can update the threshold', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Admin Update Mission', { actorId })
    const admin = await createTestMissionAccount(db, mission.id, 'mission_admin')
    const cookie = await loginAs(db, admin.id)

    const res = await app.request(
      '/missions/me/settings',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ stuckReconciliationThresholdDays: 20 }),
      },
      env,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ settings: { stuckReconciliationThresholdDays: 20 } })
  })

  it('rejects a non-positive-integer threshold', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Invalid Threshold Mission', { actorId })
    const admin = await createTestMissionAccount(db, mission.id, 'mission_admin')
    const cookie = await loginAs(db, admin.id)

    const res = await app.request(
      '/missions/me/settings',
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ stuckReconciliationThresholdDays: 0 }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('GET /missions/me/exceptions returns the three exception categories', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Exceptions HTTP Mission', { actorId })
    const staff = await createTestMissionAccount(db, mission.id)
    const cookie = await loginAs(db, staff.id)

    const res = await app.request('/missions/me/exceptions', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ missingCount: unknown[]; stuckReconciliation: unknown[]; discrepancies: unknown[] }>()
    expect(body).toHaveProperty('missingCount')
    expect(body).toHaveProperty('stuckReconciliation')
    expect(body).toHaveProperty('discrepancies')
  })

  it('rejects a local-role account from the exceptions endpoint', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request('/missions/me/exceptions', { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })
})
