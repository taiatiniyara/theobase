import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createLocalAccount } from '../src/auth/accounts'
import { getDb } from '../src/db/client'
import { createCount, listLinesForCount } from '../src/db/counts'
import { seedDefaultFundCategories } from '../src/db/fundCategories'
import { auditLog } from '../src/db/schema'
import { and, eq } from 'drizzle-orm'
import app from '../src/index'
import { createTestActor, createTestChurch, loginAs } from './helpers'

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

async function createTestTreasurer(db: ReturnType<typeof getDb>, churchId: number, phone: string) {
  return createLocalAccount(db, {
    displayName: 'Test Treasurer',
    phone,
    pin: '4321',
    role: 'treasurer',
    churchId,
  })
}

const NEXT_SATURDAY = '2026-09-19' // a real Saturday; verified against today's date (2026-09-18, a Friday)
const A_SUNDAY = '2026-09-20'

describe('createCount (domain layer)', () => {
  it('inserts the count and its lines, and audit-logs the create', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const tithe = categories.find((c) => c.isTithe)!
    const budget = categories.find((c) => c.name === 'Local Church Budget')!

    const count = await createCount(
      db,
      {
        clientRecordId: 'client-abc-1',
        churchId: church.id,
        enteredByAccountId: actorId,
        sabbathDate: NEXT_SATURDAY,
        recordedAt: new Date().toISOString(),
        lines: [
          { fundCategoryId: tithe.id, amountCents: 12_345 },
          { fundCategoryId: budget.id, amountCents: 6_789 },
        ],
      },
      { actorId },
    )

    const lines = await listLinesForCount(db, count.id)
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.amountCents).sort((a, b) => a - b)).toEqual([6_789, 12_345])

    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'count'), eq(auditLog.entityId, count.id)))
    expect(audit).toHaveLength(1)
    expect(audit[0]).toMatchObject({ actorId, action: 'create' })
  })

  it('is idempotent by clientRecordId — a retried sync does not duplicate the record', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })

    const input = {
      clientRecordId: 'client-retry-1',
      churchId: church.id,
      enteredByAccountId: actorId,
      sabbathDate: NEXT_SATURDAY,
      recordedAt: new Date().toISOString(),
      lines: [{ fundCategoryId: categories[0].id, amountCents: 1_000 }],
    }

    const first = await createCount(db, input, { actorId })
    const second = await createCount(db, input, { actorId })
    expect(second.id).toBe(first.id)

    // Only one audit entry, not two, since the retry was a no-op.
    const audit = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'count'), eq(auditLog.entityId, first.id)))
    expect(audit).toHaveLength(1)
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
    const clerk = await createLocalAccount(db, {
      displayName: 'A Clerk',
      phone: '+6795550001',
      pin: '1111',
      role: 'clerk',
      churchId: church.id,
    })
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
    const treasurer = await createTestTreasurer(db, church.id, '+6795550002')
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
    const treasurer = await createTestTreasurer(db, church.id, '+6795550003')
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
          lines: [{ fundCategoryId: categories[0].id, amountCents: -1 }],
        }),
      },
      env,
    )
    expect(res.status).toBe(400)
  })

  it('accepts a valid submission and always uses the treasurer\'s own church, ignoring any churchId in the body', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const otherChurch = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const treasurer = await createTestTreasurer(db, church.id, '+6795550004')
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
          lines: [{ fundCategoryId: categories[0].id, amountCents: 500 }],
        }),
      },
      env,
    )
    expect(res.status).toBe(200)
    const body = await res.json<{ count: { churchId: number } }>()
    expect(body.count.churchId).toBe(church.id)
    expect(body.count.churchId).not.toBe(otherChurch.id)
  })
})

describe('GET /counts/categories', () => {
  it('returns only the categories active for the treasurer\'s own church', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    await seedDefaultFundCategories(db, await missionOf(db, church.districtId), { actorId })
    const treasurer = await createTestTreasurer(db, church.id, '+6795550005')
    const cookie = await loginAs(db, treasurer.id)

    const res = await app.request('/counts/categories', { headers: { cookie } }, env)
    expect(res.status).toBe(200)
    const body = await res.json<{ categories: { name: string }[] }>()
    expect(body.categories).toHaveLength(9)
  })
})
