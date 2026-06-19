const API_URL = 'https://api.theobase.net';

export function getToken(): string | null {
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

// Receipts (issue 004)
export async function getReceipts() {
  const res = await api('/receipts');
  return res.json();
}

export async function createReceipt(data: { amount: number; fundSplit: Record<string, number> }) {
  const res = await api('/receipts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Boardroom (issue 005)
export async function getBoardMeetings() {
  const res = await api('/board/meetings');
  return res.json();
}

export async function createBoardMeeting(data: { date: string; agenda: { title: string }[] }) {
  const res = await api('/board/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getBoardMeeting(id: string) {
  const res = await api(`/board/meetings/${id}`);
  return res.json();
}

export async function createBoardDecision(meetingId: string, data: { title: string; description: string; voteOutcome: string }) {
  const res = await api(`/board/meetings/${meetingId}/decisions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

// Treasury (issue 007)
export async function getTreasuryBalance() {
  const res = await api('/treasury/balance');
  return res.json();
}

// Rota (issue 006)
export async function getRota(date: string) {
  const res = await api(`/rota/${date}`);
  return res.json();
}
