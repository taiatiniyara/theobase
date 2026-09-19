import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount } from '../src/db/counts'
import { listChurchesForDistrictWithStatus } from '../src/db/districts'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import { recentSaturdaysUTC, updateStuckReconciliationThreshold } from '../src/db/missions'
import { createChurch, createDistrict } from '../src/db/queries'
import {
  confirmDiscrepancyResolution,
  getReconciliationByCountId,
  markReceived,
  markSent,
  proposeDiscrepancyResolution,
} from '../src/db/reconciliations'
import app from '../src/index'
import { createTestActor, createTestChurch, loginAs } from './helpers'

let phoneCounter = 0
function nextPhone() {
  phoneCounter += 1
  return `+679555${String(6000 + phoneCounter)}`
}

let emailCounter = 0
function nextEmail() {
  emailCounter += 1
  return `district-roster-${emailCounter}@example.test`
}

async function createTestTreasurer(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Treasurer', phone: nextPhone(), pin: '4321', role: 'treasurer', churchId })
}

async function createTestClerk(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Clerk', phone: nextPhone(), pin: '1357', role: 'clerk', churchId })
}

async function createTestPastor(db: ReturnType<typeof getDb>, districtId: number) {
  return createLocalAccount(db, { displayName: 'Test Pastor', phone: nextPhone(), pin: '2468', role: 'pastor', districtId })
}

async function createTestMissionStaff(db: ReturnType<typeof getDb>, missionId: number) {
  const actorId = await createTestActor(db)
  return createInstitutionalAccount(
    db,
    { displayName: 'Test Mission Staff', email: nextEmail(), password: 'correct-horse-battery-staple', role: 'mission_staff', missionId },
    actorId,
  )
}

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

// Past the default 45-day stuck-reconciliation threshold, not just far
// enough to cover 2 missed Sabbaths — some tests below check both
// signals against the same `now`.
const FAR_FUTURE = new Date(Date.now() + 50 * 24 * 60 * 60 * 1000)

