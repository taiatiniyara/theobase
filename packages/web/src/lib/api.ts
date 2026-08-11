const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://theobase-worker.theobase.workers.dev';

export function getWorkerUrl(): string {
  return `${WORKER_URL}/church`;
}

export function getAuthWorkerUrl(): string {
  return WORKER_URL;
}

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchChurchState(churchId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/state`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchBatchCompare(churchId: string, batchId: string): Promise<{
  batchId: string;
  status: string;
  counter1: { records: Array<Record<string, unknown>>; total: number };
  counter2: { records: Array<Record<string, unknown>>; total: number };
  totalsMatch: boolean;
}> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/batch-compare/${batchId}`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<{
    batchId: string;
    status: string;
    counter1: { records: Array<Record<string, unknown>>; total: number };
    counter2: { records: Array<Record<string, unknown>>; total: number };
    totalsMatch: boolean;
  }>;
}

export async function fetchReport(churchId: string, year: number): Promise<Record<string, unknown>> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/report-generate/${year}`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchRemittance(churchId: string, period: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/remittance-generate/${period}`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<Record<string, unknown>>;
}

export async function fetchInsights(churchId: string): Promise<{ insights: Array<{ type: string; title: string; description: string; action: { label: string; to: string } }> }> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/insights`, {
    headers: { ...authHeaders() },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<{ insights: Array<{ type: string; title: string; description: string; action: { label: string; to: string } }> }>;
}

export async function postChurchMutation(
  churchId: string,
  operation: string,
  payload: unknown,
): Promise<Response> {
  const token = getAuthToken();
  return fetch(`${getWorkerUrl()}/${churchId}/mutate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      operation,
      payload,
      actor: 'system',
    }),
  });
}
