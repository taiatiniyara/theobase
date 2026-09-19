import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../src/lib/api'
import { completeLocalLogin } from '../src/lib/auth'
import { __resetDBForTests } from '../src/lib/db'
import { verifyPinLocally } from '../src/lib/localVerifier'

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
  vi.unstubAllGlobals()
})

const PHONE = '+6796660000'

describe('completeLocalLogin', () => {
  it('logs in and caches the verifier so the same PIN works offline afterwards', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ account: { id: 3, displayName: 'Tia' }, localVerifierSeed: 'server-seed' }),
          { status: 200 },
        ),
      ),
    )

    const result = await completeLocalLogin(PHONE, '1234')
    expect(result).toEqual({ accountId: 3, displayName: 'Tia' })

    const local = await verifyPinLocally(PHONE, '1234')
    expect(local).toEqual({ ok: true, accountId: 3, displayName: 'Tia' })
  })

  it('throws (and caches nothing) on a rejected login', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'invalid_credentials' }), { status: 401 })),
    )

    await expect(completeLocalLogin(PHONE, 'wrong')).rejects.toThrow(ApiError)

    const local = await verifyPinLocally(PHONE, 'wrong')
    expect(local).toEqual({ ok: false, reason: 'not_cached' })
  })
})
