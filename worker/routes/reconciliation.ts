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

export async function handleGetConferenceTithe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  // Conference-level — any finance read access
  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  if (!year || !month) return json({ error: "year and month are required" }, 400);

  const user = await env.DB.prepare("SELECT conference_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ conference_id: number }>();
  if (!user?.conference_id) return json({ error: "No conference" }, 400);
  const confId = user.conference_id;

  const y = Number(year);
  const m = Number(month);
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const result = await env.DB.prepare(
    `SELECT
       c.id as churchId,
       c.name as churchName,
       COALESCE(SUM(t.amount), 0) as forwardedAmount,
       MAX(COALESCE(r.tithe_status, 'pending')) as status,
       MAX(COALESCE(r.received_tithe, 0)) as receivedAmount,
       MAX(r.tithe_note) as note
     FROM churches c
     JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
       AND t.confirmed_by IS NOT NULL
       AND t.created_at >= ? AND t.created_at < ?
     JOIN funds f ON t.fund_id = f.id AND f.type = 'tithe'
     LEFT JOIN reconciliations r ON r.church_id = c.id
       AND r.year = ? AND r.month = ?
     WHERE c.parent_id = ? AND c.parent_type = 'conference'
     GROUP BY c.id
     ORDER BY c.name`
  )
    .bind(periodStart, nextMonth, y, m, confId)
    .all();

  const tithe = (
    result.results as {
      churchId: number;
      churchName: string;
      forwardedAmount: number;
      status: string;
      receivedAmount: number;
      note: string | null;
    }[]
  ).map((r) => ({
    churchId: r.churchId,
    churchName: r.churchName,
    forwardedAmount: r.forwardedAmount,
    status: r.status,
    receivedAmount: r.receivedAmount,
    note: r.note,
  }));

  return json({ tithe });
}

export async function handleReceiveTithe(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    year: number;
    month: number;
    receivedAmount?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.year || !body.month) {
    return json({ error: "churchId, year, and month are required" }, 400);
  }

  const chId = Number(body.churchId);
  const y = Number(body.year);
  const m = Number(body.month);

  const forwardedRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND t.type = 'income'
       AND f.type = 'tithe' AND t.confirmed_by IS NOT NULL`
  )
    .bind(chId)
    .first<{ total: number }>();

  const forwarded = forwardedRow?.total ?? 0;
  const received = body.receivedAmount ?? forwarded;
  const discrepancy = forwarded - received;
  const status = discrepancy === 0 ? "received" : "discrepancy";

  await env.DB.prepare(
    `INSERT INTO reconciliations (church_id, year, month, forwarded_tithe, received_tithe, tithe_discrepancy, tithe_status, tithe_note, reconciled_by, reconciled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(church_id, year, month) DO UPDATE SET
       forwarded_tithe = excluded.forwarded_tithe,
       received_tithe = excluded.received_tithe,
       tithe_discrepancy = excluded.tithe_discrepancy,
       tithe_status = excluded.tithe_status,
       tithe_note = excluded.tithe_note,
       reconciled_by = excluded.reconciled_by,
       reconciled_at = datetime('now')`
  )
    .bind(
      chId,
      y,
      m,
      forwarded,
      received,
      discrepancy,
      status,
      body.note ?? null,
      Number(auth.userId)
    )
    .run();

  return json({
    reconciliation: {
      churchId: chId,
      year: y,
      month: m,
      forwardedTithe: forwarded,
      receivedTithe: received,
      titheDiscrepancy: discrepancy,
      titheStatus: status,
    },
  });
}

export async function handleChurchBalance(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);

  if (request.method === "GET") {
    const churchId = url.searchParams.get("church_id");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    if (!churchId || !year || !month) {
      return json({ error: "church_id, year, and month are required" }, 400);
    }
    const chId = Number(churchId);

    const rec = await env.DB.prepare(
      "SELECT * FROM reconciliations WHERE church_id = ? AND year = ? AND month = ?"
    )
      .bind(chId, Number(year), Number(month))
      .first();

    if (!rec) return json({ reconciliation: null });

    return json({ reconciliation: rec });
  }

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    year: number;
    month: number;
    bankBalance: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.year || !body.month || body.bankBalance === undefined) {
    return json({ error: "churchId, year, month, and bankBalance are required" }, 400);
  }

  const chId = Number(body.churchId);
  const y = Number(body.year);
  const m = Number(body.month);

  const systemBalanceRow = await env.DB.prepare(
    `SELECT COALESCE(SUM(CASE WHEN t.type = 'income' AND f.forwarding_rule = 'local' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as balance
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     WHERE t.church_id = ? AND (t.confirmed_by IS NOT NULL OR t.type = 'expense')`
  )
    .bind(chId)
    .first<{ balance: number }>();

  const systemBalance = systemBalanceRow?.balance ?? 0;
  const bankBalance = body.bankBalance;
  const bankDiscrepancy = systemBalance - bankBalance;

  const existing = await env.DB.prepare(
    "SELECT id FROM reconciliations WHERE church_id = ? AND year = ? AND month = ?"
  )
    .bind(chId, y, m)
    .first<{ id: number }>();

  if (existing) {
    await env.DB.prepare(
      `UPDATE reconciliations SET bank_balance = ?, system_balance = ?, bank_discrepancy = ?, bank_note = ? WHERE id = ?`
    )
      .bind(bankBalance, systemBalance, bankDiscrepancy, body.note ?? null, existing.id)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO reconciliations (church_id, year, month, bank_balance, system_balance, bank_discrepancy, bank_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(chId, y, m, bankBalance, systemBalance, bankDiscrepancy, body.note ?? null)
      .run();
  }

  return json({
    reconciliation: {
      churchId: chId,
      year: y,
      month: m,
      bankBalance,
      systemBalance,
      bankDiscrepancy,
    },
  });
}

export async function handleTitheReport(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  if (!year || !month) return json({ error: "year and month are required" }, 400);

  const user = await env.DB.prepare("SELECT conference_id FROM users WHERE id = ?")
    .bind(Number(auth.userId))
    .first<{ conference_id: number }>();
  if (!user?.conference_id) return json({ error: "No conference" }, 400);
  const confId = user.conference_id;

  const y = Number(year);
  const m = Number(month);
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const result = await env.DB.prepare(
    `SELECT
       c.id as churchId,
       c.name as churchName,
       COALESCE(SUM(t.amount), 0) as forwarded,
       MAX(COALESCE(r.received_tithe, 0)) as received,
       COALESCE(SUM(t.amount), 0) - MAX(COALESCE(r.received_tithe, 0)) as difference,
       MAX(COALESCE(r.tithe_status, 'pending')) as status
     FROM churches c
     JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
       AND t.confirmed_by IS NOT NULL
       AND t.created_at >= ? AND t.created_at < ?
     JOIN funds f ON t.fund_id = f.id AND f.type = 'tithe'
     LEFT JOIN reconciliations r ON r.church_id = c.id
       AND r.year = ? AND r.month = ?
     WHERE c.parent_id = ? AND c.parent_type = 'conference'
     GROUP BY c.id
     ORDER BY c.name`
  )
    .bind(periodStart, nextMonth, y, m, confId)
    .all();

  const report = (
    result.results as {
      churchId: number;
      churchName: string;
      forwarded: number;
      received: number;
      difference: number;
      status: string;
    }[]
  ).map((r) => ({
    churchId: r.churchId,
    churchName: r.churchName,
    forwarded: r.forwarded,
    received: r.received,
    difference: r.difference,
    status: r.status,
  }));

  return json({ report });
}
