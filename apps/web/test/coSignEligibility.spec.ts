import { describe, expect, it } from 'vitest'
import { isEligibleCoSigner } from '../src/features/counts/coSignEligibility'

const context = { treasurerAccountId: 1, churchId: 10, districtId: 100 }

describe('isEligibleCoSigner', () => {
  it('rejects the treasurer co-signing their own count', () => {
    expect(
      isEligibleCoSigner({ accountId: 1, role: 'treasurer', churchId: 10, districtId: null }, context),
    ).toBe(false)
  })

  it('accepts a Clerk at the same church', () => {
    expect(
      isEligibleCoSigner({ accountId: 2, role: 'clerk', churchId: 10, districtId: null }, context),
    ).toBe(true)
  })

  it('rejects a Clerk at a different church', () => {
    expect(
      isEligibleCoSigner({ accountId: 2, role: 'clerk', churchId: 11, districtId: null }, context),
    ).toBe(false)
  })

  it('accepts a Pastor whose district matches', () => {
    expect(
      isEligibleCoSigner({ accountId: 3, role: 'pastor', churchId: null, districtId: 100 }, context),
    ).toBe(true)
  })

  it('rejects a Pastor from a different district', () => {
    expect(
      isEligibleCoSigner({ accountId: 3, role: 'pastor', churchId: null, districtId: 200 }, context),
    ).toBe(false)
  })

  it('rejects an institutional role like mission_admin', () => {
    expect(
      isEligibleCoSigner({ accountId: 4, role: 'mission_admin', churchId: null, districtId: null }, context),
    ).toBe(false)
  })
})
