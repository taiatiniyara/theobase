const API_URL = 'https://api.theobase.net';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('theobase_token');
}

export function setToken(token: string) {
  localStorage.setItem('theobase_token', token);
}

export function clearToken() {
  localStorage.removeItem('theobase_token');
}

export async function api(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (res.status === 401 && token) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
      window.location.href = '/';
    }
    return res;
  }
  return res;
}

export async function requestMagicLink(email: string) {
  const res = await fetch(`${API_URL}/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function verifyToken(token: string) {
  const res = await api('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  return res.json();
}

export async function getMe() {
  const res = await api('/me');
  return res.json();
}

export async function updateMe(data: { phone?: string; address?: string }) {
  const res = await api('/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}
