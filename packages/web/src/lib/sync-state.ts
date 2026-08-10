export type SyncStatus = 'synced' | 'pending' | 'offline';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncTimestamp: number | null;
}

const listeners: Array<(state: SyncState) => void> = [];
const currentState: SyncState = {
  status: navigator.onLine ? 'synced' : 'offline',
  pendingCount: 0,
  lastSyncTimestamp: null,
};

export function getSyncState(): SyncState {
  return { ...currentState };
}

export function subscribe(listener: (state: SyncState) => void): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function emit(): void {
  for (const listener of listeners) {
    listener({ ...currentState });
  }
}

export function setOnline(): void {
  currentState.status = currentState.pendingCount > 0 ? 'pending' : 'synced';
  emit();
}

export function setOffline(): void {
  currentState.status = 'offline';
  emit();
}

export function setPendingCount(count: number): void {
  currentState.pendingCount = count;
  if (count > 0 && currentState.status === 'synced') {
    currentState.status = 'pending';
  }
  if (count === 0 && currentState.status === 'pending' && navigator.onLine) {
    currentState.status = 'synced';
  }
  emit();
}

export function setLastSyncTimestamp(ts: number): void {
  currentState.lastSyncTimestamp = ts;
  emit();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOffline);
}
