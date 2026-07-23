const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

export { getToken };

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

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function inferQueueType(path: string, method: string): string {
  if (path.startsWith("/finance/batches") && method === "POST") return "finance:createBatch";
  if (path.startsWith("/finance/transactions") && method === "POST")
    return "finance:createTransaction";
  if (path.startsWith("/finance/expenses") && method === "POST") return "finance:createExpense";
  if (path.startsWith("/members") && method === "POST") return "member:create";
  if (path.startsWith("/members") && method === "PATCH") return "member:update";
  return "generic";
}

async function queueOffline(
  path: string,
  options: RequestInit
): Promise<{ queued: boolean; clientUuid: string; id?: number }> {
  const { queueOperation } = await import("./offline-db");
  const { triggerSync } = await import("./sync-manager");
  let payload: unknown = null;
  try {
    payload = options.body ? JSON.parse(options.body as string) : null;
  } catch {
    payload = options.body;
  }
  const type = inferQueueType(path, options.method ?? "POST");
  const op = await queueOperation(type, path, options.method ?? "POST", payload);
  triggerSync();
  return { queued: true, clientUuid: op.clientUuid };
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

  const method = (options.method || "GET").toUpperCase();
  if (!isOnline() && method !== "GET") {
    return queueOffline(path, options) as unknown as T;
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
  rejectTransfer: (id: number, note?: string) => api.post(`/transfers/${id}/reject`, { note }),
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
  rejection_note: string | null;
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

export interface Fund {
  id: number;
  name: string;
  type: string;
  forwarding_rule: string;
  conference_id: number;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  conference_id: number;
  active: number;
  created_at: string;
}

export interface Batch {
  id: number;
  church_id: number;
  sabbath_date: string;
  status: string;
  confirmed_by_1: number | null;
  confirmed_at_1: string | null;
  confirmed_by_2: number | null;
  confirmed_at_2: string | null;
  submitted_by: number | null;
  submitted_at: string | null;
  created_at: string;
  church_name: string;
  confirmed_by_1_email: string | null;
  confirmed_by_2_email: string | null;
  submitted_by_email: string | null;
  transaction_count: number;
  total_amount: number;
}

export interface BatchDetail extends Batch {
  transactions: Transaction[];
}

export interface Transaction {
  id: number;
  church_id: number;
  fund_id: number;
  type: string;
  amount: number;
  description: string | null;
  category_id: number | null;
  budget_ref: number | null;
  batch_id: number | null;
  envelope_number: number | null;
  member_id: number | null;
  created_by: number;
  created_at: string;
  confirmed_by: number | null;
  confirmed_at: string | null;
  uuid: string;
  fund_name: string;
  fund_type: string;
  church_name: string;
  created_by_email: string;
  confirmed_by_email: string | null;
  category_name: string | null;
  member_name: string | null;
}

export interface Budget {
  id: number;
  church_id: number;
  fund_id: number;
  category_id: number;
  planned_amount: number;
  fiscal_year: number;
  approved: number;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  fund_name: string;
  fund_type: string;
  church_name: string;
  category_name: string;
  spent_amount: number;
}

export interface MonthlyReport {
  churchId: number;
  period: { year: number; month: number };
  openingBalance: number;
  incomeByFund: {
    id: number;
    fund_name: string;
    fund_type: string;
    total: number;
    forwarded: number;
    isPassThrough: boolean;
  }[];
  expensesByCategory: {
    id: number;
    category_name: string;
    total: number;
    budgeted: number;
    remaining: number;
  }[];
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
}

export interface QuarterlyReport {
  churchId: number;
  period: { year: number; quarter: number };
  membership: {
    opening: number;
    baptisms: number;
    professions: number;
    transfersIn: number;
    transfersOut: number;
    deaths: number;
    removals: number;
    closing: number;
  };
  finance: {
    titheForwarded: number;
    localBudgetIncome: number;
    localBudgetExpenses: number;
    localBudgetBalance: number;
    sabbathSchoolForwarded: number;
  };
  officers: { memberName: string; positionName: string }[];
}

export interface Notification {
  id: number;
  recipient_user_id: number;
  type: string;
  entity_type: string;
  entity_id: number;
  message: string;
  read: number;
  created_at: string;
  actor_email: string | null;
}

export const notificationApi = {
  getNotifications: (unreadOnly?: boolean) => {
    const qs = unreadOnly ? "?unread=1" : "";
    return api.get<{ notifications: Notification[] }>(`/notifications${qs}`);
  },
  markRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
};

export interface BudgetTemplate {
  id: number;
  conference_id: number;
  category_id: number;
  fund_id: number;
  planned_amount: number;
  fiscal_year: number;
  created_at: string;
  category_name: string;
  fund_name: string;
}

export const financeApi = {
  getFunds: (conferenceId?: number) => {
    const qs = conferenceId ? `?conference_id=${conferenceId}` : "";
    return api.get<{ funds: Fund[] }>(`/funds${qs}`);
  },
  createFund: (data: {
    name: string;
    type: string;
    forwardingRule: string;
    conferenceId: number;
  }) => api.post<{ id: number }>("/funds", data),

  getExpenseCategories: (conferenceId?: number, includeInactive?: boolean) => {
    const qs = new URLSearchParams();
    if (conferenceId) qs.set("conference_id", String(conferenceId));
    if (includeInactive) qs.set("include_inactive", "1");
    const q = qs.toString();
    return api.get<{ expenseCategories: ExpenseCategory[] }>(
      `/expense-categories${q ? `?${q}` : ""}`
    );
  },
  createExpenseCategory: (data: { name: string; conferenceId: number }) =>
    api.post<{ id: number }>("/expense-categories", data),
  updateExpenseCategory: (id: number, data: { name?: string; active?: boolean }) =>
    api.patch(`/expense-categories/${id}`, data),

  getBatches: (params?: { church_id?: number; status?: string; sabbath_date?: string }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.status) qs.set("status", params.status);
    if (params?.sabbath_date) qs.set("sabbath_date", params.sabbath_date);
    const q = qs.toString();
    return api.get<{ batches: Batch[] }>(`/finance/batches${q ? `?${q}` : ""}`);
  },
  getBatch: (id: number) => api.get<BatchDetail>(`/finance/batches/${id}`),
  createBatch: (data: { churchId: number; sabbathDate: string }) =>
    api.post<{ id: number }>("/finance/batches", data),
  confirmBatch: (id: number) =>
    api.post<{ confirmedBy: number; status?: string; batchId: number }>(
      `/finance/batches/${id}/confirm`
    ),

  getTransactions: (params?: {
    church_id?: number;
    fund_id?: number;
    type?: string;
    batch_id?: number;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.fund_id) qs.set("fund_id", String(params.fund_id));
    if (params?.type) qs.set("type", params.type);
    if (params?.batch_id) qs.set("batch_id", String(params.batch_id));
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const q = qs.toString();
    return api.get<{ transactions: Transaction[] }>(`/finance/transactions${q ? `?${q}` : ""}`);
  },
  createTransaction: (data: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    batchId: number;
    envelopeNumber?: number;
    memberId?: number;
  }) => api.post<{ id: number }>("/finance/transactions", data),
  createExpense: (data: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    categoryId?: number;
    budgetRef?: number;
  }) => api.post<{ id: number }>("/finance/expenses", data),

  getBudgets: (params?: { church_id?: number; fiscal_year?: number }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.fiscal_year) qs.set("fiscal_year", String(params.fiscal_year));
    const q = qs.toString();
    return api.get<{ budgets: Budget[] }>(`/finance/budgets${q ? `?${q}` : ""}`);
  },
  createBudget: (data: {
    churchId: number;
    fundId: number;
    categoryId: number;
    plannedAmount: number;
    fiscalYear: number;
  }) => api.post<{ id: number }>("/finance/budgets", data),
  approveBudget: (id: number) => api.post(`/finance/budgets/${id}/approve`),

  getBudgetTemplates: (conferenceId: number, fiscalYear?: number) => {
    const qs = new URLSearchParams();
    qs.set("conference_id", String(conferenceId));
    if (fiscalYear) qs.set("fiscal_year", String(fiscalYear));
    return api.get<{ budgetTemplates: BudgetTemplate[] }>(
      `/finance/budget-templates?${qs.toString()}`
    );
  },
  createBudgetTemplate: (data: {
    conferenceId: number;
    categoryId: number;
    fundId: number;
    plannedAmount: number;
    fiscalYear: number;
  }) => api.post<{ id: number }>("/finance/budget-templates", data),

  getMonthlyReport: (churchId: number, year: number, month: number) =>
    api.get<{ report: MonthlyReport }>(
      `/finance/report/monthly?church_id=${churchId}&year=${year}&month=${month}`
    ),
  getQuarterlyReport: (churchId: number, year: number, quarter: number) =>
    api.get<{ report: QuarterlyReport }>(
      `/report/quarterly?church_id=${churchId}&year=${year}&quarter=${quarter}`
    ),
};

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  prev_state: string | null;
  new_state: string | null;
  module: string;
  device_info: string | null;
  actor_email: string | null;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const auditApi = {
  getLog: (params?: {
    entity_type?: string;
    entity_id?: number;
    actor_id?: number;
    action?: string;
    module?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.entity_type) qs.set("entity_type", params.entity_type);
    if (params?.entity_id) qs.set("entity_id", String(params.entity_id));
    if (params?.actor_id) qs.set("actor_id", String(params.actor_id));
    if (params?.action) qs.set("action", params.action);
    if (params?.module) qs.set("module", params.module);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return api.get<AuditLogResponse>(`/audit${q ? `?${q}` : ""}`);
  },
  getEntityLog: (
    entityType: string,
    entityId: number,
    params?: { page?: number; limit?: number }
  ) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return api.get<AuditLogResponse>(`/audit/${entityType}/${entityId}${q ? `?${q}` : ""}`);
  },
};

