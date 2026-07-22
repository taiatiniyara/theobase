const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      setTokens(data.accessToken, data.refreshToken);
      headers["Authorization"] = `Bearer ${data.accessToken}`;
      const retryRes = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: retryRes.statusText }));
        throw err;
      }
      return retryRes.json();
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw err;
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  role: string;
  conferenceId?: number;
  churchId?: number;
  conferenceName?: string;
}

export const authApi = {
  signup: (data: { email: string; password: string; fullName: string; conferenceName?: string }) =>
    api.post<AuthResponse>("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", data),
  refresh: () => api.post<AuthResponse>("/auth/refresh", { refreshToken: getRefreshToken() }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post("/auth/reset-password", { token, newPassword }),
  me: () =>
    request<{
      id: number;
      email: string;
      role: string;
      conference: { id: number; name: string } | null;
      church: { id: number; name: string } | null;
    }>("/auth/me"),
};

export const orgApi = {
  getConferences: () =>
    api.get<{ conferences: { id: number; name: string; code: string }[] }>("/conferences"),
  createConference: (data: {
    name: string;
    code: string;
    address?: string;
    bankDetails?: string;
  }) => api.post("/conferences", data),
  updateConference: (id: number, data: Record<string, unknown>) =>
    api.patch(`/conferences/${id}`, data),
  getDistricts: (conferenceId: number) =>
    api.get<{ districts: { id: number; name: string; pastor_email?: string }[] }>(
      `/conferences/${conferenceId}/districts`
    ),
  createDistrict: (conferenceId: number, data: { name: string; pastorUserId?: number }) =>
    api.post(`/conferences/${conferenceId}/districts`, data),
  updateDistrict: (id: number, data: Record<string, unknown>) =>
    api.patch(`/districts/${id}`, data),
  getChurches: (conferenceId: number) =>
    api.get<{ churches: { id: number; name: string; type: string; district_name?: string }[] }>(
      `/conferences/${conferenceId}/churches`
    ),
  createChurch: (data: {
    name: string;
    code?: string;
    type: string;
    parentId: number;
    parentType: string;
    districtId?: number;
    address?: string;
  }) => api.post("/churches", data),
  updateChurch: (id: number, data: Record<string, unknown>) => api.patch(`/churches/${id}`, data),
  bulkCreateChurches: (conferenceId: number, csv: string) =>
    api.post("/churches/bulk", { conferenceId, csv }),
};

export const userApi = {
  getUsers: (conferenceId?: number) =>
    api.get<{ users: { id: number; email: string; role: string }[] }>(
      `/users${conferenceId ? `?conference_id=${conferenceId}` : ""}`
    ),
  inviteUser: (data: { email: string; role: string; conferenceId?: number; churchId?: number }) =>
    api.post("/users/invite", data),
  bulkInvite: (conferenceId: number, csv: string) =>
    api.post("/users/bulk-invite", { conferenceId, csv }),
};
