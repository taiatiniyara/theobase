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

function uuid(): string {
  return crypto.randomUUID();
}

const FUND_TYPES = ["tithe", "local_budget", "sabbath_school"];
const FORWARDING_RULES = ["local", "conference"];

// ── Funds ──

export async function handleGetFunds(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const conferenceId = url.searchParams.get("conference_id");

  let query = "SELECT id, name, type, forwarding_rule, conference_id, created_at FROM funds";
  const params: number[] = [];

  if (conferenceId) {
    query += " WHERE conference_id = ?";
    params.push(Number(conferenceId));
  }
  query += " ORDER BY type, name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ funds: result.results });
}

export async function handleCreateFund(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    name: string;
    type: string;
    forwardingRule: string;
    conferenceId: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name || !body.type || !body.forwardingRule || !body.conferenceId) {
    return json({ error: "name, type, forwardingRule, and conferenceId are required" }, 400);
  }

  if (!FUND_TYPES.includes(body.type)) {
    return json({ error: `type must be one of: ${FUND_TYPES.join(", ")}` }, 400);
  }
  if (!FORWARDING_RULES.includes(body.forwardingRule)) {
    return json({ error: `forwardingRule must be one of: ${FORWARDING_RULES.join(", ")}` }, 400);
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO funds (name, type, forwarding_rule, conference_id) VALUES (?, ?, ?, ?) RETURNING id`
    )
      .bind(body.name, body.type, body.forwardingRule, body.conferenceId)
      .first<{ id: number }>();

    if (!result) {
      return json({ error: "Failed to create fund" }, 500);
    }

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "create",
      entity_type: "fund",
      entity_id: result.id,
      prev_state: null,
      new_state: JSON.stringify({ ...body, id: result.id }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ id: result.id, ...body }, 201);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Fund already exists" }, 409);
    }
    return json({ error: "Failed to create fund" }, 500);
  }
}

// ── Expense Categories ──

export async function handleGetExpenseCategories(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const conferenceId = url.searchParams.get("conference_id");
  const includeInactive = url.searchParams.get("include_inactive") === "1";

  let query = "SELECT id, name, conference_id, active, created_at FROM expense_categories";
  const params: (number | string)[] = [];
  const conditions: string[] = [];

  if (conferenceId) {
    conditions.push("conference_id = ?");
    params.push(Number(conferenceId));
  }
  if (!includeInactive) {
    conditions.push("active = 1");
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ expenseCategories: result.results });
}

export async function handleUpdateExpenseCategory(
  request: Request,
  env: Env,
  categoryId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: { name?: string; active?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const existing = await env.DB.prepare("SELECT * FROM expense_categories WHERE id = ?")
    .bind(categoryId)
    .first();
  if (!existing) {
    return json({ error: "Expense category not found" }, 404);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }
  if (body.active !== undefined) {
    updates.push("active = ?");
    params.push(body.active ? 1 : 0);
  }

  if (updates.length === 0) {
    return json({ error: "No fields to update" }, 400);
  }

  params.push(categoryId);
  await env.DB.prepare(`UPDATE expense_categories SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "update",
    entity_type: "expense_category",
    entity_id: categoryId,
    prev_state: JSON.stringify(existing),
    new_state: JSON.stringify(body),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true });
}

export async function handleCreateExpenseCategory(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: { name: string; conferenceId: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.name || !body.conferenceId) {
    return json({ error: "name and conferenceId are required" }, 400);
  }

  try {
    const result = await env.DB.prepare(
      `INSERT INTO expense_categories (name, conference_id) VALUES (?, ?) RETURNING id`
    )
      .bind(body.name, body.conferenceId)
      .first<{ id: number }>();

    if (!result) {
      return json({ error: "Failed to create expense category" }, 500);
    }

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "create",
      entity_type: "expense_category",
      entity_id: result.id,
      prev_state: null,
      new_state: JSON.stringify({ ...body, id: result.id }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ id: result.id, ...body }, 201);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Expense category already exists" }, 409);
    }
    return json({ error: "Failed to create expense category" }, 500);
  }
}

// ── Offering Batches ──

