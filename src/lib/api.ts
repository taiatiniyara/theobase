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
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
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

export const memberApi = {
  getMembers: (params?: { church_id?: number; status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const q = qs.toString();
    return api.get<{ members: Member[] }>(`/members${q ? `?${q}` : ""}`);
  },
  getMember: (id: number) => api.get<MemberDetail>(`/members/${id}`),
  createMember: (data: CreateMemberData) => api.post<{ id: number }>("/members", data),
  updateMember: (id: number, data: UpdateMemberData) => api.patch(`/members/${id}`, data),
  removeMember: (id: number, data: { reason: string; date?: string }) =>
    api.post(`/members/${id}/remove`, data),

  getHouseholds: (churchId?: number) =>
    api.get<{ households: Household[] }>(`/households${churchId ? `?church_id=${churchId}` : ""}`),
  createHousehold: (data: {
    churchId: number;
    name: string;
    address?: string;
    headMemberId?: number;
  }) => api.post("/households", data),
  updateHousehold: (
    id: number,
    data: { name?: string; address?: string; headMemberId?: number | null }
  ) => api.patch(`/households/${id}`, data),

  getPositions: () => api.get<{ positions: Position[] }>("/positions"),
  createPosition: (data: { name: string; module?: string }) => api.post("/positions", data),
  assignPosition: (memberId: number, positionId: number, startDate?: string) =>
    api.post(`/members/${memberId}/positions`, { positionId, startDate }),
  removePosition: (memberId: number, positionId: number) =>
    api.del(`/members/${memberId}/positions/${positionId}`),

  getTransfers: (params?: { church_id?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return api.get<{ transfers: Transfer[] }>(`/transfers${q ? `?${q}` : ""}`);
  },
  initiateTransfer: (data: { memberId: number; toChurchId: number }) =>
    api.post("/transfers", data),
  approveTransfer: (id: number) => api.post(`/transfers/${id}/approve`),
  acceptTransfer: (id: number) => api.post(`/transfers/${id}/accept`),
  rejectTransfer: (id: number) => api.post(`/transfers/${id}/reject`),
};

export interface Member {
  id: number;
  church_id: number;
  household_id: number | null;
  full_name: string;
  preferred_name: string | null;
  dob: string | null;
  gender: string | null;
  baptism_date: string | null;
  baptism_type: string | null;
  join_date: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MemberDetail extends Member {
  prev_church_id: number | null;
  address: string | null;
  marital_status: string | null;
  status_date: string | null;
  church_name: string | null;
  household_name: string | null;
  positions: {
    id: number;
    name: string;
    module: string;
    start_date: string;
    end_date: string | null;
  }[];
}

export interface Household {
  id: number;
  church_id: number;
  head_member_id: number | null;
  name: string;
  address: string | null;
  created_at: string;
  head_member_name: string | null;
  member_count: number;
}

export interface Position {
  id: number;
  name: string;
  module: string;
}

export interface Transfer {
  id: number;
  member_id: number;
  from_church_id: number;
  to_church_id: number;
  initiated_by: number;
  initiated_at: string;
  conference_approved_by: number | null;
  conference_approved_at: string | null;
  accepted_by: number | null;
  accepted_at: string | null;
  status: string;
  member_name: string;
  from_church_name: string;
  to_church_name: string;
}

export interface CreateMemberData {
  churchId: number;
  householdId?: number;
  fullName: string;
  preferredName?: string;
  dob?: string;
  gender?: string;
  baptismDate?: string;
  baptismType?: string;
  joinDate?: string;
  prevChurchId?: number;
  phone?: string;
  email?: string;
  address?: string;
  maritalStatus?: string;
}

export interface UpdateMemberData extends Partial<CreateMemberData> {
  version: number;
}
