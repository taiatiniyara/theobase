import { Hono } from 'hono'
import { createCount } from '../db/counts'
import { getDb } from '../db/client'
import { listActiveFundCategoriesForChurch } from '../db/fundCategories'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'

function isValidDateString(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

// Parsed as UTC to avoid the server's local timezone shifting which
// calendar day a date-only string falls on.
function isSaturday(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.getUTCDay() === 6
}

interface CreateCountLineBody {
  fundCategoryId?: unknown
  amountCents?: unknown
}

interface CreateCountBody {
  clientRecordId?: unknown
  sabbathDate?: unknown
  recordedAt?: unknown
  lines?: unknown
}

function validateCreateCountBody(
  body: CreateCountBody,
): { ok: true; value: { clientRecordId: string; sabbathDate: string; recordedAt: string; lines: { fundCategoryId: number; amountCents: number }[] } } | { ok: false; error: string } {
  if (typeof body.clientRecordId !== 'string' || body.clientRecordId.length === 0) {
    return { ok: false, error: 'clientRecordId is required' }
  }
  if (!isValidDateString(body.sabbathDate)) {
    return { ok: false, error: 'sabbathDate must be YYYY-MM-DD' }
  }
  if (!isSaturday(body.sabbathDate)) {
    return { ok: false, error: 'sabbathDate must be a Saturday (the Sabbath)' }
  }
  if (typeof body.recordedAt !== 'string' || Number.isNaN(Date.parse(body.recordedAt))) {
    return { ok: false, error: 'recordedAt must be a valid ISO timestamp' }
  }
  if (!Array.isArray(body.lines)) {
    return { ok: false, error: 'lines must be an array' }
  }
  const lines: { fundCategoryId: number; amountCents: number }[] = []
  for (const raw of body.lines as CreateCountLineBody[]) {
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
  return {
    ok: true,
    value: {
      clientRecordId: body.clientRecordId,
      sabbathDate: body.sabbathDate,
      recordedAt: body.recordedAt,
      lines,
    },
  }
}

export const countsRoutes = new Hono<AppEnv>()

// Treasurer-only, and always scoped to the treasurer's own church —
// there is deliberately no churchId in the request. Accepting one from
// the client and checking it against the account would be a second,
// separate thing to get right; using the session's own churchId
// closes off "can I submit into someone else's church" by construction
// instead.
countsRoutes.get('/categories', requireAuth, requireRole('treasurer'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  // churchId is typed nullable (it's shared across all roles), but
  // requireRole('treasurer') plus the accounts_scope_matches_role CHECK
  // constraint together guarantee a treasurer account always has one.
  const categories = await listActiveFundCategoriesForChurch(db, account.churchId as number)
  return c.json({ categories })
})

countsRoutes.post('/', requireAuth, requireRole('treasurer'), async (c) => {
  const body = await c.req.json<CreateCountBody>().catch(() => ({}) as CreateCountBody)
  const validated = validateCreateCountBody(body)
  if (!validated.ok) {
    return c.json({ error: validated.error }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  const count = await createCount(
    db,
    {
      clientRecordId: validated.value.clientRecordId,
      churchId: account.churchId as number,
      enteredByAccountId: account.id,
      sabbathDate: validated.value.sabbathDate,
      recordedAt: validated.value.recordedAt,
      lines: validated.value.lines,
    },
    { actorId: account.id },
  )

  return c.json({ count })
})
