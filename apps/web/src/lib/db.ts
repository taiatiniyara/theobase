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
// category cache changes before it syncs. coSignerAccountId (#12) is
// only ever set once dual sign-off has actually completed — see
// features/counts/CountEntryForm.tsx — a count is never saved locally
// without one, matching "not entered until sign-off completes."
export interface LocalCountPayload {
  clientRecordId: string
  sabbathDate: string
  recordedAt: string
  coSignerAccountId: number
  lines: { fundCategoryId: number; categoryName: string; amountCents: number }[]
}

// Set on a failed sync attempt (see sync.ts) — 'rejected' means the
// server actively refused the record (bad data, unauthorized, locked
// account, ...), which will never succeed on retry without something
// changing; 'network' means the request itself didn't get a response
// (offline, timeout, DNS, ...), which is expected and routine when
// there's no connectivity. The status indicator (#13) uses this
// distinction, not elapsed time alone, to tell "just offline" (normal,
// no alarm no matter how long) from "actually broken" (worth
// surfacing promptly, regardless of how briefly it's been pending).
export interface SyncAttemptError {
  type: 'network' | 'rejected'
  message: string
}

// A device's cached, offline-verifiable proof that it once confirmed
// (online) that this phone+PIN pair is real — see #23 and
// localVerifier.ts. `verifier` is HMAC(seed, pin), never the PIN
// itself; failedAttempts/lockedUntil mirror the server's own lockout
// (login.ts) since an offline device can't rely on the server to
// enforce that while it has no connectivity.
//
// role/churchId/districtId (#12) are cached alongside the verifier so
// dual sign-off's co-signer eligibility check (features/counts/
// coSignEligibility.ts) can run fully offline too — the whole point of
// "earn it online first, then cache" (#23) is that nothing about using
// an already-earned verifier needs a network round-trip, and knowing
// *who* the co-signer is (their role and org scope) is as much a part
// of that as knowing their PIN was right.
export interface LocalVerifierRecord {
  phone: string
  accountId: number
  displayName: string
  role: string
  churchId: number | null
  districtId: number | null
  seed: string
  verifier: string
  cachedAt: string
  failedAttempts: number
  lockedUntil: string | null
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
      lastAttemptAt?: string
      lastError?: SyncAttemptError
    }
    indexes: { 'by-synced': string }
  }
  categories: {
    key: number
    value: { id: number; name: string; isTithe: boolean; cachedAt: string }
  }
  localVerifiers: {
    key: string // phone
    value: LocalVerifierRecord
  }
  // A singleton: the logged-in treasurer's own account id, church, and
  // its district (#12) — cached alongside categories so dual sign-off's
  // eligibility check (is the co-signer the treasurer themself? does a
  // co-signing Pastor's cached districtId match *this* church's
  // district?) works offline too, without a separate round-trip at the
  // moment sign-off actually happens.
  context: {
    key: string
    value: {
      key: 'church'
      treasurerAccountId: number
      churchId: number
      districtId: number
      cachedAt: string
    }
  }
}

const DB_NAME = 'theobase'
const DB_VERSION = 4

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
        if (oldVersion < 3) {
          db.createObjectStore('localVerifiers', { keyPath: 'phone' })
        }
        if (oldVersion < 4) {
          db.createObjectStore('context', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

// Fired whenever outbox state changes (saved, synced, or a sync
// attempt recorded) so UI (the sync status indicator, #13) can react
// immediately instead of only finding out on its next poll. IndexedDB
// itself has no same-tab change notification to piggyback on.
export const OUTBOX_CHANGED_EVENT = 'theobase:outbox-changed'

function notifyOutboxChanged(): void {
  window.dispatchEvent(new Event(OUTBOX_CHANGED_EVENT))
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
  const id = await db.add('outbox', {
    kind,
    payload,
    createdAt: new Date().toISOString(),
    syncedAt: NOT_SYNCED,
  })
  notifyOutboxChanged()
  return id
}

export async function pendingCount(): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('outbox', 'by-synced', NOT_SYNCED)
}

// `id` is optional in the store's value type only because it's unset
// before the first write (autoIncrement fills it in) — every record
// read back out already has one.
export async function listPending(): Promise<
  {
    id?: number
    kind: string
    payload: unknown
    createdAt: string
    lastAttemptAt?: string
    lastError?: SyncAttemptError
  }[]
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
  notifyOutboxChanged()
}

// Records the outcome of a failed sync attempt — see SyncAttemptError
// above for why the type distinction matters. Called by sync.ts;
// doesn't change syncedAt, so the record stays pending either way.
export async function recordSyncAttemptFailure(
  outboxId: number,
  error: SyncAttemptError,
): Promise<void> {
  const db = await getDB()
  const record = await db.get('outbox', outboxId)
  if (!record) return
  record.lastAttemptAt = new Date().toISOString()
  record.lastError = error
  await db.put('outbox', record)
  notifyOutboxChanged()
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

// The treasurer's own account id, church, and district — see the
// `context` store's comment above for why dual sign-off (#12) needs
// this cached.
export async function cacheChurchContext(
  treasurerAccountId: number,
  churchId: number,
  districtId: number,
): Promise<void> {
  const db = await getDB()
  await db.put('context', {
    key: 'church',
    treasurerAccountId,
    churchId,
    districtId,
    cachedAt: new Date().toISOString(),
  })
}

export async function getChurchContext(): Promise<
  { treasurerAccountId: number; churchId: number; districtId: number } | null
> {
  const db = await getDB()
  const record = await db.get('context', 'church')
  return record
    ? { treasurerAccountId: record.treasurerAccountId, churchId: record.churchId, districtId: record.districtId }
    : null
}

// Raw storage for local-verifier records (see LocalVerifierRecord
// above). The crypto (deriving a verifier from a seed+PIN) and lockout
// logic live in localVerifier.ts — this is deliberately just storage,
// same split as outbox/sync.ts.

export async function getLocalVerifier(phone: string): Promise<LocalVerifierRecord | undefined> {
  const db = await getDB()
  return db.get('localVerifiers', phone)
}

export async function putLocalVerifier(record: LocalVerifierRecord): Promise<void> {
  const db = await getDB()
  await db.put('localVerifiers', record)
}
