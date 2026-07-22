import { getToken, setTokens, clearTokens, getRefreshToken } from "./api";
import { getPendingOperations, markOperationSynced, type QueuedOperation } from "./offline-db";

type SyncStatus = "idle" | "syncing" | "error";

interface SyncProgress {
  status: SyncStatus;
  current: number;
  total: number;
  label: string;
}

let progressCb: ((p: SyncProgress) => void) | null = null;

export function onSyncProgress(cb: (p: SyncProgress) => void): void {
  progressCb = cb;
}

function emit(p: SyncProgress): void {
  progressCb?.(p);
}

let isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function getOnlineStatus(): boolean {
  return isOnline;
}

export function initSyncManager(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    isOnline = true;
    startSync();
  });

  window.addEventListener("offline", () => {
    isOnline = false;
  });

  if (isOnline) {
    startSync();
  }

  setInterval(() => {
    if (isOnline) startSync();
  }, 60000);
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (refreshed.ok) {
      const data = (await refreshed.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      headers["Authorization"] = `Bearer ${data.accessToken}`;
      return fetch(`/api${path}`, { ...options, headers });
    }
    clearTokens();
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return res;
}

export async function startSync(): Promise<void> {
  if (!isOnline) return;

  const ops = await getPendingOperations();
  if (ops.length === 0) {
    emit({ status: "idle", current: 0, total: 0, label: "" });
    return;
  }

  emit({ status: "syncing", current: 0, total: ops.length, label: formatLabel(ops[0]!) });

  let errorCount = 0;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    emit({ status: "syncing", current: i + 1, total: ops.length, label: formatLabel(op) });

    try {
      const payload = JSON.parse(op.payload);
      const res = await apiFetch(op.endpoint, {
        method: op.method,
        body: op.method !== "GET" && op.method !== "DELETE" ? JSON.stringify(payload) : undefined,
      });

      if (res.ok) {
        await markOperationSynced(op.id!);
      } else {
        errorCount++;
        if (res.status === 409) {
          const err = (await res.json().catch(() => ({ error: "Conflict" }))) as {
            error: string;
            serverVersion?: number;
            serverData?: Record<string, unknown>;
          };
          if (op.type.startsWith("member:") && err.serverVersion) {
            emitConflict(op, {
              error: err.error,
              serverVersion: err.serverVersion,
              serverData: err.serverData,
            });
            return;
          }
        }
      }
    } catch {
      errorCount++;
    }
  }

  if (errorCount > 0) {
    emit({ status: "error", current: ops.length - errorCount, total: ops.length, label: "Retry?" });
  } else {
    emit({ status: "idle", current: ops.length, total: ops.length, label: "" });
  }
}

function formatLabel(op: QueuedOperation): string {
  if (op.type === "finance:createBatch") return "Syncing batch";
  if (op.type === "finance:createTransaction") return "Syncing tithe";
  if (op.type === "finance:createExpense") return "Syncing expense";
  if (op.type.startsWith("member:create")) return "Syncing member";
  if (op.type.startsWith("member:update")) return "Syncing member edit";
  return "Syncing...";
}

let conflictCb:
  | ((
      op: QueuedOperation,
      err: { error: string; serverVersion: number; serverData?: Record<string, unknown> }
    ) => void)
  | null = null;

export function onConflict(
  cb: (
    op: QueuedOperation,
    err: { error: string; serverVersion: number; serverData?: Record<string, unknown> }
  ) => void
): void {
  conflictCb = cb;
}

function emitConflict(
  op: QueuedOperation,
  err: { error: string; serverVersion: number; serverData?: Record<string, unknown> }
): void {
  conflictCb?.(op, err);
}

export function triggerSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    if (isOnline) startSync();
  }, 500);
}