export async function handleGetBatches(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const status = url.searchParams.get("status");
  const sabbathDate = url.searchParams.get("sabbath_date");

  let query = `SELECT b.id, b.church_id, b.sabbath_date, b.status,
    b.confirmed_by_1, b.confirmed_at_1, b.confirmed_by_2, b.confirmed_at_2,
    b.submitted_by, b.submitted_at, b.created_at,
    c.name as church_name,
    u1.email as confirmed_by_1_email,
    u2.email as confirmed_by_2_email,
    us.email as submitted_by_email,
    (SELECT COUNT(*) FROM transactions WHERE batch_id = b.id) as transaction_count,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE batch_id = b.id AND type = 'income') as total_amount
    FROM offering_batches b
    JOIN churches c ON b.church_id = c.id
    LEFT JOIN users u1 ON b.confirmed_by_1 = u1.id
    LEFT JOIN users u2 ON b.confirmed_by_2 = u2.id
    LEFT JOIN users us ON b.submitted_by = us.id
    WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND b.church_id = ?";
    params.push(Number(churchId));
  }
  if (status) {
    query += " AND b.status = ?";
    params.push(status);
  }
  if (sabbathDate) {
    query += " AND b.sabbath_date = ?";
    params.push(sabbathDate);
  }
  query += " ORDER BY b.sabbath_date DESC, b.created_at DESC";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ batches: result.results });
}

export async function handleGetBatch(
  request: Request,
  env: Env,
  batchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const batch = await env.DB.prepare(
    `SELECT b.*, c.name as church_name,
     u1.email as confirmed_by_1_email, u2.email as confirmed_by_2_email,
     us.email as submitted_by_email
     FROM offering_batches b
     JOIN churches c ON b.church_id = c.id
     LEFT JOIN users u1 ON b.confirmed_by_1 = u1.id
     LEFT JOIN users u2 ON b.confirmed_by_2 = u2.id
     LEFT JOIN users us ON b.submitted_by = us.id
     WHERE b.id = ?`
  )
    .bind(batchId)
    .first();

  if (!batch) {
    return json({ error: "Batch not found" }, 404);
  }

  const transactions = await env.DB.prepare(
    `SELECT t.*, f.name as fund_name, f.type as fund_type,
     u.email as created_by_email, uc.email as confirmed_by_email
     FROM transactions t
     JOIN funds f ON t.fund_id = f.id
     JOIN users u ON t.created_by = u.id
     LEFT JOIN users uc ON t.confirmed_by = uc.id
     WHERE t.batch_id = ?
     ORDER BY t.created_at`
  )
    .bind(batchId)
    .all();

  return json({ ...batch, transactions: transactions.results });
}

export async function handleCreateBatch(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: { churchId: number; sabbathDate: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.sabbathDate) {
    return json({ error: "churchId and sabbathDate are required" }, 400);
  }

  const church = await env.DB.prepare("SELECT id FROM churches WHERE id = ?")
    .bind(body.churchId)
    .first();
  if (!church) {
    return json({ error: "Church not found" }, 404);
  }

  const result = await env.DB.prepare(
    `INSERT INTO offering_batches (church_id, sabbath_date, submitted_by, submitted_at)
     VALUES (?, ?, ?, datetime('now')) RETURNING id`
  )
    .bind(body.churchId, body.sabbathDate, Number(auth.userId))
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create batch" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "offering_batch",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id, status: "pending" }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body, status: "pending" }, 201);
}

export async function handleConfirmBatch(
  request: Request,
  env: Env,
  batchId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const batch = await env.DB.prepare(
    `SELECT id, status, confirmed_by_1, confirmed_by_2 FROM offering_batches WHERE id = ?`
  )
    .bind(batchId)
    .first<{
      id: number;
      status: string;
      confirmed_by_1: number | null;
      confirmed_by_2: number | null;
    }>();

  if (!batch) {
    return json({ error: "Batch not found" }, 404);
  }
  if (batch.status === "confirmed" || batch.status === "synced") {
    return json({ error: "Batch is already fully confirmed" }, 400);
  }

  const userId = Number(auth.userId);

  if (batch.confirmed_by_1 === null) {
    if (userId === batch.confirmed_by_2) {
      return json({ error: "Dual-custody requires two different people" }, 400);
    }
    await env.DB.prepare(
      `UPDATE offering_batches SET confirmed_by_1 = ?, confirmed_at_1 = datetime('now') WHERE id = ?`
    )
      .bind(userId, batchId)
      .run();

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "confirm_1",
      entity_type: "offering_batch",
      entity_id: batchId,
      prev_state: JSON.stringify({ status: batch.status }),
      new_state: JSON.stringify({ confirmedBy: 1 }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ confirmedBy: 1, batchId });
  }

  if (batch.confirmed_by_2 === null) {
    if (userId === batch.confirmed_by_1) {
      return json({ error: "Dual-custody requires two different people" }, 400);
    }
    await env.DB.prepare(
      `UPDATE offering_batches SET confirmed_by_2 = ?, confirmed_at_2 = datetime('now'), status = 'confirmed' WHERE id = ?`
    )
      .bind(userId, batchId)
      .run();

    await env.DB.prepare(
      `UPDATE transactions SET confirmed_by = ?, confirmed_at = datetime('now')
       WHERE batch_id = ? AND type = 'income' AND confirmed_by IS NULL`
    )
      .bind(userId, batchId)
      .run();

    // Auto-create forward transactions for tithe and sabbath_school funds
    const forwardingTxns = await env.DB.prepare(
      `SELECT t.id, t.fund_id, t.amount, t.church_id, f.forwarding_rule, f.type
       FROM transactions t
       JOIN funds f ON t.fund_id = f.id
       WHERE t.batch_id = ? AND t.type = 'income' AND f.forwarding_rule = 'conference'`
    )
      .bind(batchId)
      .all<{
        id: number;
        fund_id: number;
        amount: number;
        church_id: number;
        forwarding_rule: string;
        type: string;
      }>();

    for (const ft of forwardingTxns.results) {
      await env.DB.prepare(
        `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, uuid)
         VALUES (?, ?, 'forward', ?, 'Auto-forwarded on dual-custody confirmation', ?, ?)`
      )
        .bind(ft.church_id, ft.fund_id, ft.amount, userId, uuid())
        .run();
    }

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "confirm_2",
      entity_type: "offering_batch",
      entity_id: batchId,
      prev_state: JSON.stringify({ status: batch.status }),
      new_state: JSON.stringify({
        confirmedBy: 2,
        status: "confirmed",
        forwardingCreated: forwardingTxns.results.length,
      }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ confirmedBy: 2, status: "confirmed", batchId });
  }

  return json({ error: "Batch is already fully confirmed" }, 400);
}

// ── Transactions ──

export async function handleGetTransactions(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const fundId = url.searchParams.get("fund_id");
  const type = url.searchParams.get("type");
  const batchId = url.searchParams.get("batch_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = `SELECT t.*, f.name as fund_name, f.type as fund_type,
    c.name as church_name,
    u.email as created_by_email,
    uc.email as confirmed_by_email,
    ec.name as category_name,
    m.full_name as member_name
    FROM transactions t
    JOIN funds f ON t.fund_id = f.id
    JOIN churches c ON t.church_id = c.id
    JOIN users u ON t.created_by = u.id
    LEFT JOIN users uc ON t.confirmed_by = uc.id
    LEFT JOIN expense_categories ec ON t.category_id = ec.id
    LEFT JOIN members m ON t.member_id = m.id
    WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND t.church_id = ?";
    params.push(Number(churchId));
  }
  if (fundId) {
    query += " AND t.fund_id = ?";
    params.push(Number(fundId));
  }
  if (type) {
    query += " AND t.type = ?";
    params.push(type);
  }
  if (batchId) {
    query += " AND t.batch_id = ?";
    params.push(Number(batchId));
  }
  if (from) {
    query += " AND t.created_at >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND t.created_at <= ?";
    params.push(to);
  }
  query += " ORDER BY t.created_at DESC LIMIT 200";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ transactions: result.results });
}

