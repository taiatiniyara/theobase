import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { getDb } from '../db/client'
import { listChurchesForDistrictWithStatus } from '../db/districts'

export const districtsRoutes = new Hono<AppEnv>()

// Always the caller's own district — there is deliberately no
// districtId in the request, the same "closes off acting on another
// district by construction" reasoning countsRoutes/churchesRoutes/
// missionsRoutes already use for their own scope columns.
districtsRoutes.get('/me/roster', requireAuth, requireRole('pastor'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const roster = await listChurchesForDistrictWithStatus(db, account.districtId as number)
  return c.json({ roster })
})
