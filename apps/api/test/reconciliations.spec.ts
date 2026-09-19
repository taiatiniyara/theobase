import { env } from 'cloudflare:test'
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount } from '../src/db/counts'
import { createDistrict } from '../src/db/queries'
import {
  addReconciliationComment,
  confirmDiscrepancyResolution,
  getReconciliationByCountId,
  listCommentsForReconciliation,
  listLinesForReconciliation,
  markReceived,
  markSent,
  proposeDiscrepancyResolution,
  ReconciliationAccessError,
  ReconciliationLineMismatchError,
  ReconciliationStateError,
} from '../src/db/reconciliations'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import { auditLog } from '../src/db/schema'
import app from '../src/index'
import { createTestActor, createTestChurch, loginAs } from './helpers'

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

async function districtOf(db: ReturnType<typeof getDb>, churchId: number) {
  const church = await db.query.churches.findFirst({ where: (ch, { eq }) => eq(ch.id, churchId) })
  return church!.districtId
}

let phoneCounter = 0
function nextPhone() {
  phoneCounter += 1
  return `+679555${String(2000 + phoneCounter)}`
}

let emailCounter = 0
function nextEmail() {
  emailCounter += 1
  return `mission-staff-${emailCounter}@example.test`
}

async function createTestTreasurer(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, {
    displayName: 'Test Treasurer',
    phone: nextPhone(),
    pin: '4321',
    role: 'treasurer',
    churchId,
  })
}

async function createTestClerk(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, {
    displayName: 'Test Clerk',
    phone: nextPhone(),
    pin: '1357',
    role: 'clerk',
    churchId,
  })
}

async function createTestPastor(db: ReturnType<typeof getDb>, districtId: number) {
  return createLocalAccount(db, {
    displayName: 'Test Pastor',
    phone: nextPhone(),
    pin: '2468',
    role: 'pastor',
    districtId,
  })
}

async function createTestMissionStaff(
  db: ReturnType<typeof getDb>,
  missionId: number,
  role: 'mission_admin' | 'mission_staff' = 'mission_staff',
) {
  const actorId = await createTestActor(db)
  return createInstitutionalAccount(
    db,
    { displayName: 'Test Mission Staff', email: nextEmail(), password: 'correct-horse-battery-staple', role, missionId },
    actorId,
  )
}

const NEXT_SATURDAY = '2026-09-19'

// Sets up a church with a fully dual-signed-off count (and therefore a
// 'submitted' reconciliation) plus everyone the test suite needs a
// handle on — the fixture every test below builds from.
async function setupSubmittedCount(db: ReturnType<typeof getDb>) {
  const actorId = await createTestActor(db)
  const church = await createTestChurch(db)
  const missionId = await missionOf(db, church.districtId)
  const categories = await seedDefaultFundCategories(db, missionId, { actorId })
  const tithe = categories.find((c) => c.isTithe)!
  const other = categories.find((c) => c.name === 'Local Church Budget')!
  const treasurer = await createTestTreasurer(db, church.id)
  const coSigner = await createTestClerk(db, church.id)

  const count = await createCount(
    db,
    {
      clientRecordId: `recon-${crypto.randomUUID()}`,
      churchId: church.id,
      enteredByAccountId: treasurer.id,
      coSignerAccountId: coSigner.id,
      sabbathDate: NEXT_SATURDAY,
      recordedAt: new Date().toISOString(),
      lines: [
        { fundCategoryId: tithe.id, amountCents: 10_000 },
        { fundCategoryId: other.id, amountCents: 5_000 },
      ],
    },
    { actorId: treasurer.id },
  )

  const reconciliation = (await getReconciliationByCountId(db, count.id))!
  const missionStaff = await createTestMissionStaff(db, missionId)

  return { church, missionId, categories, tithe, other, treasurer, coSigner, count, reconciliation, missionStaff }
}

