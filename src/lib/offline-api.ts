import { getOnlineStatus, triggerSync } from "./sync-manager";
import { queueOperation } from "./offline-db";

export { setTokens, clearTokens, getToken, getRefreshToken } from "./api";

function stripApiBase(path: string): string {
  return path.startsWith("/api") ? path.slice(4) : path;
}

export async function offlineSafeRequest<T>(
  path: string,
  options: RequestInit = {},
  operationType?: string
): Promise<T> {
  const isOnline = getOnlineStatus();
  const method = (options.method ?? "GET").toUpperCase();

  if (!isOnline && method !== "GET") {
    const endpoint = stripApiBase(path);
    const type = operationType ?? inferOperationType(endpoint, method);
    let payload: unknown = null;
    try {
      payload = options.body ? JSON.parse(options.body as string) : null;
    } catch {
      payload = options.body;
    }

    const op = await queueOperation(type, endpoint, method, payload);
    triggerSync();
    return { queued: true, clientUuid: op.clientUuid } as unknown as T;
  }

  const { api } = await import("./api");
  if (method === "GET") return api.get<T>(path);
  if (method === "POST")
    return api.post<T>(path, options.body ? JSON.parse(options.body as string) : undefined);
  if (method === "PATCH")
    return api.patch<T>(path, options.body ? JSON.parse(options.body as string) : undefined);
  if (method === "DELETE") return api.del<T>(path);
  return api.get<T>(path);
}

function inferOperationType(endpoint: string, method: string): string {
  if (endpoint.startsWith("/finance/batches") && method === "POST") return "finance:createBatch";
  if (endpoint.startsWith("/finance/transactions") && method === "POST")
    return "finance:createTransaction";
  if (endpoint.startsWith("/finance/expenses") && method === "POST") return "finance:createExpense";
  if (endpoint.startsWith("/members") && method === "POST") return "member:create";
  if (endpoint.startsWith("/members") && method === "PATCH") return "member:update";
  return "generic";
}

export async function pullFreshData(
  churchId: number
): Promise<{ members: unknown[]; batches: unknown[]; transactions: unknown[] }> {
  const { api } = await import("./api");
  const [membersData, batchesData, transactionsData] = await Promise.all([
    api
      .get<{ members: unknown[] }>(`/members?church_id=${churchId}`)
      .catch(() => ({ members: [] })),
    api
      .get<{ batches: unknown[] }>(`/finance/batches?church_id=${churchId}`)
      .catch(() => ({ batches: [] })),
    api
      .get<{ transactions: unknown[] }>(`/finance/transactions?church_id=${churchId}`)
      .catch(() => ({ transactions: [] })),
  ]);
  return {
    members: membersData.members,
    batches: batchesData.batches,
    transactions: transactionsData.transactions,
  };
}
