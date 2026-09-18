import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { getDb } from '../src/db/client'
import {
  createChurch,
  createDistrict,
  createMission,
  listChurchesForDistrict,
  listChurchesForMission,
  listDistrictsForMission,
} from '../src/db/queries'

describe('org hierarchy', () => {
  it('supports "all districts in a mission" and "all churches in a district"', async () => {
    const db = getDb(env.DB)
    const ctx = { actorId: 1 }

    const mission = await createMission(db, 'Fiji Mission', ctx)
    const districtA = await createDistrict(db, mission.id, 'District A', ctx)
    const districtB = await createDistrict(db, mission.id, 'District B', ctx)
    await createChurch(db, districtA.id, 'Church A1', ctx)
    await createChurch(db, districtA.id, 'Church A2', ctx)
    await createChurch(db, districtB.id, 'Church B1', ctx)

    const districtsInMission = await listDistrictsForMission(db, mission.id)
    expect(districtsInMission.map((d) => d.name).sort()).toEqual(['District A', 'District B'])

    const churchesInA = await listChurchesForDistrict(db, districtA.id)
    expect(churchesInA.map((c) => c.name).sort()).toEqual(['Church A1', 'Church A2'])

    const allChurchesInMission = await listChurchesForMission(db, mission.id)
    expect(allChurchesInMission.map((c) => c.name).sort()).toEqual([
      'Church A1',
      'Church A2',
      'Church B1',
    ])
  })

  it('keeps districts/churches scoped to their own mission/district', async () => {
    const db = getDb(env.DB)
    const ctx = { actorId: 1 }

    const missionA = await createMission(db, 'Mission A', ctx)
    const missionB = await createMission(db, 'Mission B', ctx)
    await createDistrict(db, missionA.id, 'A District', ctx)
    await createDistrict(db, missionB.id, 'B District', ctx)

    const districtsForA = await listDistrictsForMission(db, missionA.id)
    expect(districtsForA).toHaveLength(1)
    expect(districtsForA[0].name).toBe('A District')
  })
})