describe('createCount side effect: reconciliation row', () => {
  it('creates a submitted reconciliation alongside the count', async () => {
    const db = getDb(env.DB)
    const { count } = await setupSubmittedCount(db)
    const reconciliation = await getReconciliationByCountId(db, count.id)
    expect(reconciliation).toMatchObject({ countId: count.id, status: 'submitted', hasDiscrepancy: false })
  })
})

describe('markSent (Submitted -> In Transit)', () => {
  it('the treasurer marks their own church’s count as sent, with a courier name', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation, count } = await setupSubmittedCount(db)

    const updated = await markSent(db, reconciliation.id, treasurer, 'Bus driver Mika', {
      actorId: treasurer.id,
    })
    expect(updated.status).toBe('in_transit')
    expect(updated.courierName).toBe('Bus driver Mika')
    expect(updated.sentByAccountId).toBe(treasurer.id)
    expect(updated.sentAt).not.toBeNull()

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'reconciliation'), eq(auditLog.entityId, reconciliation.id)))
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ action: 'mark_sent', actorId: treasurer.id })
    expect(JSON.parse(audit[0].metadata as string)).toMatchObject({ countId: count.id, courierName: 'Bus driver Mika' })
  })

  it('courier name is optional', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation } = await setupSubmittedCount(db)
    const updated = await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })
    expect(updated.courierName).toBeNull()
    expect(updated.status).toBe('in_transit')
  })

  it('a same-church Clerk can also mark it sent', async () => {
    const db = getDb(env.DB)
    const { coSigner, reconciliation } = await setupSubmittedCount(db)
    const updated = await markSent(db, reconciliation.id, coSigner, null, { actorId: coSigner.id })
    expect(updated.status).toBe('in_transit')
  })

  it("a district-scoped Pastor can mark another church's count sent", async () => {
    const db = getDb(env.DB)
    const { church, reconciliation } = await setupSubmittedCount(db)
    const pastor = await createTestPastor(db, church.districtId)
    const updated = await markSent(db, reconciliation.id, pastor, null, { actorId: pastor.id })
    expect(updated.status).toBe('in_transit')
  })

  it('rejects an account from an unrelated church', async () => {
    const db = getDb(env.DB)
    const { reconciliation } = await setupSubmittedCount(db)
    const otherChurch = await createTestChurch(db)
    const outsider = await createTestTreasurer(db, otherChurch.id)
    await expect(
      markSent(db, reconciliation.id, outsider, null, { actorId: outsider.id }),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects a Pastor from a *different* district', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const { reconciliation, missionId } = await setupSubmittedCount(db)
    const otherDistrict = await createDistrict(db, missionId, 'Other District', { actorId })
    const otherPastor = await createTestPastor(db, otherDistrict.id)
    await expect(
      markSent(db, reconciliation.id, otherPastor, null, { actorId: otherPastor.id }),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects a Mission staff account even if it happens to share the mission', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation } = await setupSubmittedCount(db)
    await expect(
      markSent(db, reconciliation.id, missionStaff, null, { actorId: missionStaff.id }),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects marking as sent twice', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation } = await setupSubmittedCount(db)
    await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })
    await expect(
      markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id }),
    ).rejects.toThrow(ReconciliationStateError)
  })
})

