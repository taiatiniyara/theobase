import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function handleGetAuditLog(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

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
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  const params: (string | number)[] = [];

  if (entityType) {
    where += " AND al.entity_type = ?";
    params.push(entityType);
  }
  if (entityId) {
    where += " AND al.entity_id = ?";
    params.push(Number(entityId));
  }
  if (actorId) {
    where += " AND al.actor_id = ?";
    params.push(Number(actorId));
  }
  if (action) {
    where += " AND al.action = ?";
    params.push(action);
  }
  if (module) {
    where += " AND al.module = ?";
    params.push(module);
  }
  if (from) {
    where += " AND al.timestamp >= ?";
    params.push(from);
  }
  if (to) {
    where += " AND al.timestamp <= ?";
    params.push(to);
  }

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM audit_log al ${where}`)
    .bind(...params)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  const result = await env.DB.prepare(
    `SELECT al.*, u.email as actor_email
     FROM audit_log al
     LEFT JOIN users u ON al.actor_id = u.id
     ${where}
     ORDER BY al.timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(...params, limit, offset)
    .all();

  return json({
    entries: result.results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function handleGetAuditByEntity(
  request: Request,
  env: Env,
  entityType: string,
  entityId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["audit:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM audit_log WHERE entity_type = ? AND entity_id = ?`
  )
    .bind(entityType, entityId)
    .first<{ total: number }>();

  const total = countResult?.total ?? 0;

  const result = await env.DB.prepare(
    `SELECT al.*, u.email as actor_email
     FROM audit_log al
     LEFT JOIN users u ON al.actor_id = u.id
     WHERE al.entity_type = ? AND al.entity_id = ?
     ORDER BY al.timestamp DESC
     LIMIT ? OFFSET ?`
  )
    .bind(entityType, entityId, limit, (page - 1) * limit)
    .all();

  return json({
    entries: result.results,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
