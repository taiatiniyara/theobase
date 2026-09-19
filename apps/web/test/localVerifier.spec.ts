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

describe('cacheVerifier / verifyPinLocally', () => {
  it('a cached phone+PIN verifies correctly, entirely offline (no fetch involved)', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })

    const result = await verifyPinLocally(PHONE, '1234')
    expect(result).toEqual({ ok: true, accountId: 1, displayName: 'Tia' })
  })

  it('rejects the wrong PIN for a cached phone', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })
    const result = await verifyPinLocally(PHONE, '9999')
    expect(result).toEqual({ ok: false, reason: 'invalid' })
  })

  it('reports not_cached for a phone this device has never confirmed', async () => {
    const result = await verifyPinLocally('+6790000000', '1234')
    expect(result).toEqual({ ok: false, reason: 'not_cached' })
  })

  it('never reveals the PIN or seed in its result', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })
    const result = await verifyPinLocally(PHONE, '1234')
    expect(JSON.stringify(result)).not.toContain('1234')
    expect(JSON.stringify(result)).not.toContain('seed-abc')
  })

  it('locks out after 5 wrong attempts, rejecting even the correct PIN while locked', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })

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
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })

    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: false, reason: 'locked' })

    vi.setSystemTime(new Date('2026-01-01T00:20:00Z')) // 20 minutes later
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: true, accountId: 1, displayName: 'Tia' })
  })

  it('re-caching (a fresh online success) clears a stale local lockout', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })
    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: false, reason: 'locked' })

    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })
    expect(await verifyPinLocally(PHONE, '1234')).toEqual({ ok: true, accountId: 1, displayName: 'Tia' })
  })

  it('a wrong PIN against one cached phone does not affect another', async () => {
    const otherPhone = '+6793334444'
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed-abc', pin: '1234' })
    await cacheVerifier({ accountId: 2, displayName: 'Sam', phone: otherPhone, seed: 'seed-xyz', pin: '5678' })

    for (let i = 0; i < 5; i++) await verifyPinLocally(PHONE, 'wrong')

    expect(await verifyPinLocally(otherPhone, '5678')).toEqual({ ok: true, accountId: 2, displayName: 'Sam' })
  })
})
