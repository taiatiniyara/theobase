export interface Breadcrumb {
  message: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface ErrorPayload {
  churchId?: string;
  userId?: string;
  severity: 'error' | 'warn' | 'info';
  type: string;
  message: string;
  stackTrace?: string;
  breadcrumbTrail: Breadcrumb[];
  deviceInfo: {
    userAgent?: string;
    platform?: string;
    viewport?: string;
  };
  timestamp: number;
}

export interface SyncHealthPayload {
  churchId: string;
  queueDepth: number;
  lastSyncAt: number;
  syncSuccessRate: number;
  doLatencyMs: number;
}

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(message: string, data?: Record<string, unknown>): void {
  breadcrumbs.push({ message, timestamp: Date.now(), data });
  if (breadcrumbs.length > MAX_BREADCRUMBS) breadcrumbs.shift();
}

export function captureError(
  error: Error,
  opts: { churchId?: string; userId?: string; severity?: ErrorPayload['severity'] } = {}
): ErrorPayload {
  const payload: ErrorPayload = {
    churchId: opts.churchId,
    userId: opts.userId,
    severity: opts.severity ?? 'error',
    type: error.name,
    message: error.message,
    stackTrace: error.stack,
    breadcrumbTrail: [...breadcrumbs],
    deviceInfo: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'worker',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'server',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
    },
    timestamp: Date.now(),
  };
  breadcrumbs.length = 0;
  return payload;
}

export function getObservabilityWorkerUrl(): string {
  const baseUrl = (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).WORKER_URL as string) || 'https://theobase-worker.theobase.workers.dev';
  return `${baseUrl}/observability`;
}

export async function reportError(payload: ErrorPayload): Promise<boolean> {
  try {
    const res = await fetch(`${getObservabilityWorkerUrl()}/error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportSyncHealth(payload: SyncHealthPayload): Promise<boolean> {
  try {
    const res = await fetch(`${getObservabilityWorkerUrl()}/sync-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
