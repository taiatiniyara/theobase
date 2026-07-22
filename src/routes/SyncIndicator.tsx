import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

interface SyncState {
  lastSync: string | null;
  pendingOps: number;
}

export default function SyncIndicator() {
  const { user } = useAuth();
  const [state, setState] = useState<SyncState | null>(null);
  const [error, setError] = useState(false);

  const churchId = user?.church?.id;

  useEffect(() => {
    if (!churchId) return;

    let cancelled = false;

    async function poll() {
      try {
        const data = await api.get<SyncState>(`/sync/state?church_id=${churchId}`);
        if (!cancelled) {
          setState(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    poll();
    const interval = setInterval(poll, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [churchId]);

  if (!churchId || !state) return null;

  const isSynced = state.pendingOps === 0 && state.lastSync !== null;
  const label = isSynced
    ? "Synced"
    : state.pendingOps > 0
      ? `${state.pendingOps} pending`
      : error
        ? "Offline"
        : "Connecting...";

  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      title={
        state.lastSync
          ? `Last synced: ${new Date(state.lastSync).toLocaleString()}`
          : "Never synced"
      }
    >
      <span
        className={`h-2 w-2 rounded-full ${
          error
            ? "bg-red-500"
            : isSynced
              ? "bg-green-500"
              : state.pendingOps > 0
                ? "bg-yellow-500 animate-pulse"
                : "bg-gray-400"
        }`}
      />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
