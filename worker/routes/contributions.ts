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

export async function handleGetContributions(request: Request, env: Env): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const year = url.searchParams.get("year");
  const donorId = url.searchParams.get("donor_id");

  if (!churchId || !year) {
    return json({ error: "church_id and year are required" }, 400);
  }

  const params: (number | string)[] = [];
  params.push(Number(churchId));

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  params.push(startDate, endDate);

  let memberFilter = "";
  if (donorId) {
    memberFilter = "AND t.member_id = ?";
    params.push(Number(donorId));
  }

  const result = await env.DB.prepare(
    `SELECT
      t.member_id,
      m.full_name as donor_name,
      f.type as fund_type,
      f.name as fund_name,
      SUM(t.amount) as total,
      COUNT(*) as transaction_count
    FROM transactions t
    JOIN members m ON t.member_id = m.id
    JOIN funds f ON t.fund_id = f.id
    WHERE t.church_id = ?
      AND t.created_at >= ?
      AND t.created_at <= ?
      AND t.member_id IS NOT NULL
      ${memberFilter}
      AND t.confirmed_by IS NOT NULL
    GROUP BY t.member_id, f.type
    ORDER BY m.full_name, f.type`
  )
    .bind(...params)
    .all();

  const donors = new Map<
    number,
    {
      donorId: number;
      donorName: string;
      totals: Record<string, number>;
      grandTotal: number;
      transactionCount: number;
    }
  >();

  for (const row of result.results) {
    const data = row as unknown as Record<string, unknown>;
    const mId = Number(data.member_id);
    const fundType = String(data.fund_type);
    const total = Number(data.total);

    if (!donors.has(mId)) {
      donors.set(mId, {
        donorId: mId,
        donorName: String(data.donor_name),
        totals: {},
        grandTotal: 0,
        transactionCount: 0,
      });
    }

    const donor = donors.get(mId)!;
    donor.totals[fundType] = (donor.totals[fundType] || 0) + total;
    donor.grandTotal += total;
    donor.transactionCount += Number(data.transaction_count);
  }

  return json({
    year: Number(year),
    churchId: Number(churchId),
    contributions: Array.from(donors.values()),
  });
}

export async function handleGetContributionStatement(
  request: Request,
  env: Env,
  donorId: number
): Promise<Response> {
  const auth = await authenticate(request, env);
  if (auth instanceof Response) return auth;

  const forbidden = authorize(auth, PERMISSIONS["finance:read"]!);
  if (forbidden) return forbidden;

  const url = new URL(request.url);
  const churchId = url.searchParams.get("church_id");
  const year = url.searchParams.get("year");

  if (!churchId || !year) {
    return json({ error: "church_id and year are required" }, 400);
  }

  const params: (number | string)[] = [];
  params.push(Number(churchId));

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  params.push(startDate, endDate, donorId);

  const churchResult = await env.DB.prepare("SELECT name FROM churches WHERE id = ?")
    .bind(Number(churchId))
    .first<{ name: string }>();

  const txResult = await env.DB.prepare(
    `SELECT
      t.id,
      t.amount,
      t.type,
      t.created_at,
      t.description,
      t.envelope_number,
      f.name as fund_name,
      f.type as fund_type,
      m.full_name as donor_name
    FROM transactions t
    JOIN funds f ON t.fund_id = f.id
    JOIN members m ON t.member_id = m.id
    WHERE t.church_id = ?
      AND t.created_at >= ?
      AND t.created_at <= ?
      AND t.member_id = ?
      AND t.confirmed_by IS NOT NULL
    ORDER BY t.created_at ASC`
  )
    .bind(...params)
    .all();

  const transactions = txResult.results as unknown as Array<Record<string, unknown>>;

  const totals: Record<string, number> = {};
  let grandTotal = 0;

  for (const tx of transactions) {
    const fundType = String(tx.fund_type);
    const amount = Number(tx.amount);
    totals[fundType] = (totals[fundType] || 0) + amount;
    grandTotal += amount;
  }

  const donorName = transactions.length > 0 ? String(transactions[0]!.donor_name) : "";

  return json({
    donorId,
    donorName,
    year: Number(year),
    churchId: Number(churchId),
    churchName: churchResult?.name || "",
    transactions: transactions.map((t) => ({
      id: Number(t.id),
      date: String(t.created_at),
      fund: String(t.fund_type),
      fundName: String(t.fund_name),
      amount: Number(t.amount),
      type: String(t.type),
      description: t.description ? String(t.description) : null,
      envelopeNumber: t.envelope_number ? Number(t.envelope_number) : null,
    })),
    totals,
    grandTotal,
  });
}
