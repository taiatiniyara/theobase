import { and, eq, inArray, isNull, or } from 'drizzle-orm'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { listChurchesForMission } from './queries'
import { counts, missions, reconciliations } from './schema'

// One expected count per Sabbath — a known, certain cadence, unlike
// stuck-reconciliation staleness below — so this is a plain constant
// per CONTEXT.md's settled decision, not a Mission-level setting.
const MISSED_SABBATHS_TO_FLAG = 2

export async function getMissionSettings(db: Database, missionId: number) {
  const mission = await db.query.missions.findFirst({ where: eq(missions.id, missionId) })
  return mission ? { stuckReconciliationThresholdDays: mission.stuckReconciliationThresholdDays } : null
}

export async function updateStuckReconciliationThreshold(
  db: Database,
  missionId: number,
  days: number,
  ctx: AuditContext,
) {
  await db.update(missions).set({ stuckReconciliationThresholdDays: days }).where(eq(missions.id, missionId))
  await recordAudit(db, 'mission', missionId, 'update_settings', {
    ...ctx,
    metadata: { stuckReconciliationThresholdDays: days },
  })
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// Same "most recent Saturday" rule as the count-entry form (apps/web's
// date.ts), computed in UTC here instead of local time — this runs
// server-side across every church in a Mission at once, so there's no
// single "whose timezone" to anchor it to, matching how counts/routes.ts
// already treats Sabbath dates as UTC calendar dates for validation.
// Returns the most recent `count` Sabbaths, newest first. Exported so
// tests can compute the exact dates a given `now` implies rather than
// re-deriving the same date math independently.
export function recentSaturdaysUTC(now: Date, count: number): string[] {
  const daysSinceSaturday = (now.getUTCDay() + 1) % 7 // Sat=6->0, Sun=0->1, ...
  const mostRecent = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceSaturday),
  )
  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(mostRecent)
    d.setUTCDate(d.getUTCDate() - i * 7)
    dates.push(isoDate(d))
  }
  return dates
}

export interface MissionExceptions {
  missingCount: { churchId: number; churchName: string; missedSabbaths: string[] }[]
  stuckReconciliation: {
    reconciliationId: number
    countId: number
    churchId: number
    churchName: string
    status: string
    daysStuck: number
  }[]
  discrepancies: {
    reconciliationId: number
    countId: number
    churchId: number
    churchName: string
    flaggedAt: string | null
  }[]
}

// The shared core behind both the Mission exceptions tab (#16, every
// church in a Mission) and the Pastor's district roster (#19, every
// church in one district) — everything below only needs "which
// churches am I scoped to," never a Mission or District id directly,
// so the same per-church Sabbath-cadence and staleness math serves
// both without duplicating it. See CONTEXT.md > UI/UX > Exceptions tab
// overdue thresholds for why missing-count and stuck-reconciliation
// are two independent signals rather than one unified "overdue"
// concept — their cadence certainty is genuinely different.
export async function computeExceptionsForChurches(
  db: Database,
  churchList: { id: number; name: string; createdAt: string }[],
  thresholdDays: number,
  now: Date,
): Promise<MissionExceptions> {
  const churchNameById = new Map(churchList.map((c) => [c.id, c.name]))
  const churchIds = churchList.map((c) => c.id)
  if (churchIds.length === 0) {
    return { missingCount: [], stuckReconciliation: [], discrepancies: [] }
  }

  // --- Missing weekly count: both of the last 2 expected Sabbaths absent ---
  const sabbaths = recentSaturdaysUTC(now, MISSED_SABBATHS_TO_FLAG)
  const oldestExpected = sabbaths[sabbaths.length - 1]
  const missingCount: MissionExceptions['missingCount'] = []
  for (const church of churchList) {
    // A church that didn't exist yet as of the older expected Sabbath
    // hasn't actually missed anything — it just hasn't had the chance
    // to record a count yet.
    if (new Date(church.createdAt).getTime() > new Date(`${oldestExpected}T23:59:59Z`).getTime()) continue

    const rows = await db
      .select({ sabbathDate: counts.sabbathDate })
      .from(counts)
      .where(and(eq(counts.churchId, church.id), inArray(counts.sabbathDate, sabbaths)))
    const present = new Set(rows.map((r) => r.sabbathDate))
    if (sabbaths.every((s) => !present.has(s))) {
      missingCount.push({ churchId: church.id, churchName: church.name, missedSabbaths: sabbaths })
    }
  }

  // --- Stuck reconciliation: still Submitted/In Transit past the threshold ---
  const stuckRows = await db
    .select({
      reconciliationId: reconciliations.id,
      countId: reconciliations.countId,
      status: reconciliations.status,
      createdAt: reconciliations.createdAt,
      churchId: counts.churchId,
    })
    .from(reconciliations)
    .innerJoin(counts, eq(counts.id, reconciliations.countId))
    .where(
      and(
        inArray(counts.churchId, churchIds),
        or(eq(reconciliations.status, 'submitted'), eq(reconciliations.status, 'in_transit')),
      ),
    )

  const stuckReconciliation: MissionExceptions['stuckReconciliation'] = []
  for (const row of stuckRows) {
    const ageDays = (now.getTime() - new Date(row.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays >= thresholdDays) {
      stuckReconciliation.push({
        reconciliationId: row.reconciliationId,
        countId: row.countId,
        churchId: row.churchId,
        churchName: churchNameById.get(row.churchId) ?? 'Unknown church',
        status: row.status,
        daysStuck: Math.floor(ageDays),
      })
    }
  }

  // --- Unresolved discrepancies ---
  const discrepancyRows = await db
    .select({
      reconciliationId: reconciliations.id,
      countId: reconciliations.countId,
      churchId: counts.churchId,
      flaggedAt: reconciliations.receivedAt,
    })
    .from(reconciliations)
    .innerJoin(counts, eq(counts.id, reconciliations.countId))
    .where(
      and(
        inArray(counts.churchId, churchIds),
        eq(reconciliations.hasDiscrepancy, true),
        isNull(reconciliations.discrepancyResolvedAt),
      ),
    )

  const discrepancies: MissionExceptions['discrepancies'] = discrepancyRows.map((row) => ({
    reconciliationId: row.reconciliationId,
    countId: row.countId,
    churchId: row.churchId,
    churchName: churchNameById.get(row.churchId) ?? 'Unknown church',
    flaggedAt: row.flaggedAt,
  }))

  return { missingCount, stuckReconciliation, discrepancies }
}

export async function getMissionExceptions(
  db: Database,
  missionId: number,
  now = new Date(),
): Promise<MissionExceptions> {
  const mission = await db.query.missions.findFirst({ where: eq(missions.id, missionId) })
  const threshold = mission?.stuckReconciliationThresholdDays ?? 45
  const churchList = await listChurchesForMission(db, missionId)
  return computeExceptionsForChurches(db, churchList, threshold, now)
}
