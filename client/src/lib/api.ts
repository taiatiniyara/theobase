const API_BASE = "/api/v1";

let accessToken: string | null = localStorage.getItem("accessToken");
let refreshToken: string | null = localStorage.getItem("refreshToken");

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function getAccessToken() {
  return accessToken;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshRes.ok) {
      const body = await refreshRes.json();
      setTokens(body.accessToken, body.refreshToken);
      headers["Authorization"] = `Bearer ${body.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      clearTokens();
    }
  }

  return res;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Login failed");
  }
  const body = await res.json();
  setTokens(body.accessToken, body.refreshToken);
  return body.user;
}

export async function fetchOrgs() {
  const res = await apiFetch("/orgs");
  if (!res.ok) throw new Error("Failed to fetch orgs");
  const body = await res.json();
  return body.orgs;
}

export async function createOrg(data: {
  name: string;
  level: string;
  parentId?: string;
}) {
  const res = await apiFetch("/orgs", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create org");
  }
  return (await res.json()).org;
}

export interface Member {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  baptismDate: string | null;
  transferRequestId: string | null;
  householdId: string | null;
}

interface MembersResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchMembers(
  churchId: string,
  params?: { status?: string; search?: string; page?: number },
): Promise<MembersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));

  const qs = searchParams.toString();
  const res = await apiFetch(
    `/churches/${churchId}/members${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error("Failed to fetch members");
  return res.json();
}

export async function createMember(
  churchId: string,
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    address?: string;
    baptismDate?: string;
    status?: string;
  },
): Promise<Member> {
  const res = await apiFetch(`/churches/${churchId}/members`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create member");
  }
  return (await res.json()).member;
}

export async function updateMember(
  churchId: string,
  id: string,
  data: Partial<Member>,
): Promise<Member> {
  const res = await apiFetch(`/churches/${churchId}/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to update member");
  }
  return (await res.json()).member;
}

export interface Transaction {
  id: string;
  orgId: string;
  fund: string;
  amount: number;
  type: string;
  description: string | null;
  donorId: string | null;
  verified: number;
  verifiedBy: string | null;
  createdBy: string;
  proxyFor: string | null;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const FUNDS = [
  "tithe",
  "local-church-budget",
  "conference-advance",
  "world-budget",
  "special-projects",
  "building-fund",
  "ingathering",
  "investment-income",
  "rental-income",
] as const;

export async function fetchTransactions(
  churchId: string,
  params?: { fund?: string; type?: string; page?: number },
): Promise<TransactionsResponse> {
  const sp = new URLSearchParams();
  if (params?.fund) sp.set("fund", params.fund);
  if (params?.type) sp.set("type", params.type);
  if (params?.page) sp.set("page", String(params.page));
  const qs = sp.toString();
  const res = await apiFetch(
    `/churches/${churchId}/transactions${qs ? `?${qs}` : ""}`,
  );
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export async function createTransaction(
  churchId: string,
  data: {
    fund: string;
    amount: number;
    type: string;
    description?: string;
    donorId?: string;
  },
): Promise<Transaction> {
  const res = await apiFetch(`/churches/${churchId}/transactions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Failed to create transaction");
  }
  return (await res.json()).transaction;
}

export async function verifyTransaction(
  churchId: string,
  id: string,
): Promise<Transaction> {
  const res = await apiFetch(
    `/churches/${churchId}/transactions/${id}/verify`,
    {
      method: "POST",
    },
  );
  if (!res.ok) throw new Error("Failed to verify transaction");
  return (await res.json()).transaction;
}
