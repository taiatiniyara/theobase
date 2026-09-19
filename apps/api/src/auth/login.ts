import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { accounts } from '../db/schema'
import { findAccountByEmail, findAccountByPhone } from './accounts'
import { verifySecret } from './crypto'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export type LoginResult =
  | { ok: true; accountId: number }
  | { ok: false; reason: 'invalid_credentials' | 'locked' }

function isLocked(account: { lockedUntil: string | null }): boolean {
  return account.lockedUntil !== null && new Date(account.lockedUntil).getTime() > Date.now()
}

// Login-attempt bookkeeping (failed_login_attempts, locked_until) is
// routine security housekeeping on the account row itself, not a
// domain record — it deliberately isn't written to audit_log, which
// would otherwise fill up with every mistyped PIN.
async function recordFailedAttempt(db: Database, accountId: number, currentAttempts: number) {
  const attempts = currentAttempts + 1
  const lockedUntil =
    attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null
  await db
    .update(accounts)
    .set({ failedLoginAttempts: attempts, lockedUntil })
    .where(eq(accounts.id, accountId))
}

async function recordSuccessfulLogin(db: Database, accountId: number) {
  await db
    .update(accounts)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(accounts.id, accountId))
}

export async function attemptLocalLogin(
  db: Database,
  phone: string,
  pin: string,
): Promise<LoginResult> {
  const account = await findAccountByPhone(db, phone)
  if (!account || !account.active) {
    // A removed account (#18) is treated exactly like "no such
    // account" — same constant-time no-op, same generic reason — so a
    // login attempt can't be used to learn that a phone number used to
    // belong to a real, now-deactivated account.
    await verifySecret(pin, null) // constant-time no-op — see verifySecret's DUMMY_HASH
    return { ok: false, reason: 'invalid_credentials' }
  }
  if (isLocked(account)) {
    return { ok: false, reason: 'locked' }
  }
  const valid = await verifySecret(pin, account.pinHash)
  if (!valid) {
    await recordFailedAttempt(db, account.id, account.failedLoginAttempts)
    return { ok: false, reason: 'invalid_credentials' }
  }
  await recordSuccessfulLogin(db, account.id)
  return { ok: true, accountId: account.id }
}

export async function attemptInstitutionalLogin(
  db: Database,
  email: string,
  password: string,
): Promise<LoginResult> {
  const account = await findAccountByEmail(db, email)
  if (!account || !account.active) {
    await verifySecret(password, null)
    return { ok: false, reason: 'invalid_credentials' }
  }
  if (isLocked(account)) {
    return { ok: false, reason: 'locked' }
  }
  const valid = await verifySecret(password, account.passwordHash)
  if (!valid) {
    await recordFailedAttempt(db, account.id, account.failedLoginAttempts)
    return { ok: false, reason: 'invalid_credentials' }
  }
  await recordSuccessfulLogin(db, account.id)
  return { ok: true, accountId: account.id }
}