describe('markReceived (In Transit -> Received)', () => {
  async function setupInTransit(db: ReturnType<typeof getDb>) {
    const fixture = await setupSubmittedCount(db)
    await markSent(db, fixture.reconciliation.id, fixture.treasurer, null, { actorId: fixture.treasurer.id })
    return fixture
  }

  it('rejects receiving before it has been marked sent', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    await expect(
      markReceived(
        db,
        reconciliation.id,
        missionStaff,
        [
          { fundCategoryId: tithe.id, amountCents: 10_000 },
          { fundCategoryId: other.id, amountCents: 5_000 },
        ],
        { actorId: missionStaff.id },
      ),
    ).rejects.toThrow(ReconciliationStateError)
  })

  it('records an exact match with no discrepancy', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation, tithe, other, count } = await setupInTransit(db)

    const updated = await markReceived(
      db,
      reconciliation.id,
      missionStaff,
      [
        { fundCategoryId: tithe.id, amountCents: 10_000 },
        { fundCategoryId: other.id, amountCents: 5_000 },
      ],
      { actorId: missionStaff.id },
    )
    expect(updated.status).toBe('received')
    expect(updated.hasDiscrepancy).toBe(false)
    expect(updated.receivedByAccountId).toBe(missionStaff.id)

    const lines = await listLinesForReconciliation(db, reconciliation.id)
    expect(lines).toHaveLength(2)

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'reconciliation'), eq(auditLog.entityId, reconciliation.id)))
    expect(audit.find((a) => a.action === 'receive')).toMatchObject({ actorId: missionStaff.id })
    expect(JSON.parse(audit.find((a) => a.action === 'receive')!.metadata as string)).toMatchObject({
      countId: count.id,
      hasDiscrepancy: false,
    })
  })

  it('flags a discrepancy when one category is short, even though another matches exactly', async () => {
    // The ticket's core acceptance criterion: per-category comparison
    // catches a mismatch a total-only comparison would hide.
    const db = getDb(env.DB)
    const { missionStaff, reconciliation, tithe, other } = await setupInTransit(db)

    const updated = await markReceived(
      db,
      reconciliation.id,
      missionStaff,
      [
        { fundCategoryId: tithe.id, amountCents: 10_000 }, // matches exactly
        { fundCategoryId: other.id, amountCents: 4_000 }, // short by 1,000
      ],
      { actorId: missionStaff.id },
    )
    expect(updated.hasDiscrepancy).toBe(true)
  })

  it('rejects a received-lines body missing one of the submitted categories', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation, tithe } = await setupInTransit(db)
    await expect(
      markReceived(db, reconciliation.id, missionStaff, [{ fundCategoryId: tithe.id, amountCents: 10_000 }], {
        actorId: missionStaff.id,
      }),
    ).rejects.toThrow(ReconciliationLineMismatchError)
  })

  it('rejects a received-lines body with an extra category not in the submission', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation, tithe, other, categories } = await setupInTransit(db)
    const extra = categories.find((c) => c.name === 'World Budget')!
    await expect(
      markReceived(
        db,
        reconciliation.id,
        missionStaff,
        [
          { fundCategoryId: tithe.id, amountCents: 10_000 },
          { fundCategoryId: other.id, amountCents: 5_000 },
          { fundCategoryId: extra.id, amountCents: 100 },
        ],
        { actorId: missionStaff.id },
      ),
    ).rejects.toThrow(ReconciliationLineMismatchError)
  })

  it('rejects a Mission staffer from an unrelated Mission', async () => {
    const db = getDb(env.DB)
    const { reconciliation, tithe, other } = await setupInTransit(db)
    const unrelatedChurch = await createTestChurch(db)
    const otherMission = await createTestMissionStaff(db, await missionOf(db, unrelatedChurch.districtId))
    await expect(
      markReceived(
        db,
        reconciliation.id,
        otherMission,
        [
          { fundCategoryId: tithe.id, amountCents: 10_000 },
          { fundCategoryId: other.id, amountCents: 5_000 },
        ],
        { actorId: otherMission.id },
      ),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects the treasurer themself trying to mark it received', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation, tithe, other } = await setupInTransit(db)
    await expect(
      markReceived(
        db,
        reconciliation.id,
        treasurer,
        [
          { fundCategoryId: tithe.id, amountCents: 10_000 },
          { fundCategoryId: other.id, amountCents: 5_000 },
        ],
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(ReconciliationAccessError)
  })
})

describe('discrepancy resolution (dual control)', () => {
  async function setupDiscrepancy(db: ReturnType<typeof getDb>) {
    const fixture = await setupSubmittedCount(db)
    await markSent(db, fixture.reconciliation.id, fixture.treasurer, null, { actorId: fixture.treasurer.id })
    await markReceived(
      db,
      fixture.reconciliation.id,
      fixture.missionStaff,
      [
        { fundCategoryId: fixture.tithe.id, amountCents: 10_000 },
        { fundCategoryId: fixture.other.id, amountCents: 4_000 },
      ],
      { actorId: fixture.missionStaff.id },
    )
    const reconciliation = (await getReconciliationByCountId(db, fixture.count.id))!
    return { ...fixture, reconciliation }
  }

  it('rejects proposing a resolution when there is no discrepancy', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })
    await markReceived(
      db,
      reconciliation.id,
      missionStaff,
      [
        { fundCategoryId: tithe.id, amountCents: 10_000 },
        { fundCategoryId: other.id, amountCents: 5_000 },
      ],
      { actorId: missionStaff.id },
    )
    await expect(
      proposeDiscrepancyResolution(db, reconciliation.id, missionStaff, 'Nothing to resolve', {
        actorId: missionStaff.id,
      }),
    ).rejects.toThrow(ReconciliationStateError)
  })

  it('proposes then confirms a resolution, clearing it only once a *different* Mission staffer confirms', async () => {
    const db = getDb(env.DB)
    const { missionId, missionStaff, reconciliation } = await setupDiscrepancy(db)
    const secondStaffer = await createTestMissionStaff(db, missionId, 'mission_admin')

    const proposed = await proposeDiscrepancyResolution(
      db,
      reconciliation.id,
      missionStaff,
      'Recounted at the church; the shortfall was a counting error on our end',
      { actorId: missionStaff.id },
    )
    expect(proposed.discrepancyProposedByAccountId).toBe(missionStaff.id)
    expect(proposed.discrepancyResolvedAt).toBeNull()

    const confirmed = await confirmDiscrepancyResolution(db, reconciliation.id, secondStaffer, {
      actorId: secondStaffer.id,
    })
    expect(confirmed.discrepancyConfirmedByAccountId).toBe(secondStaffer.id)
    expect(confirmed.discrepancyResolvedAt).not.toBeNull()

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'reconciliation'), eq(auditLog.entityId, reconciliation.id)))
    expect(audit.find((a) => a.action === 'propose_resolution')).toMatchObject({
      actorId: missionStaff.id,
      reason: 'Recounted at the church; the shortfall was a counting error on our end',
    })
    expect(audit.find((a) => a.action === 'confirm_resolution')).toMatchObject({ actorId: secondStaffer.id })
  })

  it('rejects the same Mission staffer confirming their own proposal', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation } = await setupDiscrepancy(db)
    await proposeDiscrepancyResolution(db, reconciliation.id, missionStaff, 'Counting error', {
      actorId: missionStaff.id,
    })
    await expect(
      confirmDiscrepancyResolution(db, reconciliation.id, missionStaff, { actorId: missionStaff.id }),
    ).rejects.toThrow(ReconciliationStateError)
  })

  it('rejects confirming before anyone has proposed a resolution', async () => {
    const db = getDb(env.DB)
    const { missionId, reconciliation } = await setupDiscrepancy(db)
    const staffer = await createTestMissionStaff(db, missionId)
    await expect(
      confirmDiscrepancyResolution(db, reconciliation.id, staffer, { actorId: staffer.id }),
    ).rejects.toThrow(ReconciliationStateError)
  })

  it('rejects proposing a second resolution once one is already pending', async () => {
    const db = getDb(env.DB)
    const { missionId, missionStaff, reconciliation } = await setupDiscrepancy(db)
    const another = await createTestMissionStaff(db, missionId)
    await proposeDiscrepancyResolution(db, reconciliation.id, missionStaff, 'Counting error', {
      actorId: missionStaff.id,
    })
    await expect(
      proposeDiscrepancyResolution(db, reconciliation.id, another, 'A different reason', {
        actorId: another.id,
      }),
    ).rejects.toThrow(ReconciliationStateError)
  })
})

