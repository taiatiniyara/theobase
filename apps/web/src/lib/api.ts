const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// credentials: 'include' on every call — the session cookie is
// httpOnly and cross-origin (see apps/api's CORS setup from #8), so it
// only rides along on requests that ask for it explicitly.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(res.status, body.error ?? `Request failed with status ${res.status}`)
  }
  return (await res.json()) as T
}
