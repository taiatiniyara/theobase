import { useAuth } from "../lib/auth";
import { useSyncState, useOfflineInit } from "../lib/useSync";
import { triggerSync, getOnlineStatus } from "../lib/sync-manager";

export default function SyncIndicator() {
  const { user } = useAuth();
  const syncState = useSyncState();
  useOfflineInit();

  const churchId = user?.church?.id;

  if (!churchId) return null;

  const isOnline = getOnlineStatus();

  let dotColor = "bg-green-500";
  let label = "Online";
  let progressBar = null;

  if (syncState.status === "syncing") {
    dotColor = "bg-yellow-500 animate-pulse";
    label = syncState.label || "Syncing...";
    if (syncState.total > 1) {
      label = `${syncState.label} ${syncState.current} of ${syncState.total}`;
    }
    progressBar = (
      <div
        className="absolute -bottom-1 left-0 h-0.5 bg-yellow-500 transition-all"
        style={{ width: `${(syncState.current / syncState.total) * 100}%` }}
      />
    );
  } else if (!isOnline) {
    dotColor = "bg-yellow-500";
    label = "Offline";
  } else if (syncState.status === "error") {
    dotColor = "bg-red-500";
    label = "Sync error";
  } else if (syncState.status === "conflict") {
    dotColor = "bg-red-500";
    label = "Conflict";
  } else if (syncState.lastSync) {
    dotColor = "bg-green-500";
    const time = new Date(syncState.lastSync);
    label = `Synced ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return (
    <div
      className="relative flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      title={label}
    >
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-gray-600">{label}</span>
      {syncState.status === "error" && (
        <button
          onClick={() => triggerSync()}
          className="ml-1 text-brand hover:text-orange-600 font-bold"
          title="Retry sync"
        >
          Retry
        </button>
      )}
      {progressBar}
    </div>
  );
}
