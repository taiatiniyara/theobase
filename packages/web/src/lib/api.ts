function getWorkerUrl(): string {
  const origin = import.meta.env.PROD ? 'https://theobase-worker.theobase.workers.dev' : '';
  return `${origin}/church`;
}

export async function fetchChurchState(churchId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${getWorkerUrl()}/${churchId}/state`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<Record<string, unknown>>;
}

function getAuthToken(): string | null {
  return localStorage.getItem('token');
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
