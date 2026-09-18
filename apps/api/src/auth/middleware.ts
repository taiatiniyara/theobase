import type { Context, Next } from 'hono'
import { getDb } from '../db/client'
import type { accounts } from '../db/schema'
import { getSessionAccount } from './session'
import type { Role } from './roles'

export type Account = typeof accounts.$inferSelect

// The Hono generics any route using these middleware needs — carries
// the authenticated account set by requireAuth so requireRole (and the
// route handler itself) can read it back via c.get('account').
export type AppEnv = {
  Bindings: CloudflareBindings
  Variables: { account: Account }
}

// Acceptance criterion from #9: permission checks are server-enforced,
// not just UI-hidden. This is that enforcement point — every
// role-gated route runs requireAuth then requireRole, both real Hono
// middleware, not a client-side check.
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const db = getDb(c.env.DB)
  const account = await getSessionAccount(c, db, c.env.SESSION_SECRET)
  if (!account) {
    return c.json({ error: 'not authenticated' }, 401)
  }
  c.set('account', account)
  await next()
}

export function requireRole(...roles: Role[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const account = c.get('account')
    if (!roles.includes(account.role as Role)) {
      return c.json({ error: 'forbidden' }, 403)
    }
    await next()
  }
}
