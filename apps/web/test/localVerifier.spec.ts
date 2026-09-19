import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetDBForTests } from '../src/lib/db'
import { cacheVerifier, verifyPinLocally } from '../src/lib/localVerifier'

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('theobase')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

beforeEach(async () => {
  await __resetDBForTests()
  await deleteDatabase()
})

afterEach(() => {
  vi.useRealTimers()
})

const PHONE = '+6791112222'

const TIA = {
  accountId: 1,
  displayName: 'Tia',
  role: 'treasurer',
  churchId: 5,
  districtId: 50,
  phone: PHONE,
  seed: 'seed-abc',
  pin: '1234',
}

const TIA_VERIFIED = {
  ok: true,
  accountId: TIA.accountId,
  displayName: TIA.displayName,
  role: TIA.role,
  churchId: TIA.churchId,
  districtId: TIA.districtId,
}

describe('cacheVerifier / verifyPinLocally', () => {
  it('a cached phone+PIN verifies correctly, entirely offline (no fetch involved)', async () => {
    await cacheVerifier(TIA)

    const result = await verifyPinLocally(PHONE, '1234')
    expect(result).toEqual(TIA_VERIFIED)
  })

  it('rejects the wrong PIN for a cached phone', async () => {
    await cacheVerifier(TIA)
    const result = await verifyPinLocally(PHONE, '9999')
    expect(result).toEqual({ ok: false, reason: 'invalid' })
  })

  it('reports not_cached for a phone this device has never confirmed', async () => {
    const result = await verifyPinLocally('+6790000000', '1234')
    expect(result).toEqual({ ok: false, reason: 'not_cached' })
  })

  it('never reveals the PIN or seed in its result', async () => {
    await cacheVerifier(TIA)
    const result = await verifyPinLocally(PHONE, '1234')
    expect(JSON.stringify(result)).not.toContain('1234')
    expect(JSON.stringify(result)).not.toContain('seed-abc')
  })

  it('locks out after 5 wrong attempts, rejecting even the correct PIN while locked', async () => {
    await cacheVerifier(TIA)

    for (let i = 0; i < 5; i++) {
      const r = await verifyPinLocally(PHONE, 'wrong')
      expect(r.ok).toBe(false)
    }

    const stillLockedEvenWithRightPin = await verifyPinLocally(PHONE, '1234')
    expect(stillLockedEvenWithRightPin).toEqual({ ok: false, reason: 'locked' })
  })

  it('unlocks again after the lockout window passes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    await cacheVerifier(TIA)

    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: false, reason: 'locked' })

    vi.setSystemTime(new Date('2026-01-01T00:20:00Z')) // 20 minutes later
    expect(await verifyPinLocally(PHONE, '1234')).toEqual(TIA_VERIFIED)
  })

  it('re-caching (a fresh online success) clears a stale local lockout', async () => {
    await cacheVerifier(TIA)
    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: false, reason: 'locked' })

    await cacheVerifier(TIA)
    expect(await verifyPinLocally(PHONE, '1234')).toEqual(TIA_VERIFIED)
  })

  it('a wrong PIN against one cached phone does not affect another', async () => {
    const otherPhone = '+6793334444'
    const sam = {
      accountId: 2,
      displayName: 'Sam',
      role: 'clerk',
      churchId: 5,
      districtId: null,
      phone: otherPhone,
      seed: 'seed-xyz',
      pin: '5678',
    }
    await cacheVerifier(TIA)
    await cacheVerifier(sam)

    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')

    expect(await verifyPinLocally(otherPhone, '5678')).toEqual({
      ok: true,
      accountId: sam.accountId,
      displayName: sam.displayName,
      role: sam.role,
      churchId: sam.churchId,
      districtId: sam.districtId,
    })
  })
})
