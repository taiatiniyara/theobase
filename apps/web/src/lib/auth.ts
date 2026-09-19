import { apiFetch } from './api'
import { cacheVerifier } from './localVerifier'

interface LocalLoginResponse {
  account: {
    id: number
    displayName: string
    role: string
    churchId: number | null
    districtId: number | null
  }
  localVerifierSeed: string
}

// Full online login: establishes the session cookie (via #8's
// existing endpoint) *and* earns this device the account's
// local-verifier seed in the same call, so the device can verify this
// same phone+PIN offline from here on (unlock, or acting as its own
// co-signer elsewhere — see #23). A login screen (#24) calls this
// rather than hitting /auth/local/login directly, so it doesn't have
// to remember the caching step itself.
//
// Throws ApiError on failure (wrong PIN: 401, locked: 423) — the
// caller (a login form) catches and branches on err.status.
export async function completeLocalLogin(
  phone: string,
  pin: string,
): Promise<{ accountId: number; displayName: string }> {
  const body = await apiFetch<LocalLoginResponse>('/auth/local/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin }),
  })
  await cacheVerifier({
    accountId: body.account.id,
    displayName: body.account.displayName,
    role: body.account.role,
    churchId: body.account.churchId,
    districtId: body.account.districtId,
    phone,
    seed: body.localVerifierSeed,
    pin,
  })
  return { accountId: body.account.id, displayName: body.account.displayName }
}
