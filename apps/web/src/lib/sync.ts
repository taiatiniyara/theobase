import { apiFetch } from './api'
import { cacheCategories, listPendingCounts, markSynced, type LocalCountPayload } from './db'

interface Category {
  id: number
  name: string
  isTithe: boolean
}

// Fetches the latest categories and updates the local cache. Callers
// that render from the cache (see getCachedCategories) need to re-read
// it after this resolves to pick up the change — this function only
// writes the cache, it doesn't push the new data anywhere itself.
//
// Deliberately two separate steps rather than one combined
// "loadCategories" that both returns cached data and silently
// refreshes in the background: a function that hands back a value now
// AND mutates the real data somewhere else later, with no way for the
// caller to learn the second part happened, is exactly how a screen
// ends up stuck showing stale (or on a first-ever run, empty) data
// forever. React's reactivity has to be able to see both steps.
export async function refreshCategories(): Promise<void> {
  const { categories } = await apiFetch<{ categories: Category[] }>('/counts/categories')
  await cacheCategories(categories)
}

// Attempts to push every locally-queued count to the server. Never
// throws — a failed line (still offline, or a genuine server error)
// just stays pending for the next attempt; this is what "syncs
// opportunistically" means in practice. Returns how many succeeded so
// callers (a status indicator, tests) can report progress.
export async function syncPendingCounts(): Promise<{ synced: number; failed: number }> {
  const pending = await listPendingCounts()
  let synced = 0
  let failed = 0

  for (const { outboxId, payload } of pending) {
    try {
      await submitCount(payload)
      await markSynced(outboxId)
      synced += 1
    } catch {
      failed += 1
      // Keep trying the rest — one bad/rejected record (or one that's
      // still offline) shouldn't block the others from syncing.
    }
  }

  return { synced, failed }
}

async function submitCount(payload: LocalCountPayload): Promise<void> {
  await apiFetch('/counts', {
    method: 'POST',
    body: JSON.stringify({
      clientRecordId: payload.clientRecordId,
      sabbathDate: payload.sabbathDate,
      recordedAt: payload.recordedAt,
      lines: payload.lines.map((l) => ({
        fundCategoryId: l.fundCategoryId,
        amountCents: l.amountCents,
      })),
    }),
  })
}
