import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";

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

  const prev = await env.DB.prepare(
    `SELECT id, count FROM attendance
     WHERE church_id = ? AND date = ? AND category = ?`
  )
    .bind(body.churchId, body.date, body.category)
    .first<{ id: number; count: number }>();

  const result = await env.DB.prepare(
    `INSERT INTO attendance (church_id, date, count, category, created_by)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(church_id, date, category)
     DO UPDATE SET count = ?, updated_at = datetime('now')
     RETURNING id`
  )
    .bind(body.churchId, body.date, body.count, body.category, Number(auth.userId), body.count)
    .first<{ id: number }>();

  const attendanceId = result!.id;
  const updated = prev !== null;
  const action = updated ? "attendance:update" : "attendance:create";

  if (body.memberIds && body.memberIds.length > 0) {
    await env.DB.prepare(`DELETE FROM member_attendance WHERE attendance_id = ?`)
      .bind(attendanceId)
      .run();

    const stmt = env.DB.prepare(
      `INSERT OR IGNORE INTO member_attendance (attendance_id, member_id) VALUES (?, ?)`
    );
    const batch: D1PreparedStatement[] = body.memberIds.map((mid) => stmt.bind(attendanceId, mid));
    if (batch.length > 0) {
      await env.DB.batch(batch);
    }
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action,
    entity_type: "attendance",
    entity_id: attendanceId,
    prev_state: prev ? JSON.stringify({ count: prev.count }) : null,
    new_state: JSON.stringify({ count: body.count, category: body.category, date: body.date }),
    module: "attendance",
    device_info: getDeviceInfo(request),
  });

  return json({ id: attendanceId, updated }, updated ? 200 : 201);
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

  let query = `SELECT id, church_id, date, count, category, created_by, created_at, updated_at
    FROM attendance WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND church_id = ?";
    params.push(Number(churchId));
  }
  if (from) {
    query += " AND date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND date <= ?";
    params.push(to);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  query += " ORDER BY date DESC, category";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all<{
      id: number;
      church_id: number;
      date: string;
      count: number;
      category: string;
      created_by: number;
      created_at: string;
      updated_at: string;
    }>();

  return json({ attendance: result.results });
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
  const category = url.searchParams.get("category");

  if (!churchId) {
    return json({ error: "church_id is required" }, 400);
  }

  let query = `SELECT category, AVG(count) as average, COUNT(*) as weeks, MIN(count) as min, MAX(count) as max
    FROM attendance WHERE church_id = ?`;
  const params: (string | number)[] = [Number(churchId)];

  if (from) {
    query += " AND date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND date <= ?";
    params.push(to);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  query += " GROUP BY category ORDER BY category";

  const stats = await env.DB.prepare(query)
    .bind(...params)
    .all<{
      category: string;
      average: number | null;
      weeks: number;
      min: number | null;
      max: number | null;
    }>();

  let trendQuery = `SELECT date, count, category FROM attendance
    WHERE church_id = ?`;
  const trendParams: (string | number)[] = [Number(churchId)];

  if (from) {
    trendQuery += " AND date >= ?";
    trendParams.push(from);
  }
  if (to) {
    trendQuery += " AND date <= ?";
    trendParams.push(to);
  }
  if (category) {
    trendQuery += " AND category = ?";
    trendParams.push(category);
  }
  trendQuery += " ORDER BY date";

  const trend = await env.DB.prepare(trendQuery)
    .bind(...trendParams)
    .all<{ date: string; count: number; category: string }>();

  return json({ stats: stats.results, trend: trend.results });
}
