import type { WalIntent } from './wal';
import { getPendingIntents, removeIntent, setLastSyncTimestamp } from './wal';
import { setPendingCount, setLastSyncTimestamp as setSyncTs } from './sync-state';

export type SyncResult = {
  intentId: string;
  success: boolean;
  error?: string;
};

function getWorkerUrl(): string {
  const origin = import.meta.env.PROD ? 'https://theobase-worker.theobase.workers.dev' : '';
  return `${origin}/church`;
}

function base64UrlDecode(str: string): string {
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(base64UrlDecode(parts[1]!))) as { exp?: number };
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
  } catch {
    return null;
  }

  return token;
}

async function flushIntent(intent: WalIntent, churchId: string): Promise<SyncResult> {
  const baseUrl = getWorkerUrl();
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${baseUrl}/${churchId}/mutate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operation: intent.operation,
        payload: intent.payload,
        actor: 'system',
      }),
    });

    if (!response.ok) {
      return {
        intentId: intent.id,
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    return { intentId: intent.id, success: true };
  } catch (err) {
    return {
      intentId: intent.id,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function flushWal(churchId: string): Promise<SyncResult[]> {
  const intents = await getPendingIntents();
  setPendingCount(intents.length);

  const results: SyncResult[] = [];

  for (const intent of intents) {
    const result = await flushIntent(intent, churchId);
    if (result.success) {
      await removeIntent(intent.id);
    }
    results.push(result);
  }

  const remaining = await getPendingIntents().then((i) => i.length);
  setPendingCount(remaining);

  if (remaining === 0) {
    const now = Date.now();
    await setLastSyncTimestamp(now);
    setSyncTs(now);
  }

  return results;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncPolling(churchId: string, intervalMs = 10000): () => void {
  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(() => {
    flushWal(churchId).catch(() => {});
  }, intervalMs);

  const handleOnline = () => {
    flushWal(churchId).catch(() => {});
  };

  window.addEventListener('online', handleOnline);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
    window.removeEventListener('online', handleOnline);
  };
}