export interface TitheEntry {
  churchId: number;
  churchName: string;
  forwardedAmount: number;
  status: string;
  receivedAmount: number;
  note: string | null;
}

export interface TitheReportEntry {
  churchId: number;
  churchName: string;
  forwarded: number;
  received: number;
  difference: number;
  status: string;
}

export interface ChurchBalance {
  id: number;
  churchId?: number;
  year: number;
  month: number;
  bankBalance: number;
  systemBalance: number;
  bankDiscrepancy: number;
  bankNote: string | null;
  titheStatus: string;
  receivedTithe: number;
  forwardedTithe: number;
}

export const reconciliationApi = {
  getConferenceTithe: (year: number, month: number) =>
    api.get<{ tithe: TitheEntry[] }>(`/conference/tithe?year=${year}&month=${month}`),
  receiveTithe: (data: {
    churchId: number;
    year: number;
    month: number;
    receivedAmount?: number;
    note?: string;
  }) =>
    api.post<{
      reconciliation: { titheStatus: string; titheDiscrepancy: number };
    }>(`/conference/tithe/receive`, data),
  getTitheReport: (year: number, month: number) =>
    api.get<{ report: TitheReportEntry[] }>(`/conference/tithe/report?year=${year}&month=${month}`),
  getChurchBalance: (churchId: number, year: number, month: number) =>
    api.get<{ reconciliation: ChurchBalance | null }>(
      `/church/balance?church_id=${churchId}&year=${year}&month=${month}`
    ),
  recordChurchBalance: (data: {
    churchId: number;
    year: number;
    month: number;
    bankBalance: number;
    note?: string;
  }) =>
    api.post<{
      reconciliation: { bankBalance: number; systemBalance: number; bankDiscrepancy: number };
    }>(`/church/balance`, data),
};

