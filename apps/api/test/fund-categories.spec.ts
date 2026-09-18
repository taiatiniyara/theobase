import { env } from 'cloudflare:test'
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { getDb } from '../src/db/client'
import {
  createFundCategory,
  deactivateFundCategory,
  listActiveFundCategoriesForChurch,
  listFundCategoriesForMission,
  seedDefaultFundCategories,
  setChurchFundCategoryEnabled,
} from '../src/db/fundCategories'
import { createChurch, createDistrict } from '../src/db/queries'
import { auditLog, churchFundCategories } from '../src/db/schema'
import { createTestActor, createTestChurch, createTestMission } from './helpers'

async function missionOf(db: ReturnType<typeof getDb>, districtId: number) {
  const district = await db.query.districts.findFirst({ where: (d, { eq }) => eq(d.id, districtId) })
  return district!.missionId
}

describe('seedDefaultFundCategories', () => {
  it('creates the standard reference list, with exactly Tithe marked isTithe', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createTestMission(db)

    const created = await seedDefaultFundCategories(db, mission.id, { actorId })
    expect(created).toHaveLength(9)
    expect(created.every((c) => c.missionId === mission.id)).toBe(true)
    expect(created.every((c) => c.active)).toBe(true)

    const titheCategories = created.filter((c) => c.isTithe)
    expect(titheCategories).toHaveLength(1)
    expect(titheCategories[0].name).toBe('Tithe')
  })
})

describe('createFundCategory', () => {
  it('scopes name uniqueness to the mission, not globally', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const missionA = await createTestMission(db)
    const missionB = await createTestMission(db)

    await createFundCategory(db, missionA.id, 'Building Fund', false, { actorId })
    // Same name, different mission — must succeed.
    await expect(
      createFundCategory(db, missionB.id, 'Building Fund', false, { actorId }),
    ).resolves.toBeTruthy()
    // Same name, same mission — must fail (unique index).
    await expect(
      createFundCategory(db, missionA.id, 'Building Fund', false, { actorId }),
    ).rejects.toThrow()
  })

  it('records an audit_log entry', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createTestMission(db)

    const category = await createFundCategory(db, mission.id, 'Youth Ministries', false, {
      actorId,
    })

    const rows = await db
      .select()
      .from(auditLog)
      .where(and(eq(auditLog.entityType, 'fund_category'), eq(auditLog.entityId, category.id)))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ actorId, action: 'create' })
  })
})

describe('deactivateFundCategory', () => {
  it('soft-deletes: the row stays queryable by id, just excluded from the active list', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createTestMission(db)
    const category = await createFundCategory(db, mission.id, 'One-off Campaign', false, {
      actorId,
    })

    await deactivateFundCategory(db, category.id, { actorId })

    const active = await listFundCategoriesForMission(db, mission.id)
    expect(active.map((c) => c.id)).not.toContain(category.id)

    const all = await listFundCategoriesForMission(db, mission.id, { includeInactive: true })
    const found = all.find((c) => c.id === category.id)
    expect(found).toBeTruthy()
    expect(found?.active).toBe(false)
  })
})

describe('per-church toggles', () => {
  it('defaults every active mission category to enabled for a church with no overrides', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    await seedDefaultFundCategories(db, await missionOf(db, church.districtId), { actorId })

    const active = await listActiveFundCategoriesForChurch(db, church.id)
    expect(active).toHaveLength(9)
  })

  it('excludes a category a Clerk has disabled for that specific church', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const ingathering = categories.find((c) => c.name === 'Ingathering')!

    await setChurchFundCategoryEnabled(db, church.id, ingathering.id, false, { actorId })

    const active = await listActiveFundCategoriesForChurch(db, church.id)
    expect(active.map((c) => c.id)).not.toContain(ingathering.id)
    expect(active).toHaveLength(8)
  })

  it('does not affect a different church in the same mission', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const churchA = await createTestChurch(db)
    const missionA = await missionOf(db, churchA.districtId)
    // A second church under the *same* mission.
    const district2 = await createDistrict(db, missionA, 'District Two', { actorId })
    const churchB = await createChurch(db, district2.id, 'Church B', { actorId })

    const categories = await seedDefaultFundCategories(db, missionA, { actorId })
    const worldBudget = categories.find((c) => c.name === 'World Budget')!

    await setChurchFundCategoryEnabled(db, churchA.id, worldBudget.id, false, { actorId })

    const activeForA = await listActiveFundCategoriesForChurch(db, churchA.id)
    const activeForB = await listActiveFundCategoriesForChurch(db, churchB.id)
    expect(activeForA.map((c) => c.id)).not.toContain(worldBudget.id)
    expect(activeForB.map((c) => c.id)).toContain(worldBudget.id)
  })

  it('re-enabling brings a category back, and repeated toggles do not create duplicate rows', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const tithe = categories.find((c) => c.isTithe)!

    await setChurchFundCategoryEnabled(db, church.id, tithe.id, false, { actorId })
    await setChurchFundCategoryEnabled(db, church.id, tithe.id, true, { actorId })
    await setChurchFundCategoryEnabled(db, church.id, tithe.id, false, { actorId })

    const rows = await db
      .select()
      .from(churchFundCategories)
      .where(
        and(
          eq(churchFundCategories.churchId, church.id),
          eq(churchFundCategories.fundCategoryId, tithe.id),
        ),
      )
    expect(rows).toHaveLength(1)
    expect(rows[0].enabled).toBe(false)

    const active = await listActiveFundCategoriesForChurch(db, church.id)
    expect(active.map((c) => c.id)).not.toContain(tithe.id)
  })

  it('records an audit_log entry naming the church for each toggle', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const church = await createTestChurch(db)
    const categories = await seedDefaultFundCategories(db, await missionOf(db, church.districtId), {
      actorId,
    })
    const tithe = categories.find((c) => c.isTithe)!

    await setChurchFundCategoryEnabled(db, church.id, tithe.id, false, { actorId })

    const rows = await db
      .select()
      .from(auditLog)
      .where(
        and(eq(auditLog.entityType, 'church_fund_category'), eq(auditLog.entityId, tithe.id)),
      )
    expect(rows).toHaveLength(1)
    expect(rows[0].action).toBe('disable')
    expect(JSON.parse(rows[0].metadata as string)).toMatchObject({ churchId: church.id })
  })
})
