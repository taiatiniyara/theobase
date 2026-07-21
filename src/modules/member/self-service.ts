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

async function getMemberId(ctx: RouterContext): Promise<string | null> {
  const row = await ctx.db
    .prepare("SELECT memberId FROM users WHERE id = ?")
    .bind(ctx.user!.sub)
    .first<{ memberId: string | null }>();
  return row?.memberId ?? null;
}

export async function getMe(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  const user = ctx.user;
  if (!user) return json({ error: { code: "unauthorized" } }, 401);

  const memberId = await getMemberId(ctx);
  if (!memberId)
    return json(
      {
        error: {
          code: "not_found",
          message: "No member profile linked to this user",
        },
      },
      404,
    );

  const member = await ctx.db
    .prepare("SELECT * FROM members WHERE id = ? AND orgId = ?")
    .bind(memberId, churchId)
    .first();

  if (!member)
    return json(
      { error: { code: "not_found", message: "Member not found" } },
      404,
    );
  return json({ member });
}

export async function updateMe(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  const user = ctx.user;
  if (!user) return json({ error: { code: "unauthorized" } }, 401);

  const memberId = await getMemberId(ctx);
  if (!memberId)
    return json(
      { error: { code: "not_found", message: "No member profile linked" } },
      404,
    );

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return json({ error: { code: "invalid_body" } }, 400);

  const fields: string[] = ["email", "phone", "address"];
  for (const f of fields) {
    if (body[f] !== undefined) {
      await ctx.db
        .prepare(
          `UPDATE members SET ${f} = ?, updatedAt = datetime('now') WHERE id = ? AND orgId = ?`,
        )
        .bind(body[f], memberId, churchId)
        .run();
    }
  }

  const member = await ctx.db
    .prepare("SELECT * FROM members WHERE id = ?")
    .bind(memberId)
    .first();
  return json({ member });
}

export async function submitGiving(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  const user = ctx.user;
  if (!user) return json({ error: { code: "unauthorized" } }, 401);

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body) return json({ error: { code: "invalid_body" } }, 400);

  const { fund, amount, proxyFor } = body;
  if (
    !fund ||
    typeof fund !== "string" ||
    !VALID_FUNDS.includes(fund as (typeof VALID_FUNDS)[number])
  ) {
    return json(
      { error: { code: "invalid_fund", message: "Invalid fund type" } },
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

  let donorId: string;
  if (proxyFor && typeof proxyFor === "string") {
    const proxyMember = await ctx.db
      .prepare("SELECT id FROM members WHERE id = ? AND orgId = ?")
      .bind(proxyFor, churchId)
      .first();
    if (!proxyMember)
      return json(
        {
          error: {
            code: "not_found",
            message: "Proxy member not found in this church",
          },
        },
        404,
      );
    donorId = proxyFor;
  } else {
    const memberId = await getMemberId(ctx);
    if (!memberId)
      return json(
        { error: { code: "not_found", message: "No member profile linked" } },
        404,
      );
    donorId = memberId;
  }

  const id = crypto.randomUUID();
  await ctx.db
    .prepare(
      "INSERT INTO transactions (id, orgId, fund, amount, type, donorId, createdBy, proxyFor, verified) VALUES (?, ?, ?, ?, 'receipt', ?, ?, ?, 0)",
    )
    .bind(id, churchId, fund, amount, donorId, user.sub, proxyFor ?? null)
    .run();

  const tx = await ctx.db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .bind(id)
    .first();
  return json({ transaction: tx }, 201);
}

export async function requestTransfer(ctx: RouterContext): Promise<Response> {
  const { churchId, id } = ctx.params;
  const user = ctx.user;
  if (!user) return json({ error: { code: "unauthorized" } }, 401);

  if (!id) return json({ error: { code: "missing_params" } }, 400);

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const targetChurchId = body?.targetChurchId;
  if (!targetChurchId || typeof targetChurchId !== "string") {
    return json(
      {
        error: {
          code: "missing_fields",
          message: "targetChurchId is required",
        },
      },
      400,
    );
  }

  const target = await ctx.db
    .prepare(
      "SELECT id FROM orgs WHERE id = ? AND level IN ('church','company')",
    )
    .bind(targetChurchId)
    .first();
  if (!target)
    return json(
      { error: { code: "not_found", message: "Target church not found" } },
      404,
    );

  const member = await ctx.db
    .prepare("SELECT id, status FROM members WHERE id = ? AND orgId = ?")
    .bind(id, churchId)
    .first<{ id: string; status: string }>();
  if (!member)
    return json(
      { error: { code: "not_found", message: "Member not found" } },
      404,
    );
  if (member.status !== "active")
    return json(
      {
        error: {
          code: "invalid_status",
          message: "Only active members can request a transfer",
        },
      },
      400,
    );

  const transferRequestId = crypto.randomUUID();
  await ctx.db
    .prepare(
      "UPDATE members SET status = 'transferred-out', transferRequestId = ?, updatedAt = datetime('now') WHERE id = ?",
    )
    .bind(transferRequestId, id)
    .run();

  const updated = await ctx.db
    .prepare("SELECT * FROM members WHERE id = ?")
    .bind(id)
    .first();
  return json({ member: updated });
}

export async function rollConfirm(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  const user = ctx.user;
  if (!user) return json({ error: { code: "unauthorized" } }, 401);

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const memberIds = body?.memberIds as string[] | undefined;
  if (!memberIds || !Array.isArray(memberIds)) {
    return json(
      {
        error: {
          code: "missing_fields",
          message: "memberIds array is required",
        },
      },
      400,
    );
  }

  let confirmed = 0;
  for (const mid of memberIds) {
    const member = await ctx.db
      .prepare("SELECT id FROM members WHERE id = ? AND orgId = ?")
      .bind(mid, churchId)
      .first();
    if (member) {
      confirmed++;
    }
  }

  return json({ confirmed, total: memberIds.length });
}
