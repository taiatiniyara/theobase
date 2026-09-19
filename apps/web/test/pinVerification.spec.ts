import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetDBForTests } from '../src/lib/db'
import { cacheVerifier } from '../src/lib/localVerifier'
import { verifyPin } from '../src/lib/pinVerification'

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('theobase')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(async () => {
  await __resetDBForTests()
  await deleteDatabase()
  setOnline(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const PHONE = '+6795551111'

describe('verifyPin — cached (no network call at all)', () => {
  it('succeeds from cache without touching fetch', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed', pin: '1234' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await verifyPin(PHONE, '1234')
    expect(result).toEqual({ ok: true, accountId: 1, displayName: 'Tia', source: 'cache' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects a wrong PIN against a cached phone without touching fetch', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed', pin: '1234' })
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await verifyPin(PHONE, 'wrong')
    expect(result).toEqual({ ok: false, reason: 'invalid' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('works offline for a previously-cached phone', async () => {
    await cacheVerifier({ accountId: 1, displayName: 'Tia', phone: PHONE, seed: 'seed', pin: '1234' })
    setOnline(false)
    vi.stubGlobal('fetch', vi.fn())

    const result = await verifyPin(PHONE, '1234')
    expect(result).toEqual({ ok: true, accountId: 1, displayName: 'Tia', source: 'cache' })
  })
})

describe('verifyPin — not cached, offline', () => {
  it('reports unavailable_offline without attempting a fetch', async () => {
    setOnline(false)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const result = await verifyPin(PHONE, '1234')
    expect(result).toEqual({ ok: false, reason: 'unavailable_offline' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('verifyPin — not cached, online (earns the cache for next time)', () => {
  it('succeeds via the network and caches it for subsequent offline use', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ account: { id: 7, displayName: 'Sam' }, localVerifierSeed: 'server-seed' }),
          { status: 200 },
        ),
      ),
    )

    const result = await verifyPin(PHONE, '4321')
    expect(result).toEqual({ ok: true, accountId: 7, displayName: 'Sam', source: 'network' })

    // Now offline, and without needing another network call, the same
    // pair verifies from what was just earned — the actual point of #23.
    setOnline(false)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const second = await verifyPin(PHONE, '4321')
    expect(second).toEqual({ ok: true, accountId: 7, displayName: 'Sam', source: 'cache' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('surfaces a 401 (wrong PIN) as reason: invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401 })),
    )
    const result = await verifyPin(PHONE, 'wrong')
    expect(result).toEqual({ ok: false, reason: 'invalid' })
  })

  it('surfaces a 423 (server-side lockout) as reason: locked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'locked' }), { status: 423 })),
    )
    const result = await verifyPin(PHONE, '1234')
    expect(result).toEqual({ ok: false, reason: 'locked' })
  })

  it('treats a network-level failure (despite navigator.onLine) as unavailable_offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const result = await verifyPin(PHONE, '1234')
    expect(result).toEqual({ ok: false, reason: 'unavailable_offline' })
  })
})
