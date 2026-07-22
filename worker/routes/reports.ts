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

export async function handleGetQuarterlyReport(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const year = url.searchParams.get("year");
  const quarter = url.searchParams.get("quarter");

  if (!churchId || !year || !quarter) {
    return json({ error: "church_id, year, and quarter are required" }, 400);
  }

  const y = Number(year);
  const q = Number(quarter);
  if (q < 1 || q > 4) {
    return json({ error: "quarter must be 1-4" }, 400);
  }

  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const periodStart = `${y}-${String(startMonth).padStart(2, "0")}-01`;
  const periodEnd = q === 4 ? `${y + 1}-01-01` : `${y}-${String(endMonth + 1).padStart(2, "0")}-01`;

  const chId = Number(churchId);

  const baptismsRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM members
     WHERE church_id = ? AND baptism_type = 'immersion'
       AND baptism_date >= ? AND baptism_date < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const professionsRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM members
     WHERE church_id = ? AND baptism_type = 'profession_of_faith'
       AND baptism_date >= ? AND baptism_date < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const transfersInRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM transfer_requests
     WHERE to_church_id = ? AND status = 'completed'
       AND accepted_at >= ? AND accepted_at < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const transfersOutRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM transfer_requests
     WHERE from_church_id = ? AND status = 'completed'
       AND accepted_at >= ? AND accepted_at < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const deathsRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM members
     WHERE church_id = ? AND status = 'deceased'
       AND status_date >= ? AND status_date < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const removalsRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM members
     WHERE church_id = ? AND status = 'removed'
       AND status_date >= ? AND status_date < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ count: number }>();

  const activeNowRow = await env.DB.prepare(
    `SELECT COUNT(*) as count FROM members
     WHERE church_id = ? AND status = 'active'`
  )
    .bind(chId)
    .first<{ count: number }>();

  const baptisms = baptismsRow?.count ?? 0;
  const professions = professionsRow?.count ?? 0;
  const transfersIn = transfersInRow?.count ?? 0;
  const transfersOut = transfersOutRow?.count ?? 0;
  const deaths = deathsRow?.count ?? 0;
  const removals = removalsRow?.count ?? 0;
  const activeNow = activeNowRow?.count ?? 0;

  const additions = baptisms + professions + transfersIn;
  const subtractions = transfersOut + deaths + removals;
  const opening = activeNow - additions + subtractions;
  const closing = activeNow;

  const titheRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND t.type = 'income'
       AND f.type = 'tithe'
       AND t.created_at >= ? AND t.created_at < ?
       AND t.confirmed_by IS NOT NULL`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ total: number }>();

  const budgetIncomeRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND t.type = 'income'
       AND f.type = 'local_budget'
       AND t.created_at >= ? AND t.created_at < ?
       AND t.confirmed_by IS NOT NULL`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ total: number }>();

  const budgetExpensesRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND t.type = 'expense'
       AND f.type = 'local_budget'
       AND t.created_at >= ? AND t.created_at < ?`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ total: number }>();

  const ssRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND t.type = 'income'
       AND f.type = 'sabbath_school'
       AND t.created_at >= ? AND t.created_at < ?
       AND t.confirmed_by IS NOT NULL`
  )
    .bind(chId, periodStart, periodEnd)
    .first<{ total: number }>();

  const titheForwarded = titheRow?.total ?? 0;
  const localBudgetIncome = budgetIncomeRow?.total ?? 0;
  const localBudgetExpenses = budgetExpensesRow?.total ?? 0;
  const localBudgetBalance = localBudgetIncome - localBudgetExpenses;
  const sabbathSchoolForwarded = ssRow?.total ?? 0;

  const officersResult = await env.DB.prepare(
    `SELECT m.full_name, p.name as position_name
     FROM members m
     JOIN member_positions mp ON m.id = mp.member_id
     JOIN positions p ON mp.position_id = p.id
     WHERE m.church_id = ? AND (mp.end_date IS NULL OR mp.end_date > datetime('now'))
     ORDER BY p.name, m.full_name`
  )
    .bind(chId)
    .all();

  const officers = (officersResult.results as { full_name: string; position_name: string }[]).map(
    (r) => ({ memberName: r.full_name, positionName: r.position_name })
  );

  return json({
    report: {
      churchId: chId,
      period: { year: y, quarter: q },
      membership: {
        opening,
        baptisms,
        professions,
        transfersIn,
        transfersOut,
        deaths,
        removals,
        closing,
      },
      finance: {
        titheForwarded,
        localBudgetIncome,
        localBudgetExpenses,
        localBudgetBalance,
        sabbathSchoolForwarded,
      },
      officers,
    },
  });
}
