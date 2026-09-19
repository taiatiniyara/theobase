import { getLocalVerifier, putLocalVerifier } from './db'

// Mirrors apps/api's server-side lockout (login.ts) — an offline
// device can't rely on the server to enforce this while it has no
// connectivity, so it enforces its own copy locally.
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// HMAC-SHA256(seed, pin) — never the PIN itself, and a different
// secret from the server's own pin_hash (see accounts.localVerifierSeed
// in apps/api's schema.ts for why that separation matters).
async function deriveVerifier(seed: string, pin: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(seed),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(pin))
  return toHex(signature)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Called once a PIN has been verified *online* (full login, or a
// co-signer check) — "earns" this phone+PIN pair onto this device for
// future offline verification. Resets any stale local lockout: a
// fresh online success supersedes whatever wrong-guess history was
// building up locally.
export async function cacheVerifier(input: {
  accountId: number
  displayName: string
  phone: string
  seed: string
  pin: string
}): Promise<void> {
  const verifier = await deriveVerifier(input.seed, input.pin)
  await putLocalVerifier({
    phone: input.phone,
    accountId: input.accountId,
    displayName: input.displayName,
    seed: input.seed,
    verifier,
    cachedAt: new Date().toISOString(),
    failedAttempts: 0,
    lockedUntil: null,
  })
}

export type LocalVerifyResult =
  | { ok: true; accountId: number; displayName: string }
  | { ok: false; reason: 'not_cached' | 'invalid' | 'locked' }

// Verifies a PIN entirely on-device, no network involved — this is
// the actual "offline capable" part. Returns 'not_cached' (not a
// wrong PIN — this device has simply never confirmed this phone+PIN
// pair online before) when there's nothing to check against; callers
// need that distinction to know whether trying the network is worth
// it (see pinVerification.ts).
export async function verifyPinLocally(phone: string, pin: string): Promise<LocalVerifyResult> {
  const record = await getLocalVerifier(phone)
  if (!record) return { ok: false, reason: 'not_cached' }

  if (record.lockedUntil && new Date(record.lockedUntil).getTime() > Date.now()) {
    return { ok: false, reason: 'locked' }
  }

  const candidate = await deriveVerifier(record.seed, pin)
  if (timingSafeEqual(candidate, record.verifier)) {
    if (record.failedAttempts > 0 || record.lockedUntil) {
      await putLocalVerifier({ ...record, failedAttempts: 0, lockedUntil: null })
    }
    return { ok: true, accountId: record.accountId, displayName: record.displayName }
  }

  const failedAttempts = record.failedAttempts + 1
  const lockedUntil =
    failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null
  await putLocalVerifier({ ...record, failedAttempts, lockedUntil })
  return { ok: false, reason: 'invalid' }
}
