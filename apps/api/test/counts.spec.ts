import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createInstitutionalAccount, createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount, IneligibleCoSignerError, listLinesForCount } from '../src/db/counts'
import { createDistrict } from '../src/db/queries'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import { auditLog } from '../src/db/schema'
import { and, eq } from 'drizzle-orm'
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
  return `+679555${String(1000 + phoneCounter)}`
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

const NEXT_SATURDAY = '2026-09-19' // a real Saturday; verified against today's date (2026-09-18, a Friday)
const A_SUNDAY = '2026-09-20'

describe('createCount (domain layer)', () => {
  it('inserts the count and its lines, and audit-logs the create with the co-signer', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const tithe = categories.find((c) => c.isTithe)!
    const budget = categories.find((c) => c.name === 'Local Church Budget')!
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)

    const count = await createCount(
      db,
      {
        clientRecordId: 'client-abc-1',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: coSigner.id,
        sabbathDate: NEXT_SATURDAY,
        recordedAt: new Date().toISOString(),
        lines: [
          { fundCategoryId: tithe.id, amountCents: 12_345 },
          { fundCategoryId: budget.id, amountCents: 6_789 },
        ],
      },
      { actorId: treasurer.id },
    )

    expect(count.coSignerAccountId).toBe(coSigner.id)

    const lines = await listLinesForCount(db, count.id)
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.amountCents).sort((a, b) => a - b)).toEqual([6_789, 12_345])

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'count'), eq(auditLog.entityId, count.id)))
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ actorId: treasurer.id, action: 'create' })
    expect(JSON.parse(audit[0].metadata as string)).toMatchObject({ coSignerAccountId: coSigner.id })
  })

  it('is idempotent by clientRecordId — a retried sync does not duplicate the record', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)

    const input = {
      clientRecordId: 'client-retry-1',
      churchId: church.id,
      enteredByAccountId: treasurer.id,
      coSignerAccountId: coSigner.id,
      sabbathDate: NEXT_SATURDAY,
      recordedAt: new Date().toISOString(),
      lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
    }

    const first = await createCount(db, input, { actorId: treasurer.id })
    const second = await createCount(db, input, { actorId: treasurer.id })
    expect(second.id).toBe(first.id)

    // Only one audit entry, not two, since the retry was a no-op.
    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'count'), eq(auditLog.entityId, first.id)))
    expect(audit).toHaveLength(1)
  })
})

