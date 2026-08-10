import { authorize, type AuthContext } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { createDb } from "../lib/db";
import { AuditRepo, type AuditEntry } from "../repos/audit";
import { json } from "../lib/response";

interface ErrorLogRow {
  id: number;
  path: string;
  method: string;
  message: string;
  stack: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function handleGetErrorLogs(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["audit:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const offset = (page - 1) * limit;

  const countResult = await env.DB.prepare("SELECT COUNT(*) as count FROM error_logs").first<{
    count: number;
  }>();
  const total = countResult?.count ?? 0;

  const entries = await env.DB.prepare(
    "SELECT * FROM error_logs ORDER BY created_at DESC LIMIT ?1 OFFSET ?2"
  )
    .bind(limit, offset)
    .all<ErrorLogRow>();

  return json({
    entries: entries.results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

function toAuditEntry(e: AuditEntry) {
  return {
    id: e.id,
    timestamp: e.timestamp,
    actor_id: e.actorId,
    actor_email: e.actorEmail,
    action: e.action,
    entity_type: e.entityType,
    entity_id: e.entityId,
    prev_state: e.prevState,
    new_state: e.newState,
    module: e.module,
    device_info: e.deviceInfo,
  };
}

export async function handleGetAuditLog(
  request: Request,
  env: Env,
  auth: AuthContext
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["audit:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const entityType = url.searchParams.get("entity_type");
  const entityId = url.searchParams.get("entity_id");
  const actorId = url.searchParams.get("actor_id");
  const action = url.searchParams.get("action");
  const module = url.searchParams.get("module");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const repo = new AuditRepo(createDb(env, auth.conferenceId));
  const { entries, total } = await repo.findAll(
    {
      entityType: entityType ?? undefined,
      entityId: entityId ? Number(entityId) : undefined,
      actorId: actorId ? Number(actorId) : undefined,
      action: action ?? undefined,
      module: module ?? undefined,
      from: from ?? undefined,
      to: to ?? undefined,
    },
    page,
    limit
  );

  return json({
    entries: entries.map(toAuditEntry),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function handleGetAuditByEntity(
  request: Request,
  env: Env,
  auth: AuthContext,
  entityType: string,
  entityId: number
): Promise<Response> {
  const forbidden = authorize(auth, PERMISSIONS["audit:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const repo = new AuditRepo(createDb(env, auth.conferenceId));
  const { entries, total } = await repo.findByEntity(entityType, entityId, page, limit);

  return json({
    entries: entries.map(toAuditEntry),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
