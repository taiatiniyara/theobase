// Client-side mirror of apps/api's assertEligibleCoSigner (db/counts.ts),
// which itself reuses #9's canAccessChurch. This copy exists so the
// co-signer entry step (#12) can reject an ineligible co-signer
// *before* spending a PIN attempt or a network round-trip — the server
// is still the actual authority and re-checks everything on submit, so
// a mismatch between these two copies fails closed (server 400s), it
// never opens a hole.
export interface CoSignerCandidate {
  accountId: number
  role: string
  churchId: number | null
  districtId: number | null
}

export interface CoSignEligibilityContext {
  treasurerAccountId: number
  churchId: number
  districtId: number
}

export function isEligibleCoSigner(
  coSigner: CoSignerCandidate,
  context: CoSignEligibilityContext,
): boolean {
  if (coSigner.accountId === context.treasurerAccountId) return false
  if (coSigner.role === 'pastor') return coSigner.districtId === context.districtId
  if (coSigner.role === 'treasurer' || coSigner.role === 'clerk') {
    return coSigner.churchId === context.churchId
  }
  return false
}
