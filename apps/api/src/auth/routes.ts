import { Hono } from 'hono'
import { getDb } from '../db/client'
import { attemptInstitutionalLogin, attemptLocalLogin } from './login'
import { type Account, type AppEnv, requireAuth } from './middleware'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getCurrentSessionId,
  setSessionCookie,
} from './session'

function publicAccount(account: Account) {
  return {
    id: account.id,
    displayName: account.displayName,
    accountType: account.accountType,
    role: account.role,
    churchId: account.churchId,
    districtId: account.districtId,
    missionId: account.missionId,
  }
}

export const auth = new Hono<AppEnv>()

auth.post('/local/login', async (c) => {
  const body = await c.req
    .json<{ phone?: string; pin?: string }>()
    .catch(() => ({}) as { phone?: string; pin?: string })
  if (!body.phone || !body.pin) {
    return c.json({ error: 'phone and pin are required' }, 400)
  }

  const db = getDb(c.env.DB)
  const result = await attemptLocalLogin(db, body.phone, body.pin)
  if (!result.ok) {
    return c.json(
      { error: result.reason },
      result.reason === 'locked' ? 423 : 401,
    )
  }

  const session = await createSession(db, result.accountId)
  await setSessionCookie(c, session.id, c.env.SESSION_SECRET)
  const account = await db.query.accounts.findFirst({
    where: (a, { eq }) => eq(a.id, result.accountId),
  })
  return c.json({ account: publicAccount(account as Account) })
})

auth.post('/institutional/login', async (c) => {
  const body = await c.req
    .json<{ email?: string; password?: string }>()
    .catch(() => ({}) as { email?: string; password?: string })
  if (!body.email || !body.password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const db = getDb(c.env.DB)
  const result = await attemptInstitutionalLogin(db, body.email, body.password)
  if (!result.ok) {
    return c.json(
      { error: result.reason },
      result.reason === 'locked' ? 423 : 401,
    )
  }

  const session = await createSession(db, result.accountId)
  await setSessionCookie(c, session.id, c.env.SESSION_SECRET)
  const account = await db.query.accounts.findFirst({
    where: (a, { eq }) => eq(a.id, result.accountId),
  })
  return c.json({ account: publicAccount(account as Account) })
})

auth.post('/logout', async (c) => {
  const db = getDb(c.env.DB)
  const sessionId = await getCurrentSessionId(c, c.env.SESSION_SECRET)
  if (sessionId) {
    await deleteSession(db, sessionId)
  }
  clearSessionCookie(c)
  return c.json({ ok: true })
})

auth.get('/me', requireAuth, async (c) => {
  return c.json({ account: publicAccount(c.get('account')) })
})
