import { useState, useEffect } from 'react';
import { getSyncState, subscribe } from '../../lib/sync-state';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export function StaleDataWarning() {
  const [isStale, setIsStale] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    function check() {
      const state = getSyncState();
      if (state.lastSyncTimestamp) {
        const age = Date.now() - state.lastSyncTimestamp;
        setIsStale(age > STALE_THRESHOLD_MS);
        setLastSync(new Date(state.lastSyncTimestamp).toLocaleString());
      }
    }
    check();
    return subscribe(check);
  }, []);

  if (!isStale) return null;

  return (
    <div className="bg-warning-light border-b border-amber-200 px-4 py-2 text-center text-sm text-warning-700">
      Last updated {lastSync}. Swipe down to reload.
    </div>
  );
}
