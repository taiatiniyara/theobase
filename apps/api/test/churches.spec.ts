import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount } from '../src/db/counts'
import { listChurchRecords } from '../src/db/churches'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import app from '../src/index'
import { createTestActor, createTestChurch, loginAs } from './helpers'

let phoneCounter = 0
function nextPhone() {
  phoneCounter += 1
  return `+679555${String(4000 + phoneCounter)}`
}

async function createTestTreasurer(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Treasurer', phone: nextPhone(), pin: '4321', role: 'treasurer', churchId })
}

async function createTestClerk(db: ReturnType<typeof getDb>, churchId: number) {
  return createLocalAccount(db, { displayName: 'Test Clerk', phone: nextPhone(), pin: '1357', role: 'clerk', churchId })
}

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

describe('listChurchRecords', () => {
  it('returns every record for the church, most recent Sabbath first, with the correct total', async () => {
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
        clientRecordId: 'church-records-1',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [
          { fundCategoryId: categories[0].id, amountCents: 1_000 },
          { fundCategoryId: categories[1].id, amountCents: 2_000 },
        ],
      },
      { actorId: treasurer.id },
    )
    await createCount(
      db,
      {
        clientRecordId: 'church-records-2',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-12',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 500 }],
      },
      { actorId: treasurer.id },
    )

    const records = await listChurchRecords(db, church.id)
    expect(records).toHaveLength(2)
    // Most recent Sabbath first.
    expect(records[0]).toMatchObject({ sabbathDate: '2026-09-12', totalAmountCents: 500, status: 'submitted' })
    expect(records[1]).toMatchObject({ sabbathDate: '2026-09-05', totalAmountCents: 3_000, status: 'submitted' })
  })

  it('shows all of the church’s records, not filtered to who entered them', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurerA = await createTestTreasurer(db, church.id)
    const treasurerB = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)

    await createCount(
      db,
      {
        clientRecordId: 'church-records-entered-by-a',
        churchId: church.id,
        enteredByAccountId: treasurerA.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurerA.id },
    )

    // treasurerB (a different account at the same church) should still
    // see treasurerA's record.
    const records = await listChurchRecords(db, church.id)
    expect(records.map((r) => r.sabbathDate)).toContain('2026-09-05')
    void treasurerB
  })

  it('does not include another church’s records', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const churchA = await createTestChurch(db)
    const churchB = await createTestChurch(db)
    const missionId = await missionOf(db, churchA.districtId)
    const categories = await seedDefaultFundCategories(db, missionId, { actorId })
    const treasurerA = await createTestTreasurer(db, churchA.id)
    const coSignerA = await createTestClerk(db, churchA.id)

    await createCount(
      db,
      {
        clientRecordId: 'church-a-only',
        churchId: churchA.id,
        enteredByAccountId: treasurerA.id,
        coSignerAccountId: coSignerA.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurerA.id },
    )

    expect(await listChurchRecords(db, churchB.id)).toEqual([])
  })
})

describe('HTTP routes', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await app.request('/churches/me/records', {}, env)
    expect(res.status).toBe(401)
  })

  it('rejects a Mission account', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const actorId = await createTestActor(db)
    const missionStaff = await createInstitutionalAccount(
      db,
      { displayName: 'Test Mission Staff', email: 'church-records-mission@example.test', password: 'correct-horse-battery-staple', role: 'mission_staff', missionId },
      actorId,
    )
    const cookie = await loginAs(db, missionStaff.id)
    const res = await app.request('/churches/me/records', { headers: { cookie } }, env)
    expect(res.status).toBe(403)
  })

  it('a treasurer sees their own church’s records', async () => {
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
        clientRecordId: 'church-http-1',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurer.id },
    )

    const cookie = await loginAs(db, treasurer.id)
    const res = await app.request('/churches/me/records', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ records: { sabbathDate: string; totalAmountCents: number }[] }>()
    expect(body.records).toHaveLength(1)
    expect(body.records[0]).toMatchObject({ sabbathDate: '2026-09-05', totalAmountCents: 100 })
  })

  it('a clerk at the same church sees the same records', async () => {
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
        clientRecordId: 'church-http-clerk',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: '2026-09-05',
        recordedAt: new Date().toISOString(),
        lines: [{ fundCategoryId: categories[0].id, amountCents: 100 }],
      },
      { actorId: treasurer.id },
    )

    const cookie = await loginAs(db, coSigner.id)
    const res = await app.request('/churches/me/records', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ records: unknown[] }>()
    expect(body.records).toHaveLength(1)
  })
})
