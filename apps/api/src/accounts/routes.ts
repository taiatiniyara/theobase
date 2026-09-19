import { Hono } from 'hono'
import { type AppEnv, requireAuth, requireRole } from '../auth/middleware'
import type { LocalRole } from '../auth/roles'
import { getDb } from '../db/client'
import {
  approveRemovalRequest,
  createLocalAccountAtChurch,
  createRemovalRequest,
  editLocalAccount,
  listLocalAccountsForChurch,
  listPendingRemovalRequestsForDistrict,
  LocalAccountAccessError,
  LocalAccountNotFoundError,
  LocalAccountValidationError,
  rejectRemovalRequest,
  RemovalRequestAccessError,
  RemovalRequestNotFoundError,
  RemovalRequestStateError,
} from '../db/localAccounts'

interface CreateAccountBody {
  displayName?: unknown
  phone?: unknown
  pin?: unknown
  role?: unknown
}

interface EditAccountBody {
  displayName?: unknown
  phone?: unknown
  pin?: unknown
}

interface RejectBody {
  reason?: unknown
}

export const accountsRoutes = new Hono<AppEnv>()

// Clerk's settings-tab account list (#18) — always the caller's own
// church.
accountsRoutes.get('/me/church', requireAuth, requireRole('clerk'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const churchAccounts = await listLocalAccountsForChurch(db, account.churchId as number)
  return c.json({ accounts: churchAccounts })
})

accountsRoutes.post('/me/church', requireAuth, requireRole('clerk'), async (c) => {
  const body = await c.req.json<CreateAccountBody>().catch(() => ({}) as CreateAccountBody)
  if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
    return c.json({ error: 'displayName is required' }, 400)
  }
  if (typeof body.phone !== 'string' || body.phone.trim().length === 0) {
    return c.json({ error: 'phone is required' }, 400)
  }
  if (typeof body.pin !== 'string') {
    return c.json({ error: 'pin is required' }, 400)
  }
  if (body.role !== 'treasurer' && body.role !== 'clerk') {
    return c.json({ error: "role must be 'treasurer' or 'clerk'" }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  try {
    const created = await createLocalAccountAtChurch(
      db,
      account,
      { displayName: body.displayName, phone: body.phone, pin: body.pin, role: body.role as LocalRole },
      { actorId: account.id },
    )
    return c.json({ account: created })
  } catch (err) {
    if (err instanceof LocalAccountValidationError) return c.json({ error: err.message }, 400)
    throw err
  }
})

accountsRoutes.patch('/:id', requireAuth, requireRole('clerk'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'invalid id' }, 400)
  }
  const body = await c.req.json<EditAccountBody>().catch(() => ({}) as EditAccountBody)
  if (body.displayName !== undefined && (typeof body.displayName !== 'string' || body.displayName.trim().length === 0)) {
    return c.json({ error: 'displayName must be a non-empty string' }, 400)
  }
  if (body.phone !== undefined && (typeof body.phone !== 'string' || body.phone.trim().length === 0)) {
    return c.json({ error: 'phone must be a non-empty string' }, 400)
  }
  if (body.pin !== undefined && typeof body.pin !== 'string') {
    return c.json({ error: 'pin must be a string' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  try {
    const updated = await editLocalAccount(
      db,
      account,
      id,
      { displayName: body.displayName, phone: body.phone, pin: body.pin },
      { actorId: account.id },
    )
    return c.json({ account: updated })
  } catch (err) {
    if (err instanceof LocalAccountNotFoundError) return c.json({ error: err.message }, 404)
    if (err instanceof LocalAccountAccessError) return c.json({ error: err.message }, 403)
    if (err instanceof LocalAccountValidationError) return c.json({ error: err.message }, 400)
    throw err
  }
})

// First half of the Pastor removal sign-off flow — see CONTEXT.md >
// UI/UX > Local account management / Pastor account-removal sign-off
// flow. The target account stays fully active until a Pastor actually
// approves (see the /approve route below) — this call only records the
// request.
accountsRoutes.post('/:id/removal-requests', requireAuth, requireRole('clerk'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'invalid id' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  try {
    const request = await createRemovalRequest(db, account, id, { actorId: account.id })
    return c.json({ request })
  } catch (err) {
    if (err instanceof LocalAccountNotFoundError) return c.json({ error: err.message }, 404)
    if (err instanceof LocalAccountAccessError) return c.json({ error: err.message }, 403)
    if (err instanceof LocalAccountValidationError) return c.json({ error: err.message }, 400)
    if (err instanceof RemovalRequestStateError) return c.json({ error: err.message }, 409)
    throw err
  }
})

// The Pastor's side — district-wide, per CONTEXT.md's district-scoped
// oversight. This is the passive "attention card" data source (#18):
// no push notification infra for MVP, just something to see next time
// the Pastor opens the app.
accountsRoutes.get('/removal-requests/pending', requireAuth, requireRole('pastor'), async (c) => {
  const db = getDb(c.env.DB)
  const account = c.get('account')
  const requests = await listPendingRemovalRequestsForDistrict(db, account.districtId as number)
  return c.json({ requests })
})

accountsRoutes.post('/removal-requests/:id/approve', requireAuth, requireRole('pastor'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'invalid id' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  try {
    const request = await approveRemovalRequest(db, account, id, { actorId: account.id })
    return c.json({ request })
  } catch (err) {
    if (err instanceof RemovalRequestNotFoundError) return c.json({ error: err.message }, 404)
    if (err instanceof RemovalRequestAccessError) return c.json({ error: err.message }, 403)
    if (err instanceof RemovalRequestStateError) return c.json({ error: err.message }, 409)
    throw err
  }
})

accountsRoutes.post('/removal-requests/:id/reject', requireAuth, requireRole('pastor'), async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: 'invalid id' }, 400)
  }
  const body = await c.req.json<RejectBody>().catch(() => ({}) as RejectBody)
  if (typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    return c.json({ error: 'reason is required' }, 400)
  }

  const db = getDb(c.env.DB)
  const account = c.get('account')
  try {
    const request = await rejectRemovalRequest(db, account, id, body.reason, { actorId: account.id })
    return c.json({ request })
  } catch (err) {
    if (err instanceof RemovalRequestNotFoundError) return c.json({ error: err.message }, 404)
    if (err instanceof RemovalRequestAccessError) return c.json({ error: err.message }, 403)
    if (err instanceof RemovalRequestStateError) return c.json({ error: err.message }, 409)
    throw err
  }
})
