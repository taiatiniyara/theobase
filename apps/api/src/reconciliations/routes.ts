import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { getDb } from '../db/client'
import { listLinesForCount } from '../db/counts'
import {
  confirmDiscrepancyResolution,
  getReconciliationByCountId,
  listLinesForReconciliation,
  markReceived,
  markSent,
  proposeDiscrepancyResolution,
  ReconciliationAccessError,
  ReconciliationLineMismatchError,
  ReconciliationNotFoundError,
  ReconciliationStateError,
} from '../db/reconciliations'

interface MarkSentBody {
  courierName?: unknown
}

interface ReceiveLineBody {
  fundCategoryId?: unknown
  amountCents?: unknown
}

interface ReceiveBody {
  lines?: unknown
}

interface ProposeResolutionBody {
  reason?: unknown
}

function validateReceiveBody(
  body: ReceiveBody,
): { ok: true; value: { fundCategoryId: number; amountCents: number }[] } | { ok: false; error: string } {
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return { ok: false, error: 'lines must be a non-empty array' }
  }
  const lines: { fundCategoryId: number; amountCents: number }[] = []
  for (const raw of body.lines as ReceiveLineBody[]) {
    const fundCategoryId = raw.fundCategoryId
    const amountCents = raw.amountCents
    if (typeof fundCategoryId !== 'number' || !Number.isInteger(fundCategoryId) || fundCategoryId <= 0) {
      return { ok: false, error: 'each line needs a valid fundCategoryId' }
    }
    if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 0) {
      return { ok: false, error: 'each line needs a non-negative integer amountCents' }
    }
    lines.push({ fundCategoryId, amountCents })
  }
  return { ok: true, value: lines }
}

export const reconciliationsRoutes = new Hono<AppEnv>()

// Visible to both Mission and the originating local church — see
// CONTEXT.md's "not Mission-only" transparency note — so this reads
// through db/counts.ts's own listLinesForCount rather than gating on
// role, the same way countsRoutes' own routes don't split by role
// beyond requireAuth. Access is still scoped: db/reconciliations.ts's
// action endpoints below check org-scope, but a plain read here is
// intentionally the one thing this ticket doesn't further restrict —
// the reconciliation detail screen (#15) is what actually renders this
// for either audience.
reconciliationsRoutes.get('/by-count/:countId', requireAuth, async (c) => {
  const countId = Number(c.req.param('countId'))
  if (!Number.isInteger(countId) || countId <= 0) {
    return c.json({ error: 'invalid countId' }, 400)
  }
  const db = getDb(c.env.DB)
  const reconciliation = await getReconciliationByCountId(db, countId)
  if (!reconciliation) {
    return c.json({ error: 'not found' }, 404)
  }
  const [submittedLines, receivedLines] = await Promise.all([
    listLinesForCount(db, countId),
    listLinesForReconciliation(db, reconciliation.id),
  ])
  return c.json({ reconciliation, submittedLines, receivedLines })
})

reconciliationsRoutes.post(
  '/:id/mark-sent',
  requireAuth,
  requireRole('treasurer', 'clerk', 'pastor'),
  async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'invalid id' }, 400)
    }
    const body = await c.req.json<MarkSentBody>().catch(() => ({}) as MarkSentBody)
    if (body.courierName !== undefined && typeof body.courierName !== 'string') {
      return c.json({ error: 'courierName must be a string' }, 400)
    }

    const db = getDb(c.env.DB)
    const account = c.get('account')
    try {
      const reconciliation = await markSent(db, id, account, body.courierName ?? null, {
        actorId: account.id,
      })
      return c.json({ reconciliation })
    } catch (err) {
      if (err instanceof ReconciliationNotFoundError) return c.json({ error: err.message }, 404)
      if (err instanceof ReconciliationAccessError) return c.json({ error: err.message }, 403)
      if (err instanceof ReconciliationStateError) return c.json({ error: err.message }, 409)
      throw err
    }
  },
)

reconciliationsRoutes.post(
  '/:id/receive',
  requireAuth,
  requireRole('mission_admin', 'mission_staff'),
  async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'invalid id' }, 400)
    }
    const body = await c.req.json<ReceiveBody>().catch(() => ({}) as ReceiveBody)
    const validated = validateReceiveBody(body)
    if (!validated.ok) {
      return c.json({ error: validated.error }, 400)
    }

    const db = getDb(c.env.DB)
    const account = c.get('account')
    try {
      const reconciliation = await markReceived(db, id, account, validated.value, { actorId: account.id })
      return c.json({ reconciliation })
    } catch (err) {
      if (err instanceof ReconciliationNotFoundError) return c.json({ error: err.message }, 404)
      if (err instanceof ReconciliationAccessError) return c.json({ error: err.message }, 403)
      if (err instanceof ReconciliationStateError) return c.json({ error: err.message }, 409)
      if (err instanceof ReconciliationLineMismatchError) return c.json({ error: err.message }, 400)
      throw err
    }
  },
)

reconciliationsRoutes.post(
  '/:id/discrepancy/propose-resolution',
  requireAuth,
  requireRole('mission_admin', 'mission_staff'),
  async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'invalid id' }, 400)
    }
    const body = await c.req.json<ProposeResolutionBody>().catch(() => ({}) as ProposeResolutionBody)
    if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
      return c.json({ error: 'reason is required' }, 400)
    }

    const db = getDb(c.env.DB)
    const account = c.get('account')
    try {
      const reconciliation = await proposeDiscrepancyResolution(db, id, account, body.reason, {
        actorId: account.id,
      })
      return c.json({ reconciliation })
    } catch (err) {
      if (err instanceof ReconciliationNotFoundError) return c.json({ error: err.message }, 404)
      if (err instanceof ReconciliationAccessError) return c.json({ error: err.message }, 403)
      if (err instanceof ReconciliationStateError) return c.json({ error: err.message }, 409)
      throw err
    }
  },
)

reconciliationsRoutes.post(
  '/:id/discrepancy/confirm-resolution',
  requireAuth,
  requireRole('mission_admin', 'mission_staff'),
  async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'invalid id' }, 400)
    }

    const db = getDb(c.env.DB)
    const account = c.get('account')
    try {
      const reconciliation = await confirmDiscrepancyResolution(db, id, account, { actorId: account.id })
      return c.json({ reconciliation })
    } catch (err) {
      if (err instanceof ReconciliationNotFoundError) return c.json({ error: err.message }, 404)
      if (err instanceof ReconciliationAccessError) return c.json({ error: err.message }, 403)
      if (err instanceof ReconciliationStateError) return c.json({ error: err.message }, 409)
      throw err
    }
  },
)
