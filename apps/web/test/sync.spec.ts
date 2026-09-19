import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetDBForTests,
  getCachedCategories,
  getChurchContext,
  listPending,
  listPendingCounts,
  saveLocalCount,
} from '../src/lib/db'
import { refreshCategories, syncPendingCounts } from '../src/lib/sync'

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

describe('syncPendingCounts', () => {
  it('marks a count synced (removes it from pending) once the server accepts it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ count: { id: 1 } }), { status: 200 })),
    )

    await saveLocalCount({
      clientRecordId: 'sync-ok',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    const result = await syncPendingCounts()
    expect(result).toEqual({ synced: 1, failed: 0 })
    expect(await listPendingCounts()).toHaveLength(0)
  })

  it('leaves a count pending when the network request fails (offline)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await saveLocalCount({
      clientRecordId: 'sync-offline',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    const result = await syncPendingCounts()
    expect(result).toEqual({ synced: 0, failed: 1 })
    const pending = await listPendingCounts()
    expect(pending).toHaveLength(1)
    expect(pending[0].payload.clientRecordId).toBe('sync-offline')

    // Recorded as a 'network' failure, not 'rejected' — a status
    // indicator (#13) needs this distinction to stay calm here.
    const [raw] = await listPending()
    expect(raw.lastError?.type).toBe('network')
  })

  it('leaves a count pending when the server rejects it, without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'bad request' }), { status: 400 })),
    )

    await saveLocalCount({
      clientRecordId: 'sync-rejected',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    await expect(syncPendingCounts()).resolves.toEqual({ synced: 0, failed: 1 })

    // Recorded as 'rejected', not 'network' — this is the case #13's
    // status indicator should escalate on immediately.
    const [raw] = await listPending()
    expect(raw.lastError?.type).toBe('rejected')
    expect(raw.lastError?.message).toContain('bad request')
  })

  it('syncs the ones it can and leaves the rest pending, rather than stopping at the first failure', async () => {
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        call += 1
        if (call === 1) {
          return Promise.resolve(new Response(JSON.stringify({ count: { id: 1 } }), { status: 200 }))
        }
        return Promise.reject(new TypeError('Failed to fetch'))
      }),
    )

    await saveLocalCount({
      clientRecordId: 'multi-a',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })
    await saveLocalCount({
      clientRecordId: 'multi-b',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    const result = await syncPendingCounts()
    expect(result).toEqual({ synced: 1, failed: 1 })
    expect(await listPendingCounts()).toHaveLength(1)
  })

  it('does nothing (and does not throw) when there is nothing pending', async () => {
    vi.stubGlobal('fetch', vi.fn())
    await expect(syncPendingCounts()).resolves.toEqual({ synced: 0, failed: 0 })
  })
})

describe('refreshCategories', () => {
  it('overwrites the local cache with what the server returns', async () => {
    const categories = [
      { id: 1, name: 'Tithe', isTithe: true },
      { id: 2, name: 'Local Church Budget', isTithe: false },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ categories, church: { id: 7, districtId: 3 }, account: { id: 9 } }),
          { status: 200 },
        ),
      ),
    )

    expect(await getCachedCategories()).toHaveLength(0)
    await refreshCategories()

    const cached = await getCachedCategories()
    expect(cached.map((c) => c.id).sort()).toEqual([1, 2])

    // Church context (#12) is cached alongside categories in the same
    // request, since it's needed offline for dual sign-off's
    // eligibility check.
    expect(await getChurchContext()).toEqual({ treasurerAccountId: 9, churchId: 7, districtId: 3 })
  })

  it('rejects (leaving the existing cache untouched) when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(refreshCategories()).rejects.toThrow()
    expect(await getCachedCategories()).toHaveLength(0)
  })
})
