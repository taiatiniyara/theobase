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

export async function handleConferenceDashboard(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const districtId = url.searchParams.get("district_id");

  const user = await env.DB.prepare("SELECT conference_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ conference_id: number }>();
  if (!user?.conference_id) return json({ error: "No conference" }, 400);

  const confId = user.conference_id;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const yearStart = `${y}-01-01`;

  const churchWhere = districtId ? "AND c.district_id = ?" : "";
  const churchJoin = districtId ? `AND c.district_id = ${Number(districtId)}` : "";

  const titheResult = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN churches c ON t.church_id = c.id
     JOIN funds f ON t.fund_id = f.id
     WHERE c.parent_id = ? AND c.parent_type = 'conference'
       AND t.type = 'income' AND f.type = 'tithe'
       AND t.confirmed_by IS NOT NULL
       AND t.created_at >= ? ${churchWhere}`
  )
    .bind(confId, periodStart, ...(districtId ? [Number(districtId)] : []))
    .first<{ total: number }>();

  const membershipResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM members m
     JOIN churches c ON m.church_id = c.id
     WHERE c.parent_id = ? AND c.parent_type = 'conference'
       AND m.status = 'active'`
  )
    .bind(confId)
    .first<{ total: number }>();

  const baptismsResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM members m
     JOIN churches c ON m.church_id = c.id
     WHERE c.parent_id = ? AND c.parent_type = 'conference'
       AND m.baptism_type = 'immersion'
       AND m.baptism_date >= ?`
  )
    .bind(confId, yearStart)
    .first<{ total: number }>();

  const churchCountResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM churches c
     WHERE c.parent_id = ? AND c.parent_type = 'conference' ${churchJoin}`
  )
    .bind(confId)
    .first<{ total: number }>();

  const churchesResult = await env.DB.prepare(
    `SELECT
       c.id,
       c.name,
       c.type,
       COALESCE(d.name, '-') as district_name,
       COALESCE(SUM(CASE WHEN t.type = 'income' AND f.type = 'tithe' AND t.confirmed_by IS NOT NULL AND t.created_at >= ? THEN t.amount ELSE 0 END), 0) as tithe_mtd,
       COALESCE(COUNT(DISTINCT m.id) FILTER(WHERE m.status = 'active'), 0) as member_count,
       COALESCE(COUNT(DISTINCT m.id) FILTER(WHERE m.baptism_type = 'immersion' AND m.baptism_date >= ?), 0) as baptisms_ytd
     FROM churches c
     LEFT JOIN districts d ON c.district_id = d.id
     LEFT JOIN transactions t ON t.church_id = c.id
     LEFT JOIN funds f ON t.fund_id = f.id
     LEFT JOIN members m ON m.church_id = c.id
     WHERE c.parent_id = ? AND c.parent_type = 'conference' ${churchJoin}
     GROUP BY c.id
     ORDER BY c.name`
  )
    .bind(periodStart, yearStart, confId)
    .all();

  const districtsResult = await env.DB.prepare(
    `SELECT id, name FROM districts WHERE conference_id = ? ORDER BY name`
  )
    .bind(confId)
    .all();

  return json({
    summary: {
      titheForwardedThisMonth: titheResult?.total ?? 0,
      totalMembership: membershipResult?.total ?? 0,
      baptismsThisYear: baptismsResult?.total ?? 0,
      churchCount: churchCountResult?.total ?? 0,
    },
    churches: (churchesResult.results as Record<string, unknown>[]).map((r) => ({
      id: r.id as number,
      name: r.name as string,
      type: r.type as string,
      districtName: r.district_name as string,
      titheMtd: r.tithe_mtd as number,
      memberCount: r.member_count as number,
      baptismsYtd: r.baptisms_ytd as number,
    })),
    districts: districtsResult.results as { id: number; name: string }[],
  });
}

