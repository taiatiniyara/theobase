import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// Local-first storage foundation. Product tickets (count entry, dual
// sign-off, etc.) add their own object stores here rather than opening
// separate databases, so everything shares one offline-capable source
// of truth and one sync/outbox mechanism.
// IndexedDB keys can't be `null`, so "not yet synced" is the empty
// string rather than null — keeps the record queryable via the index.
const NOT_SYNCED = ''

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
}

const DB_NAME = 'theobase'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<TheobaseDB>> | null = null

export function getDB(): Promise<IDBPDatabase<TheobaseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TheobaseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const outbox = db.createObjectStore('outbox', {
          keyPath: 'id',
          autoIncrement: true,
        })
        outbox.createIndex('by-synced', 'syncedAt')
      },
    })
  }
  return dbPromise
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
