import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { addIntent } from '../lib/wal';
import { flushWal, startSyncPolling } from '../lib/sync';
import { checkDoVersion } from '../lib/version';
import type { WalIntent } from '../lib/wal';

interface SyncContextValue {
  enqueue: (operation: string, payload: unknown) => Promise<void>;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}

export function SyncProvider({ churchId, children }: { churchId: string; children: ReactNode }) {
  const syncNow = useCallback(async () => {
    await flushWal(churchId);
  }, [churchId]);

  const enqueue = useCallback(
    async (operation: string, payload: unknown) => {
      const intent: WalIntent = {
        id: crypto.randomUUID(),
        operation,
        payload,
        timestamp: Date.now(),
      };
      await addIntent(intent);
      if (navigator.onLine) {
        await flushWal(churchId);
      }
    },
    [churchId],
  );

  useEffect(() => {
    const stop = startSyncPolling(churchId, 10000);

    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      const version = response.headers.get('X-DO-Version');
      if (!checkDoVersion(version)) {
        window.location.reload();
      }
      return response;
    };

    return () => {
      stop();
      window.fetch = originalFetch;
    };
  }, [churchId]);

  return <SyncContext.Provider value={{ enqueue, syncNow }}>{children}</SyncContext.Provider>;
}