export async function handleCreateTransaction(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    batchId: number;
    envelopeNumber?: number;
    memberId?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.fundId || body.amount === undefined || !body.batchId) {
    return json({ error: "churchId, fundId, amount, and batchId are required" }, 400);
  }
  if (body.amount <= 0) {
    return json({ error: "amount must be positive" }, 400);
  }

  const batch = await env.DB.prepare(
    "SELECT id, church_id, status FROM offering_batches WHERE id = ?"
  )
    .bind(body.batchId)
    .first<{ id: number; church_id: number; status: string }>();
  if (!batch) {
    return json({ error: "Batch not found" }, 404);
  }
  if (batch.status !== "pending") {
    return json({ error: "Cannot add to a confirmed batch" }, 400);
  }
  if (batch.church_id !== body.churchId) {
    return json({ error: "Church mismatch between transaction and batch" }, 400);
  }

  if (body.envelopeNumber !== undefined) {
    const dupEnv = await env.DB.prepare(
      "SELECT id FROM transactions WHERE batch_id = ? AND envelope_number = ?"
    )
      .bind(body.batchId, body.envelopeNumber)
      .first();
    if (dupEnv) {
      return json({ error: `Envelope #${body.envelopeNumber} already used in this batch` }, 409);
    }
  }

  if (body.memberId !== undefined) {
    const member = await env.DB.prepare("SELECT id, church_id FROM members WHERE id = ?")
      .bind(body.memberId)
      .first<{ id: number; church_id: number }>();
    if (!member) {
      return json({ error: "Member not found" }, 404);
    }
  }

  const fund = await env.DB.prepare("SELECT id FROM funds WHERE id = ?").bind(body.fundId).first();
  if (!fund) {
    return json({ error: "Fund not found" }, 404);
  }

  const txnUuid = uuid();
  const result = await env.DB.prepare(
    `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, uuid, envelope_number, member_id)
     VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(
      body.churchId,
      body.fundId,
      body.amount,
      body.description ?? null,
      body.batchId,
      Number(auth.userId),
      txnUuid,
      body.envelopeNumber ?? null,
      body.memberId ?? null
    )
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create transaction" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "transaction",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id, type: "income", uuid: txnUuid }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body, type: "income", uuid: txnUuid }, 201);
}

export async function handleCreateExpense(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    fundId: number;
    amount: number;
    description?: string;
    categoryId?: number;
    budgetRef?: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body.churchId || !body.fundId || body.amount === undefined) {
    return json({ error: "churchId, fundId, and amount are required" }, 400);
  }
  if (body.amount <= 0) {
    return json({ error: "amount must be positive" }, 400);
  }

  const fund = await env.DB.prepare("SELECT id FROM funds WHERE id = ?").bind(body.fundId).first();
  if (!fund) {
    return json({ error: "Fund not found" }, 404);
  }

  const txnUuid = uuid();
  const result = await env.DB.prepare(
    `INSERT INTO transactions (church_id, fund_id, type, amount, description, category_id, budget_ref, created_by, uuid)
     VALUES (?, ?, 'expense', ?, ?, ?, ?, ?, ?) RETURNING id`
  )
    .bind(
      body.churchId,
      body.fundId,
      body.amount,
      body.description ?? null,
      body.categoryId ?? null,
      body.budgetRef ?? null,
      Number(auth.userId),
      txnUuid
    )
    .first<{ id: number }>();

  if (!result) {
    return json({ error: "Failed to create expense" }, 500);
  }

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "create",
    entity_type: "transaction",
    entity_id: result.id,
    prev_state: null,
    new_state: JSON.stringify({ ...body, id: result.id, type: "expense", uuid: txnUuid }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ id: result.id, ...body, type: "expense", uuid: txnUuid }, 201);
}

// ── Budgets ──

export async function handleGetBudgets(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const fiscalYear = url.searchParams.get("fiscal_year");

  let query = `SELECT b.*, f.name as fund_name, f.type as fund_type,
    c.name as church_name, ec.name as category_name,
    COALESCE((SELECT SUM(t.amount) FROM transactions t
      WHERE t.church_id = b.church_id AND t.category_id = b.category_id
      AND t.type = 'expense'), 0) as spent_amount
    FROM budgets b
    JOIN funds f ON b.fund_id = f.id
    JOIN churches c ON b.church_id = c.id
    JOIN expense_categories ec ON b.category_id = ec.id
    WHERE 1=1`;
  const params: (string | number)[] = [];

  if (churchId) {
    query += " AND b.church_id = ?";
    params.push(Number(churchId));
  }
  if (fiscalYear) {
    query += " AND b.fiscal_year = ?";
    params.push(Number(fiscalYear));
  }
  query += " ORDER BY b.fiscal_year DESC, f.name, ec.name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ budgets: result.results });
}

export async function handleCreateBudget(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    churchId: number;
    fundId: number;
    categoryId: number;
    plannedAmount: number;
    fiscalYear: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (
    !body.churchId ||
    !body.fundId ||
    !body.categoryId ||
    body.plannedAmount === undefined ||
    !body.fiscalYear
  ) {
    return json(
      { error: "churchId, fundId, categoryId, plannedAmount, and fiscalYear are required" },
      400
    );
  }

  try {
    const ins = await env.DB.prepare(
      `INSERT INTO budgets (church_id, fund_id, category_id, planned_amount, fiscal_year)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(body.churchId, body.fundId, body.categoryId, body.plannedAmount, body.fiscalYear)
      .run();

    if (!ins.success) {
      return json({ error: `Failed to create budget: insert returned success=false` }, 500);
    }

    const result = await env.DB.prepare("SELECT last_insert_rowid() as id").first<{ id: number }>();
    if (!result) {
      return json({ error: `Failed to create budget: last_insert_rowid returned null` }, 500);
    }

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "create",
      entity_type: "budget",
      entity_id: result.id,
      prev_state: null,
      new_state: JSON.stringify({ ...body, id: result.id }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ id: result.id, ...body }, 201);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Budget already exists for this combination" }, 409);
    }
    return json({ error: `Failed to create budget: ${msg}` }, 500);
  }
}

