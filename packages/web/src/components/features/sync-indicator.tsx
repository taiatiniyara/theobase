import { useState, useEffect } from 'react';
import type { SyncState, SyncStatus } from '../../lib/sync-state';
import { getSyncState, subscribe } from '../../lib/sync-state';
import { cn } from '../../lib/utils';

const STATUS_CONFIG: Record<SyncStatus, { dot: string; label: string }> = {
  synced: { dot: 'bg-success', label: 'Synced' },
  pending: { dot: 'bg-warning', label: 'Synced' },
  offline: { dot: 'bg-error', label: 'Offline' },
};

export function SyncIndicator() {
  const [state, setState] = useState<SyncState>(getSyncState);

  useEffect(() => {
    return subscribe(setState);
  }, []);

  const config = STATUS_CONFIG[state.status];

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-1">
      <span
        className={cn(
          'inline-block h-2 w-2 rounded-full transition-colors duration-150',
          config.dot,
        )}
      />
      <span className="text-xs font-medium text-neutral-500">
        {state.status === 'pending' ? `${state.pendingCount} pending` : config.label}
      </span>
    </div>
  );
}
