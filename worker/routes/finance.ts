import { authenticate, authorize } from "../lib/middleware";
import { PERMISSIONS } from "../lib/roles";
import { logAudit, getDeviceInfo } from "../lib/audit";
import { createDb } from "../lib/db";
import {
  FundRepo,
  ExpenseCategoryRepo,
  BatchRepo,
  TransactionRepo,
  BudgetRepo,
  BudgetTemplateRepo,
} from "../repos/finance";
import type { FundRow, ExpenseCategoryRow } from "../repos/finance";
import { json } from "../lib/response";

function uuid(): string {
  return crypto.randomUUID();
}

const FUND_TYPES = ["tithe", "local_budget", "sabbath_school"];
const FORWARDING_RULES = ["local", "conference"];

function toFundResponse(f: FundRow) {
  return {
    id: f.id,
    name: f.name,
    type: f.type,
    forwarding_rule: f.forwardingRule,
    conference_id: f.conferenceId,
    created_at: f.createdAt,
  };
}

function toExpenseCategoryResponse(ec: ExpenseCategoryRow) {
  return {
    id: ec.id,
    name: ec.name,
    conference_id: ec.conferenceId,
    active: ec.active,
    created_at: ec.createdAt,
  };
}

// ── Funds ──

export async function handleGetFunds(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const conferenceId = url.searchParams.get("conference_id")
    ? Number(url.searchParams.get("conference_id"))
    : undefined;

  const fundRepo = new FundRepo(createDb(env));
  const funds = await fundRepo.findAll(conferenceId);

  return json({ funds: funds.map(toFundResponse) });
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
    const fundRepo = new FundRepo(createDb(env));
    const result = await fundRepo.create({
      name: body.name,
      type: body.type,
      forwardingRule: body.forwardingRule,
      conferenceId: body.conferenceId,
    });

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

    return json(
      {
        id: result.id,
        name: result.name,
        type: result.type,
        forwarding_rule: result.forwardingRule,
        conference_id: result.conferenceId,
      },
      201
    );
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
  const conferenceId = url.searchParams.get("conference_id")
    ? Number(url.searchParams.get("conference_id"))
    : undefined;
  const includeInactive = url.searchParams.get("include_inactive") === "1";

  const categoryRepo = new ExpenseCategoryRepo(createDb(env));
  const categories = await categoryRepo.findAll(conferenceId, includeInactive ? undefined : true);

  return json({ expenseCategories: categories.map(toExpenseCategoryResponse) });
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

  if (body.name === undefined && body.active === undefined) {
    return json({ error: "No fields to update" }, 400);
  }

  const categoryRepo = new ExpenseCategoryRepo(createDb(env));
  const existing = await categoryRepo.findById(categoryId);
  if (!existing) {
    return json({ error: "Expense category not found" }, 404);
  }

  const updated = await categoryRepo.update(categoryId, {
    name: body.name,
    active: body.active,
  });

  if (!updated) {
    return json({ error: "Expense category not found" }, 404);
  }

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
    const categoryRepo = new ExpenseCategoryRepo(createDb(env));
    const result = await categoryRepo.create({
      name: body.name,
      conferenceId: body.conferenceId,
    });

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

    return json(
      {
        id: result.id,
        name: result.name,
        conference_id: result.conferenceId,
      },
      201
    );
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

  const batchRepo = new BatchRepo(createDb(env));
  const txns = await batchRepo.getBatchTransactions(batchId);
  const transactions = txns.map((t) => ({
    id: t.id,
    church_id: t.churchId,
    fund_id: t.fundId,
    type: t.type,
    amount: t.amount,
    description: t.description,
    batch_id: t.batchId,
    category_id: t.categoryId,
    budget_ref: t.budgetRef,
    created_by: t.createdBy,
    uuid: t.uuid,
    envelope_number: t.envelopeNumber,
    member_id: t.memberId,
    proxy_for_member_id: t.proxyForMemberId,
    confirmed_by: t.confirmedBy,
    confirmed_at: t.confirmedAt,
    verified: t.verified,
    verified_by: t.verifiedBy,
    verified_at: t.verifiedAt,
    created_at: t.createdAt,
    fund_name: t.fundName,
  }));

  return json({ ...batch, transactions });
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

  const batchRepo = new BatchRepo(createDb(env));
  const result = await batchRepo.create({
    churchId: body.churchId,
    sabbathDate: body.sabbathDate,
    submittedBy: Number(auth.userId),
  });

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

  return json(
    {
      id: result.id,
      church_id: result.churchId,
      sabbath_date: result.sabbathDate,
      status: "pending",
    },
    201
  );
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

  const db = createDb(env);
  const batchRepo = new BatchRepo(db);
  const batch = await batchRepo.findById(batchId);

  if (!batch) {
    return json({ error: "Batch not found" }, 404);
  }
  if (batch.status === "confirmed" || batch.status === "synced") {
    return json({ error: "Batch is already fully confirmed" }, 400);
  }

  const userId = Number(auth.userId);

  if (batch.confirmedBy1 === null) {
    if (userId === batch.confirmedBy2) {
      return json({ error: "Dual-custody requires two different people" }, 400);
    }
    await batchRepo.confirmFirst(batchId, userId);

    await logAudit(env, {
      actor_id: userId,
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

  if (batch.confirmedBy2 === null) {
    if (userId === batch.confirmedBy1) {
      return json({ error: "Dual-custody requires two different people" }, 400);
    }
    await batchRepo.confirmSecond(batchId, userId);

    const txnRepo = new TransactionRepo(db);
    await txnRepo.confirmTransactions(batchId, userId, new Date().toISOString());

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

    let forwardCount = 0;
    for (const ft of forwardingTxns.results) {
      await txnRepo.createForward({
        churchId: ft.church_id,
        fundId: ft.fund_id,
        amount: ft.amount,
        createdBy: userId,
        uuid: uuid(),
      });
      forwardCount++;
    }

    await logAudit(env, {
      actor_id: userId,
      action: "confirm_2",
      entity_type: "offering_batch",
      entity_id: batchId,
      prev_state: JSON.stringify({ status: batch.status }),
      new_state: JSON.stringify({
        confirmedBy: 2,
        status: "confirmed",
        forwardingCreated: forwardCount,
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
    const budgetRepo = new BudgetRepo(createDb(env));
    const result = await budgetRepo.create({
      churchId: body.churchId,
      fundId: body.fundId,
      categoryId: body.categoryId,
      plannedAmount: body.plannedAmount,
      fiscalYear: body.fiscalYear,
    });

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

    return json(
      {
        id: result.id,
        church_id: result.churchId,
        fund_id: result.fundId,
        category_id: result.categoryId,
        planned_amount: result.plannedAmount,
        fiscal_year: result.fiscalYear,
      },
      201
    );
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Budget already exists for this combination" }, 409);
    }
    return json({ error: `Failed to create budget: ${msg}` }, 500);
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

  const budgetRepo = new BudgetRepo(createDb(env));
  const existing = await budgetRepo.findById(budgetId);
  if (!existing) {
    return json({ error: "Budget not found" }, 404);
  }
  if (existing.approved) {
    return json({ error: "Budget is already approved" }, 400);
  }

  await budgetRepo.approve(budgetId, Number(auth.userId));

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
    const templateRepo = new BudgetTemplateRepo(createDb(env));
    const result = await templateRepo.create({
      conferenceId: body.conferenceId,
      categoryId: body.categoryId,
      fundId: body.fundId,
      plannedAmount: body.plannedAmount,
      fiscalYear: body.fiscalYear,
    });

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

    return json(
      {
        id: result.id,
        conference_id: result.conferenceId,
        category_id: result.categoryId,
        fund_id: result.fundId,
        planned_amount: result.plannedAmount,
        fiscal_year: result.fiscalYear,
      },
      201
    );
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("UNIQUE")) {
      return json({ error: "Template already exists for this combination" }, 409);
    }
    return json({ error: "Failed to create budget template" }, 500);
  }
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
