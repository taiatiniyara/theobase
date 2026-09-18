import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Local-first storage foundation. Product tickets (count entry, dual
// sign-off, etc.) add their own object stores here rather than opening
// separate databases, so everything shares one offline-capable source
// of truth and one sync/outbox mechanism.
// IndexedDB keys can't be `null`, so "not yet synced" is the empty
// string rather than null — keeps the record queryable via the index.
const NOT_SYNCED = ''

// The count-entry form's payload shape (ticket #11). categoryName is
// duplicated onto the line (not just fundCategoryId) so a saved-but-
// unsynced count can still render sensibly offline even if the local
// category cache changes before it syncs.
export interface LocalCountPayload {
  clientRecordId: string
  sabbathDate: string
  recordedAt: string
  lines: { fundCategoryId: number; categoryName: string; amountCents: number }[]
}

interface TheobaseDB extends DBSchema {
  outbox: {
    key: number
    value: {
      id?: number
      kind: string
      payload: unknown
      createdAt: string
      syncedAt: string
    }
    indexes: { 'by-synced': string }
  }
  categories: {
    key: number
    value: { id: number; name: string; isTithe: boolean; cachedAt: string }
  }
}

const DB_NAME = 'theobase'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<TheobaseDB>> | null = null

export function getDB(): Promise<IDBPDatabase<TheobaseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TheobaseDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const outbox = db.createObjectStore('outbox', {
            keyPath: 'id',
            autoIncrement: true,
          })
          outbox.createIndex('by-synced', 'syncedAt')
        }
        if (oldVersion < 2) {
          db.createObjectStore('categories', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// Test-only: closes and drops the cached connection so the next
// getDB() call reopens fresh. Must actually .close() the connection,
// not just discard the reference — a subsequent
// indexedDB.deleteDatabase() call blocks (hangs) while any connection
// to that database is still open. Not used by app code.
export async function __resetDBForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise
    db.close()
  }
  dbPromise = null
}

// Queues a locally-created record for later sync. Callers are
// responsible for their own payload shape; this store only tracks
// sync state, not domain logic.
export async function enqueue(kind: string, payload: unknown): Promise<number> {
  const db = await getDB()
  return db.add('outbox', {
    kind,
    payload,
    createdAt: new Date().toISOString(),
    syncedAt: NOT_SYNCED,
  })
}

export async function pendingCount(): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('outbox', 'by-synced', NOT_SYNCED)
}

// `id` is optional in the store's value type only because it's unset
// before the first write (autoIncrement fills it in) — every record
// read back out already has one.
export async function listPending(): Promise<
  { id?: number; kind: string; payload: unknown; createdAt: string }[]
> {
  const db = await getDB()
  return db.getAllFromIndex('outbox', 'by-synced', NOT_SYNCED)
}

export async function markSynced(outboxId: number): Promise<void> {
  const db = await getDB()
  const record = await db.get('outbox', outboxId)
  if (!record) return
  record.syncedAt = new Date().toISOString()
  await db.put('outbox', record)
}

// count-entry-form-specific helpers, built on the generic outbox above.

export function saveLocalCount(payload: LocalCountPayload): Promise<number> {
  return enqueue('count', payload)
}

export async function listPendingCounts(): Promise<
  { outboxId: number; payload: LocalCountPayload }[]
> {
  const pending = await listPending()
  return pending
    .filter((r) => r.kind === 'count')
    .map((r) => ({ outboxId: r.id as number, payload: r.payload as LocalCountPayload }))
}

// Cache-then-network read-through for the categories list, so the
// entry form can render (from cache) without waiting on — or even
// having — connectivity. A full replace on each refresh: the list is
// short (~10 rows) and Mission-controlled, so there's no meaningful
// cost to not diffing it.
export async function cacheCategories(
  categories: { id: number; name: string; isTithe: boolean }[],
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('categories', 'readwrite')
  await tx.store.clear()
  const cachedAt = new Date().toISOString()
  await Promise.all(categories.map((c) => tx.store.put({ ...c, cachedAt })))
  await tx.done
}

export async function getCachedCategories(): Promise<
  { id: number; name: string; isTithe: boolean; cachedAt: string }[]
> {
  const db = await getDB()
  return db.getAll('categories')
}
