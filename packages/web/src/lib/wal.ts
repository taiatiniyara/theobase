import { openDB, type IDBPDatabase } from 'idb';

export interface WalIntent {
  id: string;
  operation: string;
  payload: unknown;
  timestamp: number;
}

const DB_NAME = 'theobase';
const DB_VERSION = 1;
const WAL_STORE = 'wal';
const STATE_STORE = 'state';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(WAL_STORE)) {
          db.createObjectStore(WAL_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function addIntent(intent: WalIntent): Promise<void> {
  const db = await getDb();
  await db.add(WAL_STORE, intent);
}

export async function getPendingIntents(): Promise<WalIntent[]> {
  const db = await getDb();
  return db.getAll(WAL_STORE);
}

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  return db.count(WAL_STORE);
}

export async function removeIntent(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(WAL_STORE, id);
}

export async function clearIntents(): Promise<void> {
  const db = await getDb();
  await db.clear(WAL_STORE);
}

export async function putState(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put(STATE_STORE, value, key);
}

export async function getState<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get(STATE_STORE, key) as Promise<T | undefined>;
}

export async function getLastSyncTimestamp(): Promise<number | undefined> {
  return getState<number>('lastSyncTimestamp');
}

export async function setLastSyncTimestamp(ts: number): Promise<void> {
  await putState('lastSyncTimestamp', ts);
}