// ── Budget Templates ──

export async function handleGetBudgetTemplates(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const conferenceId = url.searchParams.get("conference_id");
  const fiscalYear = url.searchParams.get("fiscal_year");

  if (!conferenceId) {
    return json({ error: "conference_id is required" }, 400);
  }

  let query = `SELECT bt.*, ec.name as category_name, f.name as fund_name
    FROM budget_templates bt
    JOIN expense_categories ec ON bt.category_id = ec.id
    JOIN funds f ON bt.fund_id = f.id
    WHERE bt.conference_id = ?`;
  const params: (string | number)[] = [Number(conferenceId)];

  if (fiscalYear) {
    query += " AND bt.fiscal_year = ?";
    params.push(Number(fiscalYear));
  }
  query += " ORDER BY f.name, ec.name";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all();

  return json({ budgetTemplates: result.results });
}

export async function handleCreateBudgetTemplate(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  let body: {
    conferenceId: number;
    categoryId: number;
    fundId: number;
    plannedAmount: number;
    fiscalYear: number;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (
    !body.conferenceId ||
    !body.categoryId ||
    !body.fundId ||
    body.plannedAmount === undefined ||
    !body.fiscalYear
  ) {
    return json(
      { error: "conferenceId, categoryId, fundId, plannedAmount, and fiscalYear are required" },
      400
    );
  }

  try {
    await env.DB.prepare(
      `INSERT INTO budget_templates (conference_id, category_id, fund_id, planned_amount, fiscal_year)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(body.conferenceId, body.categoryId, body.fundId, body.plannedAmount, body.fiscalYear)
      .run();

    const result = await env.DB.prepare("SELECT last_insert_rowid() as id").first<{ id: number }>();
    if (!result) {
      return json({ error: "Failed to create budget template" }, 500);
    }

    await logAudit(env, {
      actor_id: Number(auth.userId),
      action: "create",
      entity_type: "budget_template",
      entity_id: result.id,
      prev_state: null,
      new_state: JSON.stringify({ ...body, id: result.id }),
      module: "finance",
      device_info: getDeviceInfo(request),
    });

    return json({ id: result.id, ...body }, 201);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Template already exists for this combination" }, 409);
    }
    return json({ error: "Failed to create budget template" }, 500);
  }
}

export async function handleApproveBudget(
  request: Request,
  env: Env,
  budgetId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:write"]!);
  if (forbidden) return forbidden;

  const existing = await env.DB.prepare("SELECT id, approved FROM budgets WHERE id = ?")
    .bind(budgetId)
    .first<{ id: number; approved: number }>();
  if (!existing) {
    return json({ error: "Budget not found" }, 404);
  }
  if (existing.approved) {
    return json({ error: "Budget is already approved" }, 400);
  }

  await env.DB.prepare(
    `UPDATE budgets SET approved = 1, approved_by = ?, approved_at = datetime('now') WHERE id = ?`
  )
    .bind(Number(auth.userId), budgetId)
    .run();

  await logAudit(env, {
    actor_id: Number(auth.userId),
    action: "approve_budget",
    entity_type: "budget",
    entity_id: budgetId,
    prev_state: JSON.stringify({ approved: 0 }),
    new_state: JSON.stringify({ approved: 1 }),
    module: "finance",
    device_info: getDeviceInfo(request),
  });

  return json({ success: true });
}

// ── Monthly Treasurer Report ──

export async function handleGetMonthlyReport(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");

  if (!churchId || !year || !month) {
    return json({ error: "church_id, year, and month are required" }, 400);
  }

  const y = Number(year);
  const m = Number(month);
  const periodStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const openingBalance = await env.DB.prepare(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
     FROM transactions
     WHERE church_id = ? AND created_at < ? AND (confirmed_by IS NOT NULL OR type = 'expense')`
  )
    .bind(Number(churchId), periodStart)
    .first<{ balance: number }>();

  const incomeByFund = await env.DB.prepare(
    `SELECT f.id, f.name as fund_name, f.type as fund_type, COALESCE(SUM(t.amount), 0) as total
     FROM funds f
     LEFT JOIN transactions t ON t.fund_id = f.id AND t.church_id = ? AND t.type = 'income'
       AND t.created_at >= ? AND t.created_at < ?
       AND t.confirmed_by IS NOT NULL
     WHERE f.conference_id = (SELECT parent_id FROM churches WHERE id = ? AND parent_type = 'conference')
     GROUP BY f.id
     ORDER BY f.type, f.name`
  )
    .bind(Number(churchId), periodStart, nextMonth, Number(churchId))
    .all();

  const expensesByCategory = await env.DB.prepare(
    `SELECT ec.id, ec.name as category_name, COALESCE(SUM(t.amount), 0) as total,
      COALESCE(b.planned_amount, 0) as budgeted,
      COALESCE(b.planned_amount, 0) - COALESCE(SUM(t.amount), 0) as remaining
     FROM expense_categories ec
     LEFT JOIN transactions t ON t.category_id = ec.id AND t.church_id = ?
       AND t.type = 'expense' AND t.created_at >= ? AND t.created_at < ?
     LEFT JOIN budgets b ON b.church_id = ? AND b.category_id = ec.id AND b.fiscal_year = ?
     WHERE ec.conference_id = (SELECT parent_id FROM churches WHERE id = ? AND parent_type = 'conference')
     GROUP BY ec.id
     ORDER BY ec.name`
  )
    .bind(Number(churchId), periodStart, nextMonth, Number(churchId), y, Number(churchId))
    .all();

  const forwarded = await env.DB.prepare(
    `SELECT f.id, f.name as fund_name, f.type as fund_type,
       COALESCE(SUM(t.amount), 0) as forwarded_total
     FROM funds f
     LEFT JOIN transactions t ON t.fund_id = f.id AND t.church_id = ? AND t.type = 'forward'
       AND t.created_at >= ? AND t.created_at < ?
     WHERE f.conference_id = (SELECT parent_id FROM churches WHERE id = ? AND parent_type = 'conference')
       AND f.forwarding_rule = 'conference'
     GROUP BY f.id
     ORDER BY f.type, f.name`
  )
    .bind(Number(churchId), periodStart, nextMonth, Number(churchId))
    .all();

  const closingBalance = await env.DB.prepare(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
     FROM transactions
     WHERE church_id = ? AND created_at < ? AND (confirmed_by IS NOT NULL OR type = 'expense')`
  )
    .bind(Number(churchId), nextMonth)
    .first<{ balance: number }>();

  const incomeRows = incomeByFund.results as {
    id: number;
    fund_name: string;
    fund_type: string;
    total: number;
  }[];
  const expenseRows = expensesByCategory.results as {
    id: number;
    category_name: string;
    total: number;
    budgeted: number;
    remaining: number;
  }[];
  const forwardingRows = forwarded.results as {
    id: number;
    fund_name: string;
    fund_type: string;
    forwarded_total: number;
  }[];

  const forwardingMap = new Map<number, number>();
  for (const fr of forwardingRows) {
    forwardingMap.set(fr.id, fr.forwarded_total);
  }

  return json({
    report: {
      churchId: Number(churchId),
      period: { year: y, month: m },
      openingBalance: openingBalance?.balance ?? 0,
      incomeByFund: incomeRows.map((r) => ({
        ...r,
        forwarded: forwardingMap.get(r.id) ?? 0,
        isPassThrough: r.fund_type === "tithe" || r.fund_type === "sabbath_school",
      })),
      expensesByCategory: expenseRows,
      totalIncome: incomeRows.reduce((sum, r) => sum + r.total, 0),
      totalExpenses: expenseRows.reduce((sum, r) => sum + r.total, 0),
      closingBalance: closingBalance?.balance ?? 0,
    },
  });
}
