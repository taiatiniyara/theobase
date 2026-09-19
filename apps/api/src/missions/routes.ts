import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { getDb } from '../db/client'
import { getMissionExceptions, getMissionSettings, updateStuckReconciliationThreshold } from '../db/missions'

interface UpdateSettingsBody {
  stuckReconciliationThresholdDays?: unknown
}

export const missionsRoutes = new Hono<AppEnv>()

// Always the caller's own Mission — there is deliberately no missionId
// in the request, the same reasoning countsRoutes uses for churchId:
// accepting one from the client and checking it would be a second,
// separate thing to get right, when using the session's own missionId
// closes off "can I read/configure another Mission" by construction.
// Viewable by both Mission tiers (Staff needs to know the current
// threshold even though only Admin can change it); requireRole below
// is the one thing that differs between GET and PATCH.
missionsRoutes.get('/me/settings', requireAuth, requireRole('mission_admin', 'mission_staff'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const settings = await getMissionSettings(db, account.missionId as number)
  return c.json({ settings })
})

// Mission Admin only — see CONTEXT.md > UI/UX > Mission-level staff/CFO
// role's tier split: Admin configures Mission-wide settings, Staff
// handle day-to-day reconciliation work but can't touch config.
missionsRoutes.patch('/me/settings', requireAuth, requireRole('mission_admin'), async (c) => {
  const body = await c.req.json<UpdateSettingsBody>().catch(() => ({}) as UpdateSettingsBody)
  const days = body.stuckReconciliationThresholdDays
  if (typeof days !== 'number' || !Number.isInteger(days) || days <= 0) {
    return c.json({ error: 'stuckReconciliationThresholdDays must be a positive integer' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  await updateStuckReconciliationThreshold(db, account.missionId as number, days, { actorId: account.id })
  const settings = await getMissionSettings(db, account.missionId as number)
  return c.json({ settings })
})

// The exceptions tab (#16) — both Mission tiers do day-to-day
// reconciliation work (marking received, resolving discrepancies), so
// both can see what currently needs attention.
missionsRoutes.get('/me/exceptions', requireAuth, requireRole('mission_admin', 'mission_staff'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const exceptions = await getMissionExceptions(db, account.missionId as number)
  return c.json(exceptions)
})