describe('listChurchesForDistrictWithStatus', () => {
  it('a church with no records shows a null latestRecord', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const roster = await listChurchesForDistrictWithStatus(db, church.districtId)
    expect(roster).toHaveLength(1)
    expect(roster[0]).toMatchObject({
      churchId: church.id,
      churchName: church.name,
      latestRecord: null,
      hasStuckReconciliation: false,
      hasUnresolvedDiscrepancy: false,
    })
  })

  it('shows the most recent record’s status as the badge', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)

    await createCount(
      db,
      {
        clientRecordId: 'district-roster-older',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurer.id },
    )
    await createCount(
      db,
      {
        clientRecordId: 'district-roster-newer',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-12',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 200 }],
      },
      { actorId: treasurer.id },
    )

    const roster = await listChurchesForDistrictWithStatus(db, church.districtId)
    expect(roster[0].latestRecord).toMatchObject({ sabbathDate: '2026-09-12', status: 'submitted' })
  })

  it('flags missingCount, stuck reconciliation, and unresolved discrepancy independently per church', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const districtId = church.districtId
    const missionId = await missionOf(db, districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })

    // Church A: never recorded anything -> missing count (once enough time has passed).
    const churchA = church

    // Both a stuck reconciliation and an unresolved discrepancy come
    // from an old count — for missingCount to correctly read false for
    // these two churches (isolating each flag), they also need a
    // *recent* count covering the Sabbaths FAR_FUTURE will treat as
    // "the last 2 expected" — a real church with one old stuck record
    // would ordinarily have kept submitting weekly regardless.
    const [recentSabbath] = recentSaturdaysUTC(FAR_FUTURE, 1)

    // Church B: same district, has a stuck submitted reconciliation.
    const churchB = await createChurch(db, districtId, 'Church B', { actorId })
    const treasurerB = await createTestTreasurer(db, churchB.id)
    const coSignerB = await createTestClerk(db, churchB.id)
    await createCount(
      db,
      {
        clientRecordId: 'district-roster-stuck',
        churchId: churchB.id,
        enteredByAccountId: treasurerB.id,
        coSignerAccountId: coSignerB.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurerB.id },
    )
    await createCount(
      db,
      {
        clientRecordId: 'district-roster-stuck-recent',
        churchId: churchB.id,
        enteredByAccountId: treasurerB.id,
        coSignerAccountId: coSignerB.id,
        sabbathDate: recentSabbath,
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurerB.id },
    )

    // Church C: same district, has an unresolved discrepancy.
    const churchC = await createChurch(db, districtId, 'Church C', { actorId })
    const treasurerC = await createTestTreasurer(db, churchC.id)
    const coSignerC = await createTestClerk(db, churchC.id)
    const missionStaff = await createTestMissionStaff(db, missionId)
    const countC = await createCount(
      db,
      {
        clientRecordId: 'district-roster-discrepancy',
        churchId: churchC.id,
        enteredByAccountId: treasurerC.id,
        coSignerAccountId: coSignerC.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
      },
      { actorId: treasurerC.id },
    )
    const reconC = (await getReconciliationByCountId(db, countC.id))!
    await markSent(db, reconC.id, treasurerC, null, { actorId: treasurerC.id })
    await markReceived(db, reconC.id, missionStaff, [{ fundCategoryId: categories[0].id, amountCents: 500 }], {
      actorId: missionStaff.id,
    })
    const countCRecent = await createCount(
      db,
      {
        clientRecordId: 'district-roster-discrepancy-recent',
        churchId: churchC.id,
        enteredByAccountId: treasurerC.id,
        coSignerAccountId: coSignerC.id,
        sabbathDate: recentSabbath,
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurerC.id },
    )
    // Processed cleanly and promptly (unlike the old, still-open one
    // above) — otherwise this filler count, whose own createdAt is
    // also "now," would itself look stuck against FAR_FUTURE and
    // defeat the point of isolating hasUnresolvedDiscrepancy here.
    const reconCRecent = (await getReconciliationByCountId(db, countCRecent.id))!
    await markSent(db, reconCRecent.id, treasurerC, null, { actorId: treasurerC.id })
    await markReceived(
      db,
      reconCRecent.id,
      missionStaff,
      [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      { actorId: missionStaff.id },
    )

    const roster = await listChurchesForDistrictWithStatus(db, districtId, FAR_FUTURE)
    const byId = new Map(roster.map((r) => [r.churchId, r]))

    expect(byId.get(churchA.id)).toMatchObject({ missingCount: true, hasStuckReconciliation: false, hasUnresolvedDiscrepancy: false })
    expect(byId.get(churchB.id)).toMatchObject({ missingCount: false, hasStuckReconciliation: true, hasUnresolvedDiscrepancy: false })
    expect(byId.get(churchC.id)).toMatchObject({ missingCount: false, hasStuckReconciliation: false, hasUnresolvedDiscrepancy: true })
  })

  it('the discrepancy flag clears once resolved', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const missionStaff = await createTestMissionStaff(db, missionId)
    const secondStaff = await createTestMissionStaff(db, missionId)
    const count = await createCount(
      db,
      {
        clientRecordId: 'district-roster-resolved',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
      },
      { actorId: treasurer.id },
    )
    let recon = (await getReconciliationByCountId(db, count.id))!
    await markSent(db, recon.id, treasurer, null, { actorId: treasurer.id })
    await markReceived(db, recon.id, missionStaff, [{ fundCategoryId: categories[0].id, amountCents: 500 }], {
      actorId: missionStaff.id,
    })
    recon = (await getReconciliationByCountId(db, count.id))!
    await proposeDiscrepancyResolution(db, recon.id, missionStaff, 'Counting error', { actorId: missionStaff.id })
    await confirmDiscrepancyResolution(db, recon.id, secondStaff, { actorId: secondStaff.id })

    const roster = await listChurchesForDistrictWithStatus(db, church.districtId)
    expect(roster[0].hasUnresolvedDiscrepancy).toBe(false)
    expect(roster[0].latestRecord?.hasDiscrepancy).toBe(true)
    expect(roster[0].latestRecord?.discrepancyResolvedAt).not.toBeNull()
  })

  it('respects the district’s own Mission threshold, not the 45-day default', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    await createCount(
      db,
      {
        clientRecordId: 'district-roster-threshold',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurer.id },
    )
    await updateStuckReconciliationThreshold(db, missionId, 1, { actorId })

    const twoDaysLater = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const roster = await listChurchesForDistrictWithStatus(db, church.districtId, twoDaysLater)
    expect(roster[0].hasStuckReconciliation).toBe(true)
  })

  it('does not include a church from a different district in the same Mission', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const otherDistrict = await createDistrict(db, missionId, 'Other District', { actorId })
    await createChurch(db, otherDistrict.id, 'Other District Church', { actorId })

    const roster = await listChurchesForDistrictWithStatus(db, church.districtId)
    expect(roster.map((r) => r.churchId)).toEqual([church.id])
  })
})

describe('HTTP routes', () => {
  it('rejects a non-pastor role', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request('/districts/me/roster', { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('a Pastor sees their own district’s roster', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const pastor = await createTestPastor(db, church.districtId)
    const cookie = await loginAs(db, pastor.id)
    const res = await app.request('/districts/me/roster', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ roster: { churchId: number }[] }>()
    expect(body.roster.map((r) => r.churchId)).toContain(church.id)
  })
})
