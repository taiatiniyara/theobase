import { beforeEach, describe, expect, it } from 'vitest'
import {
  __resetDBForTests,
  cacheCategories,
  getCachedCategories,
  listPendingCounts,
  markSynced,
  pendingCount,
  saveLocalCount,
} from '../src/lib/db'

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('theobase')
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve() // best-effort in a test environment
  })
}

beforeEach(async () => {
  await __resetDBForTests()
  await deleteDatabase()
})

describe('local count storage', () => {
  it('a saved count is immediately visible in the pending list, with no network involved', async () => {
    await saveLocalCount({
      clientRecordId: 'abc-123',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [{ fundCategoryId: 1, categoryName: 'Tithe', amountCents: 5_000 }],
    })

    const pending = await listPendingCounts()
    expect(pending).toHaveLength(1)
    expect(pending[0].payload.clientRecordId).toBe('abc-123')
    expect(await pendingCount()).toBe(1)
  })

  it('persists across a simulated app restart (a fresh getDB() connection)', async () => {
    await saveLocalCount({
      clientRecordId: 'restart-1',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    // Simulates closing and reopening the app: drop the cached
    // connection (but *not* the underlying IndexedDB database itself —
    // that's the part that's supposed to survive).
    await __resetDBForTests()

    const pending = await listPendingCounts()
    expect(pending).toHaveLength(1)
    expect(pending[0].payload.clientRecordId).toBe('restart-1')
  })

  it('markSynced removes a count from the pending list', async () => {
    const outboxId = await saveLocalCount({
      clientRecordId: 'sync-me',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    await markSynced(outboxId)

    expect(await listPendingCounts()).toHaveLength(0)
    expect(await pendingCount()).toBe(0)
  })

  it('keeps multiple pending counts independently addressable', async () => {
    await saveLocalCount({
      clientRecordId: 'multi-1',
      sabbathDate: '2026-09-19',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })
    await saveLocalCount({
      clientRecordId: 'multi-2',
      sabbathDate: '2026-09-26',
      recordedAt: new Date().toISOString(),
      coSignerAccountId: 2,
      lines: [],
    })

    const pending = await listPendingCounts()
    expect(pending.map((p) => p.payload.clientRecordId).sort()).toEqual(['multi-1', 'multi-2'])
  })
})

describe('category cache', () => {
  it('a full replace clears out categories no longer in the new list', async () => {
    await cacheCategories([
      { id: 1, name: 'Tithe', isTithe: true },
      { id: 2, name: 'Local Church Budget', isTithe: false },
    ])
    await cacheCategories([{ id: 1, name: 'Tithe', isTithe: true }])

    const cached = await getCachedCategories()
    expect(cached.map((c) => c.id)).toEqual([1])
  })
})
