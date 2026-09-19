import { Hono } from 'hono'
import { ensureLocalVerifierSeed } from './accounts'
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
  // Earns this device the account's local-verifier seed on every
  // successful login, not just the first ever — see #23. A device
  // that already cached it gets the same value back (ensureLocalVerifierSeed
  // is idempotent), so re-deriving is a harmless no-op.
  const localVerifierSeed = await ensureLocalVerifierSeed(db, result.accountId)
  const account = await db.query.accounts.findFirst({
    where: (a, { eq }) => eq(a.id, result.accountId),
  })
  return c.json({ account: publicAccount(account as Account), localVerifierSeed })
})

// Verifies a *different* local account's PIN without creating a
// session for it — the primitive dual sign-off's co-signer check (#12)
// needs: the treasurer stays logged in, but the second counter's own
// PIN gets checked. Requires the caller to already be authenticated as
// someone (this is invoked mid-session, never from a logged-out
// state); it does not require the caller and the target account to be
// the same person, or check any relationship between them — co-signer
// eligibility (who's allowed to confirm which count) is #12's concern,
// enforced there, not here. Shares attemptLocalLogin's lockout
// tracking with full login, since this is still "prove you know this
// PIN" against the same secret.
auth.post('/local/verify-pin', requireAuth, async (c) => {
  const body = await c.req
    .json<{ phone?: string; pin?: string }>()
    .catch(() => ({}) as { phone?: string; pin?: string })
  if (!body.phone || !body.pin) {
    return c.json({ error: 'phone and pin are required' }, 400)
  }

  const db = getDb(c.env.DB)
  const result = await attemptLocalLogin(db, body.phone, body.pin)
  if (!result.ok) {
    return c.json({ error: result.reason }, result.reason === 'locked' ? 423 : 401)
  }

  const localVerifierSeed = await ensureLocalVerifierSeed(db, result.accountId)
  const account = await db.query.accounts.findFirst({
    where: (a, { eq }) => eq(a.id, result.accountId),
  })
  return c.json({ account: publicAccount(account as Account), localVerifierSeed })
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
