import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import { canAccessChurch } from '../auth/scope'
import { getDb } from '../db/client'
import { countLines, counts, fundCategories } from '../db/schema'
import {
  addReconciliationComment,
  confirmDiscrepancyResolution,
  getReconciliationByCountId,
  listCommentsForReconciliation,
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

interface CommentBody {
  body?: unknown
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

// Category names, not just ids, joined in here rather than making the
// detail screen (#15) fetch them separately — the treasurer-only
// /counts/categories endpoint isn't callable by a Mission account
// viewing the same record, and there's no reason both audiences
// shouldn't get everything they need to render this screen in one
// request.
function listSubmittedLinesWithCategoryNames(db: ReturnType<typeof getDb>, countId: number) {
  return db
    .select({
      fundCategoryId: countLines.fundCategoryId,
      categoryName: fundCategories.name,
      amountCents: countLines.amountCents,
    })
    .from(countLines)
    .innerJoin(fundCategories, eq(fundCategories.id, countLines.fundCategoryId))
    .where(eq(countLines.countId, countId))
}

// Visible to both Mission and the originating local church — see
// CONTEXT.md's "not Mission-only" transparency note — but *not* to
// everyone who happens to be authenticated: canAccessChurch is the
// same org-scope check the action endpoints below use, and it already
// returns false for platform_operator by construction — see
// CONTEXT.md > UI/UX > Platform-operator role's "no standing access to
// any Mission's actual financial records ... by default." A read is
// still a read of real tithe/offering amounts, so it gets the same
// scope check any write here does, not a looser one.
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
  const count = await db.query.counts.findFirst({ where: eq(counts.id, countId) })
  const account = c.get('account')
  if (!count || !(await canAccessChurch(db, account, count.churchId))) {
    return c.json({ error: 'forbidden' }, 403)
  }
  const [submittedLines, receivedLines, comments] = await Promise.all([
    listSubmittedLinesWithCategoryNames(db, countId),
    listLinesForReconciliation(db, reconciliation.id),
    listCommentsForReconciliation(db, reconciliation.id),
  ])
  return c.json({ reconciliation, submittedLines, receivedLines, comments })
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
  '/:id/comments',
  requireAuth,
  requireRole('treasurer', 'clerk', 'pastor'),
  async (c) => {
    const id = Number(c.req.param('id'))
    if (!Number.isInteger(id) || id <= 0) {
      return c.json({ error: 'invalid id' }, 400)
    }
    const body = await c.req.json<CommentBody>().catch(() => ({}) as CommentBody)
    if (typeof body.body !== 'string' || body.body.trim().length === 0) {
      return c.json({ error: 'body is required' }, 400)
    }

    const db = getDb(c.env.DB)
    const account = c.get('account')
    try {
      const comment = await addReconciliationComment(db, id, account, body.body, { actorId: account.id })
      return c.json({ comment })
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
