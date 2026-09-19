import { ApiError, apiFetch } from './api'
import { cacheVerifier, verifyPinLocally } from './localVerifier'

export type PinVerificationResult =
  | { ok: true; accountId: number; displayName: string; source: 'cache' | 'network' }
  | { ok: false; reason: 'invalid' | 'locked' | 'unavailable_offline' }

interface VerifyPinResponse {
  account: { id: number; displayName: string }
  localVerifierSeed: string
}

// The single primitive both "unlock the app" and dual sign-off's
// co-signer entry (#12) are meant to use — see #23. Local-first:
// checks the on-device cache before ever touching the network, so a
// phone+PIN this device has already confirmed works fully offline. A
// pair this device has never confirmed ("not_cached") requires
// connectivity exactly once — per the "earn it online first, then
// cache" design — after which future checks for that same pair work
// offline too.
//
// Deliberately does not fall back to the network for a *wrong* PIN
// against an already-cached pair (only for a *never-cached* one) —
// see verifyPinLocally's doc comment for the PIN-change edge case this
// knowingly doesn't handle (no PIN-change feature exists yet to make
// a cached verifier go stale).
export async function verifyPin(phone: string, pin: string): Promise<PinVerificationResult> {
  const local = await verifyPinLocally(phone, pin)
  if (local.ok) {
    return { ok: true, accountId: local.accountId, displayName: local.displayName, source: 'cache' }
  }
  if (local.reason !== 'not_cached') {
    return { ok: false, reason: local.reason }
  }

  if (!navigator.onLine) {
    return { ok: false, reason: 'unavailable_offline' }
  }

  try {
    const body = await apiFetch<VerifyPinResponse>('/auth/local/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
    })
    await cacheVerifier({
      accountId: body.account.id,
      displayName: body.account.displayName,
      phone,
      seed: body.localVerifierSeed,
      pin,
    })
    return { ok: true, accountId: body.account.id, displayName: body.account.displayName, source: 'network' }
  } catch (err) {
    if (err instanceof ApiError) {
      return { ok: false, reason: err.status === 423 ? 'locked' : 'invalid' }
    }
    // Network error despite navigator.onLine saying otherwise (a real,
    // if uncommon, possibility — captive portals, DNS trouble, etc.).
    return { ok: false, reason: 'unavailable_offline' }
  }
}
