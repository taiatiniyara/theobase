import { eq } from 'drizzle-orm'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { churches, districts, missions } from './schema'

export async function createMission(db: Database, name: string, ctx: AuditContext) {
  const [mission] = await db.insert(missions).values({ name }).returning()
  await recordAudit(db, 'mission', mission.id, 'create', ctx)
  return mission
}

export async function createDistrict(
  db: Database,
  missionId: number,
  name: string,
  ctx: AuditContext,
) {
  const [district] = await db.insert(districts).values({ missionId, name }).returning()
  await recordAudit(db, 'district', district.id, 'create', ctx)
  return district
}

export async function createChurch(
  db: Database,
  districtId: number,
  name: string,
  ctx: AuditContext,
) {
  const [church] = await db.insert(churches).values({ districtId, name }).returning()
  await recordAudit(db, 'church', church.id, 'create', ctx)
  return church
}

export function listDistrictsForMission(db: Database, missionId: number) {
  return db.select().from(districts).where(eq(districts.missionId, missionId))
}

export function listChurchesForDistrict(db: Database, districtId: number) {
  return db.select().from(churches).where(eq(churches.districtId, districtId))
}

export function listChurchesForMission(db: Database, missionId: number) {
  return db
    .select({
      id: churches.id,
      districtId: churches.districtId,
      name: churches.name,
      createdAt: churches.createdAt,
    })
    .from(churches)
    .innerJoin(districts, eq(churches.districtId, districts.id))
    .where(eq(districts.missionId, missionId))
}
