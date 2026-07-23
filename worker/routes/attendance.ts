import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createDb } from "../lib/db";
import { AttendanceRepo, type AttendanceRow } from "../repos/attendance";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const CATEGORIES = ["sabbath-school", "church-service", "youth"] as const;

function toAttendanceResponse(a: AttendanceRow) {
  return {
    id: a.id,
    church_id: a.churchId,
    date: a.date,
    count: a.count,
    category: a.category,
    created_by: a.createdBy,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

export async function handleRecordAttendance(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["attendance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    date: string;
    count: number;
    category: string;
    memberIds?: number[];
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.date || body.count === undefined || !body.category) {
    return json({ error: "churchId, date, count, and category are required" }, 400);
  }

  if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
    return json({ error: `category must be one of: ${CATEGORIES.join(", ")}` }, 400);
  }

  if (typeof body.count !== "number" || body.count < 0) {
    return json({ error: "count must be a non-negative number" }, 400);
  }

  const repo = new AttendanceRepo(createDb(env));

  const existing = await repo.findAll({
    churchId: body.churchId,
    from: body.date,
    to: body.date,
    category: body.category,
  });
  const prev = existing.length > 0 ? existing[0] : null;

  const attendance = await repo.upsert({
    churchId: body.churchId,
    date: body.date,
    count: body.count,
    category: body.category,
    createdBy: Number(auth.userId),
  });

  const updated = prev !== null;

  if (body.memberIds && body.memberIds.length > 0) {
    const existingMemberIds = await repo.getMemberIds(attendance.id);
    if (existingMemberIds.length > 0) {
      await repo.removeMembers(attendance.id, existingMemberIds);
    }
    await repo.addMembers(attendance.id, body.memberIds);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: updated ? "attendance:update" : "attendance:create",
    entity_type: "attendance",
    entity_id: attendance.id,
    prev_state: prev ? JSON.stringify({ count: prev.count }) : null,
    new_state: JSON.stringify({ count: body.count, category: body.category, date: body.date }),
    module: "attendance",
    device_info: getDeviceInfo(request),
  });

  return json({ id: attendance.id, updated }, updated ? 200 : 201);
}

export async function handleGetAttendance(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["attendance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const category = url.searchParams.get("category");

  const repo = new AttendanceRepo(createDb(env));
  const attendance = await repo.findAll({
    churchId: churchId ? Number(churchId) : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    category: category ?? undefined,
  });

  return json({ attendance: attendance.map(toAttendanceResponse) });
}

export async function handleGetAttendanceStats(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["attendance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!churchId) {
    return json({ error: "church_id is required" }, 400);
  }

  const repo = new AttendanceRepo(createDb(env));
  const cid = Number(churchId);

  const stats = await repo.getStats(cid, from ?? undefined, to ?? undefined);
  const trend = await repo.getTrend(cid, from ?? undefined, to ?? undefined);

  return json({ stats, trend });
}