export async function handleDistrictDashboard(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const user = await env.DB.prepare("SELECT id, conference_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ id: number; conference_id: number }>();
  if (!user?.conference_id) return json({ error: "No conference" }, 400);

  const districtRow = await env.DB.prepare(
    `SELECT id, name FROM districts WHERE pastor_user_id = ? AND conference_id = ?`
  )
    .bind(user.id, user.conference_id)
    .first<{ id: number; name: string }>();

  if (!districtRow) {
    return json({ error: "No district assigned" }, 404);
  }

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const yearStart = `${y}-01-01`;

  const districtId = districtRow.id;

  const titheResult = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN churches c ON t.church_id = c.id
     JOIN funds f ON t.fund_id = f.id
     WHERE c.district_id = ? AND t.type = 'income' AND f.type = 'tithe'
       AND t.confirmed_by IS NOT NULL AND t.created_at >= ?`
  )
    .bind(districtId, periodStart)
    .first<{ total: number }>();

  const membershipResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM members m
     JOIN churches c ON m.church_id = c.id
     WHERE c.district_id = ? AND m.status = 'active'`
  )
    .bind(districtId)
    .first<{ total: number }>();

  const baptismsResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM members m
     JOIN churches c ON m.church_id = c.id
     WHERE c.district_id = ? AND m.baptism_type = 'immersion' AND m.baptism_date >= ?`
  )
    .bind(districtId, yearStart)
    .first<{ total: number }>();

  const churchCountResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM churches WHERE district_id = ?`
  )
    .bind(districtId)
    .first<{ total: number }>();

  const churchesResult = await env.DB.prepare(
    `SELECT
       c.id, c.name, c.type,
       COALESCE(SUM(CASE WHEN t.type = 'income' AND f.type = 'tithe' AND t.confirmed_by IS NOT NULL AND t.created_at >= ? THEN t.amount ELSE 0 END), 0) as tithe_mtd,
       COALESCE(COUNT(DISTINCT m.id) FILTER(WHERE m.status = 'active'), 0) as member_count,
       COALESCE(COUNT(DISTINCT m.id) FILTER(WHERE m.baptism_type = 'immersion' AND m.baptism_date >= ?), 0) as baptisms_ytd
     FROM churches c
     LEFT JOIN transactions t ON t.church_id = c.id
     LEFT JOIN funds f ON t.fund_id = f.id
     LEFT JOIN members m ON m.church_id = c.id
     WHERE c.district_id = ?
     GROUP BY c.id
     ORDER BY c.name`
  )
    .bind(periodStart, yearStart, districtId)
    .all();

  return json({
    district: { id: districtRow.id, name: districtRow.name },
    summary: {
      titheForwardedThisMonth: titheResult?.total ?? 0,
      totalMembership: membershipResult?.total ?? 0,
      baptismsThisYear: baptismsResult?.total ?? 0,
      churchCount: churchCountResult?.total ?? 0,
    },
    churches: (churchesResult.results as Record<string, unknown>[]).map((r) => ({
      id: r.id as number,
      name: r.name as string,
      type: r.type as string,
      titheMtd: r.tithe_mtd as number,
      memberCount: r.member_count as number,
      baptismsYtd: r.baptisms_ytd as number,
    })),
  });
}

export async function handleGlobalDashboard(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["org:read"]!);
  if (forbidden) return forbidden;

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const yearStart = `${y}-01-01`;

  const titheResult = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.type = 'income' AND f.type = 'tithe'
       AND t.confirmed_by IS NOT NULL AND t.created_at >= ?`
  )
    .bind(periodStart)
    .first<{ total: number }>();

  const membershipResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM members WHERE status = 'active'`
  ).first<{ total: number }>();

  const baptismsResult = await env.DB.prepare(
    `SELECT COUNT(*) as total
     FROM members
     WHERE baptism_type = 'immersion' AND baptism_date >= ?`
  )
    .bind(yearStart)
    .first<{ total: number }>();

  const churchCountResult = await env.DB.prepare(`SELECT COUNT(*) as total FROM churches`).first<{
    total: number;
  }>();

  const conferenceCountResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM conferences`
  ).first<{ total: number }>();

  const monthlyTrendResult = await env.DB.prepare(
    `SELECT
       substr(t.created_at, 1, 7) as month,
       COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.type = 'income' AND f.type = 'tithe'
       AND t.confirmed_by IS NOT NULL
       AND t.created_at >= ?
     GROUP BY substr(t.created_at, 1, 7)
     ORDER BY month`
  )
    .bind(yearStart)
    .all();

  return json({
    summary: {
      titheForwardedThisMonth: titheResult?.total ?? 0,
      totalMembership: membershipResult?.total ?? 0,
      baptismsThisYear: baptismsResult?.total ?? 0,
      churchCount: churchCountResult?.total ?? 0,
      conferenceCount: conferenceCountResult?.total ?? 0,
    },
    monthlyTrend: (monthlyTrendResult.results as { month: string; total: number }[]).map((r) => ({
      month: r.month,
      tithe: r.total,
    })),
  });
}
