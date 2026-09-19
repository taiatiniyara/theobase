import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { getDb } from '../db/client'
import { listChurchRecords } from '../db/churches'

export const churchesRoutes = new Hono<AppEnv>()

// Always the caller's own church — there is deliberately no churchId
// in the request, the same "closes off acting on another church by
// construction" reasoning countsRoutes already uses for the treasurer's
// own churchId. Both treasurer and clerk can reach this: it's the
// shared oversight-view data source for #17's history tab and #18's
// Clerk landing screen (see db/churches.ts's listChurchRecords).
churchesRoutes.get('/me/records', requireAuth, requireRole('treasurer', 'clerk'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const records = await listChurchRecords(db, account.churchId as number)
  return c.json({ records })
})