describe('church response: discrepancy comments', () => {
  async function setupDiscrepancy(db: ReturnType<typeof getDb>) {
    const fixture = await setupSubmittedCount(db)
    await markSent(db, fixture.reconciliation.id, fixture.treasurer, null, { actorId: fixture.treasurer.id })
    await markReceived(
      db,
      fixture.reconciliation.id,
      fixture.missionStaff,
      [
        { fundCategoryId: fixture.tithe.id, amountCents: 10_000 },
        { fundCategoryId: fixture.other.id, amountCents: 4_000 },
      ],
      { actorId: fixture.missionStaff.id },
    )
    const reconciliation = (await getReconciliationByCountId(db, fixture.count.id))!
    return { ...fixture, reconciliation }
  }

  it('the treasurer can add a comment on a flagged discrepancy, visible to Mission', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation } = await setupDiscrepancy(db)

    const comment = await addReconciliationComment(
      db,
      reconciliation.id,
      treasurer,
      'We recounted, our figure was correct',
      { actorId: treasurer.id },
    )
    expect(comment.body).toBe('We recounted, our figure was correct')

    const comments = await listCommentsForReconciliation(db, reconciliation.id)
    expect(comments).toHaveLength(1)
    expect(comments[0]).toMatchObject({
      authorAccountId: treasurer.id,
      authorDisplayName: 'Test Treasurer',
      body: 'We recounted, our figure was correct',
    })

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'reconciliation'), eq(auditLog.entityId, reconciliation.id)))
    expect(audit.find((a) => a.action === 'comment')).toMatchObject({ actorId: treasurer.id })
  })

  it('a same-church Clerk or district Pastor can also comment', async () => {
    const db = getDb(env.DB)
    const { coSigner, reconciliation } = await setupDiscrepancy(db)
    const comment = await addReconciliationComment(db, reconciliation.id, coSigner, 'Checking with the bank', {
      actorId: coSigner.id,
    })
    expect(comment.authorAccountId).toBe(coSigner.id)
  })

  it('rejects a comment from a Mission staff account', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation } = await setupDiscrepancy(db)
    await expect(
      addReconciliationComment(db, reconciliation.id, missionStaff, 'Trying to comment as Mission', {
        actorId: missionStaff.id,
      }),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects a comment from an unrelated church', async () => {
    const db = getDb(env.DB)
    const { reconciliation } = await setupDiscrepancy(db)
    const otherChurch = await createTestChurch(db)
    const outsider = await createTestTreasurer(db, otherChurch.id)
    await expect(
      addReconciliationComment(db, reconciliation.id, outsider, 'Not my church', { actorId: outsider.id }),
    ).rejects.toThrow(ReconciliationAccessError)
  })

  it('rejects a comment when there is no flagged discrepancy', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    await markSent(db, reconciliation.id, treasurer, null, { actorId: treasurer.id })
    await markReceived(
      db,
      reconciliation.id,
      missionStaff,
      [
        { fundCategoryId: tithe.id, amountCents: 10_000 },
        { fundCategoryId: other.id, amountCents: 5_000 },
      ],
      { actorId: missionStaff.id },
    )
    await expect(
      addReconciliationComment(db, reconciliation.id, treasurer, 'Nothing flagged here', {
        actorId: treasurer.id,
      }),
    ).rejects.toThrow(ReconciliationStateError)
  })
})

