import { useState, useEffect, useCallback } from "react";
import { initSyncManager, onSyncProgress, onConflict, startSync } from "./sync-manager";
import type { QueuedOperation } from "./offline-db";

export interface SyncState {
  status: "idle" | "syncing" | "error" | "conflict";
  current: number;
  total: number;
  label: string;
  lastSync: string | null;
}

let gState: SyncState = { status: "idle", current: 0, total: 0, label: "", lastSync: null };
const listeners = new Set<(s: SyncState) => void>();

function setGState(partial: Partial<SyncState>) {
  gState = { ...gState, ...partial };
  listeners.forEach((cb) => cb(gState));
}

interface ConflictInfo {
  op: QueuedOperation;
  localVersion: number;
  serverVersion: number;
  serverData: Record<string, unknown>;
  resolving: boolean;
}

let gConflict: ConflictInfo | null = null;
const conflictListeners = new Set<(c: ConflictInfo | null) => void>();

function setConflict(c: ConflictInfo | null) {
  gConflict = c;
  conflictListeners.forEach((cb) => cb(c));
}

onSyncProgress((p) => {
  if (p.status === "idle") {
    setGState({
      status: "idle",
      current: 0,
      total: 0,
      label: "",
      lastSync: new Date().toISOString(),
    });
  } else {
    setGState({ status: p.status, current: p.current, total: p.total, label: p.label });
  }
});

onConflict((op, err) => {
  const localPayload = JSON.parse(op.payload);
  setGState({ status: "conflict" });

  const ci: ConflictInfo = {
    op,
    localVersion: localPayload.version ?? 0,
    serverVersion: err.serverVersion,
    serverData: err.serverData ?? {},
    resolving: false,
  };
  setConflict(ci);
});

export function useSyncState(): SyncState {
  const [state, setState] = useState<SyncState>(gState);
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

export function useConflictState(): {
  conflict: ConflictInfo | null;
  resolveWithLocal: () => void;
  resolveWithServer: () => void;
} {
  const [conflict, setConflictState] = useState<ConflictInfo | null>(gConflict);
  useEffect(() => {
    conflictListeners.add(setConflictState);
    return () => {
      conflictListeners.delete(setConflictState);
    };
  }, []);

  const resolveWithLocal = useCallback(async () => {
    if (!gConflict) return;
    const { op } = gConflict;
    try {
      const payload = { ...JSON.parse(op.payload), version: gConflict.serverVersion + 1 };
      const { getToken } = await import("./api");
      const token = getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`/api${op.endpoint}`, {
        method: op.method,
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const { markOperationSynced } = await import("./offline-db");
        await markOperationSynced(op.id!);
        setConflict(null);
        setGState({ status: "idle", current: 0, total: 0, label: "" });
        startSync();
      }
    } catch {
      // retry
    }
  }, []);

  const resolveWithServer = useCallback(async () => {
    if (!gConflict) return;
    const { markOperationSynced } = await import("./offline-db");
    await markOperationSynced(gConflict.op.id!);
    setConflict(null);
    setGState({ status: "idle", current: 0, total: 0, label: "" });
    startSync();
  }, []);

  return { conflict, resolveWithLocal, resolveWithServer };
}

let initialized = false;

export function useOfflineInit(): void {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    initSyncManager();
  }, []);
}