export interface AttendanceRecord {
  id: number;
  church_id: number;
  date: string;
  count: number;
  category: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  category: string;
  average: number | null;
  weeks: number;
  min: number | null;
  max: number | null;
}

export interface AttendanceTrendPoint {
  date: string;
  count: number;
  category: string;
}

export const attendanceApi = {
  record: (data: {
    churchId: number;
    date: string;
    count: number;
    category: string;
    memberIds?: number[];
  }) => api.post<{ id: number; updated: boolean }>("/attendance", data),
  list: (params?: { church_id?: number; from?: string; to?: string; category?: string }) => {
    const qs = new URLSearchParams();
    if (params?.church_id) qs.set("church_id", String(params.church_id));
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.category) qs.set("category", params.category);
    const q = qs.toString();
    return api.get<{ attendance: AttendanceRecord[] }>(`/attendance${q ? `?${q}` : ""}`);
  },
  stats: (params: { church_id: number; from?: string; to?: string; category?: string }) => {
    const qs = new URLSearchParams();
    qs.set("church_id", String(params.church_id));
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.category) qs.set("category", params.category);
    return api.get<{ stats: AttendanceStats[]; trend: AttendanceTrendPoint[] }>(
      `/attendance/stats?${qs.toString()}`
    );
  },
};
