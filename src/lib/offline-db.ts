import Dexie, { type EntityTable } from "dexie";

export interface QueuedOperation {
  id?: number;
  clientUuid: string;
  priority: number;
  type: string;
  endpoint: string;
  method: string;
  payload: string;
  timestamp: string;
  synced: number;
}

export interface CachedMember {
  id: number;
  church_id: number;
  data: string;
  version: number;
  cachedAt: string;
}

export interface CachedResponse {
  key: string;
  data: string;
  cachedAt: string;
}

const db = new Dexie("theobase-offline") as Dexie & {
  queue: EntityTable<QueuedOperation, "id">;
  members: EntityTable<CachedMember, "id">;
  cache: EntityTable<CachedResponse, "key">;
};

db.version(1).stores({
  queue: "++id, clientUuid, priority, type, synced, timestamp",
  members: "id, church_id",
  cache: "key",
});

export { db };
export type OfflineDB = typeof db;

export function generateClientUuid(): string {
  const stored = localStorage.getItem("clientUuid");
  if (stored) return stored;
  const uuid = crypto.randomUUID();
  localStorage.setItem("clientUuid", uuid);
  return uuid;
}

const PRIORITY_MAP: Record<string, number> = {
  finance_entry: 1,
  expense: 2,
  membership_change: 3,
  pull_fresh: 4,
};

export function getOperationPriority(type: string): number {
  if (type.startsWith("finance:createBatch") || type.startsWith("finance:createTransaction"))
    return 1;
  if (type.startsWith("finance:createExpense")) return 2;
  if (type.startsWith("member:")) return 3;
  return PRIORITY_MAP[type] ?? 4;
}

export async function queueOperation(
  type: string,
  endpoint: string,
  method: string,
  payload: unknown
): Promise<QueuedOperation> {
  const op: Omit<QueuedOperation, "id"> = {
    clientUuid: generateClientUuid(),
    priority: getOperationPriority(type),
    type,
    endpoint,
    method,
    payload: JSON.stringify(payload),
    timestamp: new Date().toISOString(),
    synced: 0,
  };
  const id = await db.queue.add(op as QueuedOperation);
  return { ...op, id } as QueuedOperation;
}

export async function getPendingOperations(): Promise<QueuedOperation[]> {
  const ops = await db.queue.where("synced").equals(0).toArray();
  return ops.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.timestamp.localeCompare(b.timestamp);
  });
}

export async function markOperationSynced(id: number): Promise<void> {
  await db.queue.delete(id);
}

export async function cacheMembers(churchId: number, members: unknown[]): Promise<void> {
  await db.members.where("church_id").equals(churchId).delete();
  const rows = members.map((item) => {
    const m = item as Record<string, unknown>;
    return {
      id: m.id as number,
      church_id: churchId,
      data: JSON.stringify(m),
      version: (m.version as number) ?? 1,
      cachedAt: new Date().toISOString(),
    };
  });
  await db.members.bulkAdd(rows);
}

export async function getCachedMembers(churchId: number): Promise<unknown[]> {
  const rows = await db.members.where("church_id").equals(churchId).toArray();
  return rows.map((r) => JSON.parse(r.data));
}

export async function cacheResponse(key: string, data: unknown): Promise<void> {
  await db.cache.put({
    key,
    data: JSON.stringify(data),
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedResponse(key: string): Promise<unknown | null> {
  const row = await db.cache.get(key);
  return row ? JSON.parse(row.data) : null;
}
