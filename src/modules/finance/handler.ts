import type { RouterContext } from "../../lib/router";
import { json } from "../../lib/router";

const VALID_FUNDS = [
  "tithe",
  "local-church-budget",
  "conference-advance",
  "world-budget",
  "special-projects",
  "building-fund",
  "ingathering",
  "investment-income",
  "rental-income",
] as const;

type Transaction = {
  id: string;
  orgId: string;
  fund: string;
  amount: number;
  type: string;
  description: string | null;
  donorId: string | null;
  verified: number;
  verifiedBy: string | null;
  createdBy: string;
  proxyFor: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listTransactions(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  if (!churchId)
    return json(
      { error: { code: "missing_params", message: "churchId is required" } },
      400,
    );

  const url = new URL(ctx.request.url);
  const fund = url.searchParams.get("fund");
  const type = url.searchParams.get("type");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM transactions WHERE orgId = ?";
  const params: unknown[] = [churchId];

  if (fund && VALID_FUNDS.includes(fund as (typeof VALID_FUNDS)[number])) {
    query += " AND fund = ?";
    params.push(fund);
  }
  if (type && (type === "receipt" || type === "disbursement")) {
    query += " AND type = ?";
    params.push(type);
  }

  const countResult = await ctx.db
    .prepare(query.replace("SELECT *", "SELECT COUNT(*) as total"))
    .bind(...params)
    .first<{ total: number }>();

  query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await ctx.db
    .prepare(query)
    .bind(...params)
    .all<Transaction>();

  return json({
    transactions: result.results,
    total: countResult?.total ?? 0,
    page,
    limit,
  });
}

export async function createTransaction(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  if (!churchId)
    return json(
      { error: { code: "missing_params", message: "churchId is required" } },
      400,
    );

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object")
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
    );

  const { fund, amount, type, description, donorId, proxyFor } = body;
  if (!fund || !VALID_FUNDS.includes(fund as (typeof VALID_FUNDS)[number])) {
    return json(
      {
        error: {
          code: "invalid_fund",
          message: `fund must be one of: ${VALID_FUNDS.join(", ")}`,
        },
      },
      400,
    );
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return json(
      {
        error: {
          code: "invalid_amount",
          message: "amount must be a positive number",
        },
      },
      400,
    );
  }
  if (!type || (type !== "receipt" && type !== "disbursement")) {
    return json(
      {
        error: {
          code: "invalid_type",
          message: "type must be receipt or disbursement",
        },
      },
      400,
    );
  }

  const id = crypto.randomUUID();
  await ctx.db
    .prepare(
      "INSERT INTO transactions (id, orgId, fund, amount, type, description, donorId, createdBy, proxyFor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      churchId,
      fund,
      amount,
      type,
      (description as string) ?? null,
      (donorId as string) ?? null,
      ctx.user!.sub,
      (proxyFor as string) ?? null,
    )
    .run();

  const tx = await ctx.db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .bind(id)
    .first<Transaction>();
  return json({ transaction: tx }, 201);
}

export async function getTransaction(ctx: RouterContext): Promise<Response> {
  const { churchId, id } = ctx.params;
  if (!churchId || !id)
    return json(
      {
        error: {
          code: "missing_params",
          message: "churchId and id are required",
        },
      },
      400,
    );

  const tx = await ctx.db
    .prepare("SELECT * FROM transactions WHERE id = ? AND orgId = ?")
    .bind(id, churchId)
    .first<Transaction>();

  if (!tx)
    return json(
      { error: { code: "not_found", message: "Transaction not found" } },
      404,
    );
  return json({ transaction: tx });
}

export async function verifyTransaction(ctx: RouterContext): Promise<Response> {
  const { churchId, id } = ctx.params;
  if (!churchId || !id)
    return json(
      {
        error: {
          code: "missing_params",
          message: "churchId and id are required",
        },
      },
      400,
    );

  const user = ctx.user;
  if (!user || (user.role !== "treasurer" && user.role !== "system-admin")) {
    return json(
      {
        error: {
          code: "forbidden",
          message: "Only treasurers can verify transactions",
        },
      },
      403,
    );
  }

  const tx = await ctx.db
    .prepare("SELECT * FROM transactions WHERE id = ? AND orgId = ?")
    .bind(id, churchId)
    .first<Transaction>();

  if (!tx)
    return json(
      { error: { code: "not_found", message: "Transaction not found" } },
      404,
    );

  await ctx.db
    .prepare(
      "UPDATE transactions SET verified = 1, verifiedBy = ?, updatedAt = datetime('now') WHERE id = ?",
    )
    .bind(user.sub, id)
    .run();

  const updated = await ctx.db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .bind(id)
    .first<Transaction>();
  return json({ transaction: updated });
}

export async function transactionStats(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  if (!churchId)
    return json(
      { error: { code: "missing_params", message: "churchId is required" } },
      400,
    );

  const url = new URL(ctx.request.url);
  const from = url.searchParams.get("from") ?? "1970-01-01";
  const to = url.searchParams.get("to") ?? "2099-12-31";

  const summary = await ctx.db
    .prepare(
      "SELECT fund, type, SUM(amount) as total FROM transactions WHERE orgId = ? AND createdAt >= ? AND createdAt <= ? AND verified = 1 GROUP BY fund, type",
    )
    .bind(churchId, from, to)
    .all<{ fund: string; type: string; total: number }>();

  const byFund: Record<string, { receipts: number; disbursements: number }> =
    {};
  for (const row of summary.results) {
    if (!byFund[row.fund]) byFund[row.fund] = { receipts: 0, disbursements: 0 };
    if (row.type === "receipt") byFund[row.fund]!.receipts = row.total;
    else byFund[row.fund]!.disbursements = row.total;
  }

  return json({ stats: byFund });
}
