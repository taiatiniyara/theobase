import { eq } from 'drizzle-orm'
import { listChurchRecords } from './churches'
import type { Database } from './client'
import { computeExceptionsForChurches } from './missions'
import { listChurchesForDistrict } from './queries'
import { districts, missions } from './schema'

export interface DistrictChurchStatus {
  churchId: number
  churchName: string
  // The most recent record's own compact badge — same status shape
  // ChurchRecordsView (#17) renders per-row, just one row per church
  // instead of one per record. null means the church has never
  // recorded a count.
  latestRecord: {
    countId: number
    sabbathDate: string
    status: 'submitted' | 'in_transit' | 'received'
    hasDiscrepancy: boolean
    discrepancyResolvedAt: string | null
  } | null
  missingCount: boolean
  hasStuckReconciliation: boolean
  hasUnresolvedDiscrepancy: boolean
}

// The Pastor's home screen (#19) — see CONTEXT.md > UI/UX >
// District-level roles: "a district-wide roster of all churches in
// their district (status badges, same pattern as the Mission roster,
// just scoped smaller)." The Mission roster itself is #20 (not yet
// built); this establishes that shared badge pattern, reusing #16's
// exception computation (computeExceptionsForChurches) scoped to one
// district's churches instead of a whole Mission's.
export async function listChurchesForDistrictWithStatus(
  db: Database,
  districtId: number,
  now = new Date(),
): Promise<DistrictChurchStatus[]> {
  const district = await db.query.districts.findFirst({ where: eq(districts.id, districtId) })
  const mission = district
    ? await db.query.missions.findFirst({ where: eq(missions.id, district.missionId) })
    : null
  const threshold = mission?.stuckReconciliationThresholdDays ?? 45

  const churchList = await listChurchesForDistrict(db, districtId)
  const exceptions = await computeExceptionsForChurches(db, churchList, threshold, now)
  const missingCountIds = new Set(exceptions.missingCount.map((m) => m.churchId))
  const stuckChurchIds = new Set(exceptions.stuckReconciliation.map((s) => s.churchId))
  const discrepancyChurchIds = new Set(exceptions.discrepancies.map((d) => d.churchId))

  const rows: DistrictChurchStatus[] = []
  for (const church of churchList) {
    const records = await listChurchRecords(db, church.id)
    const latest = records[0]
    rows.push({
      churchId: church.id,
      churchName: church.name,
      latestRecord: latest
        ? {
            countId: latest.countId,
            sabbathDate: latest.sabbathDate,
            status: latest.status,
            hasDiscrepancy: latest.hasDiscrepancy,
            discrepancyResolvedAt: latest.discrepancyResolvedAt,
          }
        : null,
      missingCount: missingCountIds.has(church.id),
      hasStuckReconciliation: stuckChurchIds.has(church.id),
      hasUnresolvedDiscrepancy: discrepancyChurchIds.has(church.id),
    })
  }
  return rows
}