describe('HTTP routes', () => {
  it('rejects an unauthenticated mark-sent request', async () => {
    const res = await app.request(
      '/reconciliations/1/mark-sent',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('rejects a Mission staffer trying to mark-sent (wrong role)', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation } = await setupSubmittedCount(db)
    const cookie = await loginAs(db, missionStaff.id)
    const res = await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' },
      env,
    )
    expect(res.status).toBe(403)
  })

  it('treasurer marks sent via HTTP, then Mission staff mark received via HTTP', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    const treasurerCookie = await loginAs(db, treasurer.id)

    const sentRes = await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: treasurerCookie },
        body: JSON.stringify({ courierName: 'Ferry to Suva' }),
      },
      env,
    )
    expect(sentRes.status).toBe(200)
    const sentBody = await sentRes.json<{ reconciliation: { status: string; courierName: string } }>()
    expect(sentBody.reconciliation.status).toBe('in_transit')
    expect(sentBody.reconciliation.courierName).toBe('Ferry to Suva')

    const missionCookie = await loginAs(db, missionStaff.id)
    const receiveRes = await app.request(
      `/reconciliations/${reconciliation.id}/receive`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: missionCookie },
        body: JSON.stringify({
          lines: [
            { fundCategoryId: tithe.id, amountCents: 10_000 },
            { fundCategoryId: other.id, amountCents: 5_000 },
          ],
        }),
      },
      env,
    )
    expect(receiveRes.status).toBe(200)
    const receiveBody = await receiveRes.json<{ reconciliation: { status: string; hasDiscrepancy: boolean } }>()
    expect(receiveBody.reconciliation.status).toBe('received')
    expect(receiveBody.reconciliation.hasDiscrepancy).toBe(false)
  })

  it('returns 409 when marking sent twice via HTTP', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation } = await setupSubmittedCount(db)
    const cookie = await loginAs(db, treasurer.id)
    await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' },
      env,
    )
    const res = await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' },
      env,
    )
    expect(res.status).toBe(409)
  })

  it('full HTTP round trip through a flagged discrepancy and its dual-control resolution', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionId, missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    const secondStaffer = await createTestMissionStaff(db, missionId, 'mission_admin')

    await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: await loginAs(db, treasurer.id) },
        body: '{}',
      },
      env,
    )

    const missionCookie = await loginAs(db, missionStaff.id)
    const receiveRes = await app.request(
      `/reconciliations/${reconciliation.id}/receive`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: missionCookie },
        body: JSON.stringify({
          lines: [
            { fundCategoryId: tithe.id, amountCents: 10_000 },
            { fundCategoryId: other.id, amountCents: 4_500 },
          ],
        }),
      },
      env,
    )
    const receiveBody = await receiveRes.json<{ reconciliation: { hasDiscrepancy: boolean } }>()
    expect(receiveBody.reconciliation.hasDiscrepancy).toBe(true)

    const proposeRes = await app.request(
      `/reconciliations/${reconciliation.id}/discrepancy/propose-resolution`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: missionCookie },
        body: JSON.stringify({ reason: 'In-transit loss, confirmed with courier' }),
      },
      env,
    )
    expect(proposeRes.status).toBe(200)

    // The same staffer trying to confirm their own proposal is rejected.
    const selfConfirmRes = await app.request(
      `/reconciliations/${reconciliation.id}/discrepancy/confirm-resolution`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie: missionCookie }, body: '{}' },
      env,
    )
    expect(selfConfirmRes.status).toBe(409)

    const secondCookie = await loginAs(db, secondStaffer.id)
    const confirmRes = await app.request(
      `/reconciliations/${reconciliation.id}/discrepancy/confirm-resolution`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie: secondCookie }, body: '{}' },
      env,
    )
    expect(confirmRes.status).toBe(200)
    const confirmBody = await confirmRes.json<{ reconciliation: { discrepancyResolvedAt: string } }>()
    expect(confirmBody.reconciliation.discrepancyResolvedAt).not.toBeNull()
  })

  it('rejects a propose-resolution request with no reason', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionStaff, reconciliation, tithe, other } = await setupSubmittedCount(db)
    await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: await loginAs(db, treasurer.id) },
        body: '{}',
      },
      env,
    )
    const missionCookie = await loginAs(db, missionStaff.id)
    await app.request(
      `/reconciliations/${reconciliation.id}/receive`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: missionCookie },
        body: JSON.stringify({
          lines: [
            { fundCategoryId: tithe.id, amountCents: 1 },
            { fundCategoryId: other.id, amountCents: 5_000 },
          ],
        }),
      },
      env,
    )
    const res = await app.request(
      `/reconciliations/${reconciliation.id}/discrepancy/propose-resolution`,
      { method: 'POST', headers: { 'content-type': 'application/json', cookie: missionCookie }, body: '{}' },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('GET /reconciliations/by-count/:countId is visible to the originating church, not just Mission', async () => {
    const db = getDb(env.DB)
    const { treasurer, reconciliation, count, tithe } = await setupSubmittedCount(db)
    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request(`/reconciliations/by-count/${count.id}`, { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{
      reconciliation: { id: number; status: string }
      submittedLines: { fundCategoryId: number; categoryName: string; amountCents: number }[]
    }>()
    expect(body.reconciliation.id).toBe(reconciliation.id)
    expect(body.reconciliation.status).toBe('submitted')
    expect(body.submittedLines).toContainEqual({
      fundCategoryId: tithe.id,
      categoryName: 'Tithe',
      amountCents: 10_000,
    })
  })

  it('GET /reconciliations/by-count/:countId returns 404 for a non-existent count', async () => {
    const db = getDb(env.DB)
    const { treasurer } = await setupSubmittedCount(db)
    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request('/reconciliations/by-count/999999', { headers: { cookie } }, env)
    expect(res.status).toBe(404)
  })

  it('GET /reconciliations/by-count/:countId returns 403 for an account from an unrelated church/mission', async () => {
    const db = getDb(env.DB)
    const { count } = await setupSubmittedCount(db)
    const otherChurch = await createTestChurch(db)
    const outsider = await createTestTreasurer(db, otherChurch.id)
    const cookie = await loginAs(db, outsider.id)
    const res = await app.request(`/reconciliations/by-count/${count.id}`, { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('GET /reconciliations/by-count/:countId returns 403 for a platform-operator (no standing financial-record access by default)', async () => {
    const db = getDb(env.DB)
    const { count } = await setupSubmittedCount(db)
    const platformOperator = await createInstitutionalAccount(db, {
      displayName: 'Platform Operator',
      email: nextEmail(),
      password: 'correct-horse-battery-staple',
      role: 'platform_operator',
    })
    const cookie = await loginAs(db, platformOperator.id)
    const res = await app.request(`/reconciliations/by-count/${count.id}`, { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('posts a comment via HTTP and it shows up in the by-count response for both church and Mission', async () => {
    const db = getDb(env.DB)
    const { treasurer, missionStaff, reconciliation, count, tithe, other } = await setupSubmittedCount(db)
    await app.request(
      `/reconciliations/${reconciliation.id}/mark-sent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: await loginAs(db, treasurer.id) },
        body: '{}',
      },
      env,
    )
    const missionCookie = await loginAs(db, missionStaff.id)
    await app.request(
      `/reconciliations/${reconciliation.id}/receive`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: missionCookie },
        body: JSON.stringify({
          lines: [
            { fundCategoryId: tithe.id, amountCents: 10_000 },
            { fundCategoryId: other.id, amountCents: 4_000 },
          ],
        }),
      },
      env,
    )

    const treasurerCookie = await loginAs(db, treasurer.id)
    const commentRes = await app.request(
      `/reconciliations/${reconciliation.id}/comments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: treasurerCookie },
        body: JSON.stringify({ body: 'We recounted, our figure was correct' }),
      },
      env,
    )
    expect(commentRes.status).toBe(200)

    const missionView = await app.request(
      `/reconciliations/by-count/${count.id}`,
      { headers: { cookie: missionCookie } },
      env,
    )
    const missionBody = await missionView.json<{ comments: { body: string; authorDisplayName: string }[] }>()
    expect(missionBody.comments).toHaveLength(1)
    expect(missionBody.comments[0]).toMatchObject({
      body: 'We recounted, our figure was correct',
      authorDisplayName: 'Test Treasurer',
    })
  })

  it('rejects a Mission staffer trying to post a comment (wrong role)', async () => {
    const db = getDb(env.DB)
    const { missionStaff, reconciliation } = await setupSubmittedCount(db)
    const cookie = await loginAs(db, missionStaff.id)
    const res = await app.request(
      `/reconciliations/${reconciliation.id}/comments`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ body: 'Trying anyway' }),
      },
      env,
    )
    expect(res.status).toBe(403)
  })
})
