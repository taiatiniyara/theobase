import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { getDb } from '../db/client'
import { listChurchRecords } from '../db/churches'
import { listFundCategoriesWithChurchToggle, setChurchFundCategoryEnabled } from '../db/fundCategories'

interface ToggleCategoryBody {
  enabled?: unknown
}

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

// Clerk's settings-tab category toggles (#18) — "Clerk can enable/
// disable any category from the Mission's master list for their
// church at will, no blocking approval" per CONTEXT.md. Clerk-only
// (Treasurer's role is entering counts, not configuring what's
// counted), always the caller's own church.
churchesRoutes.get('/me/categories', requireAuth, requireRole('clerk'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const categories = await listFundCategoriesWithChurchToggle(db, account.churchId as number)
  return c.json({ categories })
})

churchesRoutes.patch('/me/categories/:categoryId', requireAuth, requireRole('clerk'), async (c) => {
  const categoryId = Number(c.req.param('categoryId'))
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    return c.json({ error: 'invalid categoryId' }, 400)
  }
  const body = await c.req.json<ToggleCategoryBody>().catch(() => ({}) as ToggleCategoryBody)
  if (typeof body.enabled !== 'boolean') {
    return c.json({ error: 'enabled must be a boolean' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  await setChurchFundCategoryEnabled(db, account.churchId as number, categoryId, body.enabled, {
    actorId: account.id,
  })
  const categories = await listFundCategoriesWithChurchToggle(db, account.churchId as number)
  return c.json({ categories })
})