describe('createCount — co-signer eligibility', () => {
  it('rejects the treasurer co-signing their own count', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)

    await expect(
      createCount(
        db,
        {
          clientRecordId: 'self-cosign',
          churchId: church.id,
          enteredByAccountId: treasurer.id,
          coSignerAccountId: treasurer.id,
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        },
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(IneligibleCoSignerError)
  })

  it('rejects a co-signer id that does not exist', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)

    await expect(
      createCount(
        db,
        {
          clientRecordId: 'no-such-cosigner',
          churchId: church.id,
          enteredByAccountId: treasurer.id,
          coSignerAccountId: 999_999,
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        },
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(IneligibleCoSignerError)
  })

  it('rejects a co-signer from a different, unrelated church', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const otherChurch = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const unrelatedTreasurer = await createTestTreasurer(db, otherChurch.id)

    await expect(
      createCount(
        db,
        {
          clientRecordId: 'wrong-church-cosigner',
          churchId: church.id,
          enteredByAccountId: treasurer.id,
          coSignerAccountId: unrelatedTreasurer.id,
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        },
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(IneligibleCoSignerError)
  })

  it('rejects an institutional account even if its mission happens to match', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const treasurer = await createTestTreasurer(db, church.id)
    const missionAdmin = await createInstitutionalAccount(
      db,
      {
        displayName: 'Mission Admin',
        email: 'admin-no-cosign@example.test',
        password: 'correct-horse-battery-staple',
        role: 'mission_admin',
        missionId,
      },
      actorId,
    )

    await expect(
      createCount(
        db,
        {
          clientRecordId: 'institutional-cosigner',
          churchId: church.id,
          enteredByAccountId: treasurer.id,
          coSignerAccountId: missionAdmin.id,
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        },
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(IneligibleCoSignerError)
  })

  it('accepts a Clerk at the same church', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const clerk = await createTestClerk(db, church.id)

    const count = await createCount(
      db,
      {
        clientRecordId: 'clerk-cosign',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: clerk.id,
        sabbathDate: NEXT_SATURDAY,
        recordedAt: new Date().toISOString(),
        lines: [],
      },
      { actorId: treasurer.id },
    )
    expect(count.coSignerAccountId).toBe(clerk.id)
  })

  it('accepts a district-scoped Pastor co-signing at any church in their district', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const districtId = await districtOf(db, church.id)
    const treasurer = await createTestTreasurer(db, church.id)
    const pastor = await createTestPastor(db, districtId)

    const count = await createCount(
      db,
      {
        clientRecordId: 'pastor-cosign',
        churchId: church.id,
        enteredByAccountId: treasurer.id,
        coSignerAccountId: pastor.id,
        sabbathDate: NEXT_SATURDAY,
        recordedAt: new Date().toISOString(),
        lines: [],
      },
      { actorId: treasurer.id },
    )
    expect(count.coSignerAccountId).toBe(pastor.id)
  })

  it("rejects a Pastor from a *different* district", async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const missionId = await missionOf(db, church.districtId)
    const otherDistrict = await createDistrict(db, missionId, 'Other District', { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const otherPastor = await createTestPastor(db, otherDistrict.id)

    await expect(
      createCount(
        db,
        {
          clientRecordId: 'wrong-district-pastor',
          churchId: church.id,
          enteredByAccountId: treasurer.id,
          coSignerAccountId: otherPastor.id,
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        },
        { actorId: treasurer.id },
      ),
    ).rejects.toThrow(IneligibleCoSignerError)
  })
})

describe('POST /counts', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await app.request(
      '/counts',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      env,
    )
    expect(res.status).toBe(401)
  })

  it('rejects a non-treasurer role', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const clerk = await createTestClerk(db, church.id)
    const cookie = await loginAs(db, clerk.id)

    const res = await app.request(
      '/counts',
      { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{}' },
      env,
    )
    expect(res.status).toBe(403)
  })

  it('rejects a non-Saturday sabbathDate', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          clientRecordId: 'c-1',
          sabbathDate: A_SUNDAY,
          recordedAt: new Date().toISOString(),
          coSignerAccountId: coSigner.id,
          lines: [],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects a negative amount', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          clientRecordId: 'c-2',
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          coSignerAccountId: coSigner.id,
          lines: [{ fundCategoryId: categories[0].id, amountCents: -1 }],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects a missing coSignerAccountId', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          clientRecordId: 'c-no-cosigner',
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          lines: [],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects the treasurer naming themselves as the co-signer', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          clientRecordId: 'c-self-cosign',
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          coSignerAccountId: treasurer.id,
          lines: [],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('rejects an ineligible co-signer at a different church', async () => {
    const db = getDb(env.DB)
    const church = await createTestChurch(db)
    const otherChurch = await createTestChurch(db)
    const treasurer = await createTestTreasurer(db, church.id)
    const unrelated = await createTestTreasurer(db, otherChurch.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          clientRecordId: 'c-ineligible-cosigner',
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          coSignerAccountId: unrelated.id,
          lines: [],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it("accepts a valid submission and always uses the treasurer's own church, ignoring any churchId in the body", async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const otherChurch = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const treasurer = await createTestTreasurer(db, church.id)
    const coSigner = await createTestClerk(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request(
      '/counts',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          churchId: otherChurch.id, // deliberately trying to smuggle a different church
          clientRecordId: 'c-3',
          sabbathDate: NEXT_SATURDAY,
          recordedAt: new Date().toISOString(),
          coSignerAccountId: coSigner.id,
          lines: [{ fundCategoryId: categories[0].id, amountCents: 500 }],
        }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = await res.json<{ count: { churchId: number; coSignerAccountId: number } }>()
    expect(body.count.churchId).toBe(church.id)
    expect(body.count.churchId).not.toBe(otherChurch.id)
    expect(body.count.coSignerAccountId).toBe(coSigner.id)
  })
})

describe('GET /counts/categories', () => {
  it("returns only the categories active for the treasurer's own church, plus church context", async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    await seedDefaultFundCategories(db, await missionOf(db, church.districtId), { actorId })
    const treasurer = await createTestTreasurer(db, church.id)
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request('/counts/categories', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{
      categories: { name: string }[]
      church: { id: number; districtId: number }
      account: { id: number }
    }>()
    expect(body.categories).toHaveLength(9)
    expect(body.church).toEqual({ id: church.id, districtId: church.districtId })
    expect(body.account).toEqual({ id: treasurer.id })
  })
})
