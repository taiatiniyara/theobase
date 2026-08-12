import type { WalIntent } from './wal';
import { getPendingIntents, removeIntent, setLastSyncTimestamp } from './wal';
import { setPendingCount, setLastSyncTimestamp as setSyncTs } from './sync-state';

export type SyncResult = {
  intentId: string;
  success: boolean;
  error?: string;
};

const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://theobase-worker.mail-e22.workers.dev';
const WORKER_WS_URL = import.meta.env.VITE_WORKER_URL ? import.meta.env.VITE_WORKER_URL.replace(/^https?/, 'wss') : 'wss://theobase-worker.mail-e22.workers.dev';

function getWorkerWsUrl(): string {
  const origin = import.meta.env.PROD ? WORKER_WS_URL : 'ws://localhost:8787';
  return `${origin}/church`;
}

function getWorkerUrl(): string {
  const origin = import.meta.env.PROD ? WORKER_URL : '';
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

export async function flushIntentWs(
  ws: WebSocket,
  intent: WalIntent,
): Promise<SyncResult> {
  return new Promise((resolve) => {
    function handler(event: MessageEvent) {
      const data = JSON.parse(event.data as string);
      if (data.intentId === intent.id) {
        ws.removeEventListener('message', handler);
        resolve({ intentId: intent.id, success: data.success, error: data.error });
      }
    }
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      operation: intent.operation,
      payload: intent.payload,
      intentId: intent.id,
    }));
    setTimeout(() => {
      ws.removeEventListener('message', handler);
      resolve({ intentId: intent.id, success: false, error: 'WebSocket timeout' });
    }, 15000);
  });
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

let wsConnection: WebSocket | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

function connectWebSocket(churchId: string, token: string | null): void {
  const url = `${getWorkerWsUrl()}/${churchId}/ws?token=${encodeURIComponent(token ?? '')}`;
  wsConnection = new WebSocket(url);

  wsConnection.addEventListener('open', () => {
    flushWal(churchId).catch(() => {});
  });

  wsConnection.addEventListener('close', () => {
    wsConnection = null;
  });

  wsConnection.addEventListener('error', () => {
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
  });
}

export function startSyncPolling(churchId: string, intervalMs = 10000): () => void {
  const token = getAuthToken();

  try {
    connectWebSocket(churchId, token);
  } catch {
    // WebSocket fallback handled by polling
  }

  if (pollInterval) clearInterval(pollInterval);

  pollInterval = setInterval(() => {
    if (!wsConnection) {
      flushWal(churchId).catch(() => {});
    }
  }, intervalMs);

  const handleOnline = () => {
    flushWal(churchId).catch(() => {});
  };

  window.addEventListener('online', handleOnline);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
    window.removeEventListener('online', handleOnline);
  };
}
