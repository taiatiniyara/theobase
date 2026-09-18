import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import type { Database } from '../db/client'
import { sessions } from '../db/schema'
import { findAccountById } from './accounts'
import { generateToken } from './crypto'

export const SESSION_COOKIE = 'theobase_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// One session model shared by both login flows (local phone+PIN and
// institutional email+password) — callers elsewhere (role/permission
// checks in #9, etc.) only ever need to deal with this, never with
// which flow the account logged in through.
export async function createSession(db: Database, accountId: number) {
  const id = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await db.insert(sessions).values({ id, accountId, expiresAt })
  return { id, expiresAt }
}

export async function setSessionCookie(c: Context, sessionId: string, secret: string) {
  await setSignedCookie(c, SESSION_COOKIE, sessionId, secret, {
    httpOnly: true,
    secure: true,
    // 'Lax' rather than 'None': the intended production topology puts
    // the web app and API on subdomains of one apex domain (same
    // "site" for cookie purposes even though cross-origin), which Lax
    // already allows for fetch()-initiated same-site requests. If the
    // web app and API ever end up on genuinely different sites (e.g.
    // separate *.pages.dev / *.workers.dev domains with no custom
    // domain), this needs to become 'None' alongside explicit
    // (non-wildcard) CORS origins + credentials — see src/index.ts.
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

async function deleteExpiredSession(db: Database, sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

// Resolves the current request's session cookie to its account, or
// null if there's no session, the cookie's signature doesn't verify,
// or the session has expired. Expired sessions are lazily deleted
// (not audit-logged — this is routine housekeeping, not a mutating
// action on the entity itself).
export async function getSessionAccount(c: Context, db: Database, secret: string) {
  const sessionId = await getSignedCookie(c, secret, SESSION_COOKIE)
  if (!sessionId) return null

  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) })
  if (!session) return null

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await deleteExpiredSession(db, session.id)
    return null
  }

  const account = await findAccountById(db, session.accountId)
  return account ?? null
}

export async function deleteSession(db: Database, sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function getCurrentSessionId(c: Context, secret: string) {
  const sessionId = await getSignedCookie(c, secret, SESSION_COOKIE)
  return sessionId || null
}
