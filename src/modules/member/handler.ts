import type { RouterContext } from "../../lib/router";
import { json } from "../../lib/router";

const VALID_STATUSES = [
  "active",
  "under-censure",
  "transferred-out",
  "transferred-in",
  "disfellowshipped",
  "apostasy",
  "missing",
  "renounced",
  "deceased",
] as const;

type MemberStatus = (typeof VALID_STATUSES)[number];

const STATUS_TRANSITIONS: Record<MemberStatus, MemberStatus[]> = {
  active: [
    "under-censure",
    "transferred-out",
    "disfellowshipped",
    "apostasy",
    "missing",
    "renounced",
    "deceased",
  ],
  "under-censure": ["active", "transferred-out", "disfellowshipped"],
  "transferred-out": ["active", "transferred-in"],
  "transferred-in": ["active"],
  disfellowshipped: ["active"],
  apostasy: ["active"],
  missing: ["active"],
  renounced: ["active"],
  deceased: [],
};

function validTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from as MemberStatus];
  return allowed ? allowed.includes(to as MemberStatus) : false;
}

export async function listMembers(ctx: RouterContext): Promise<Response> {
  const { churchId } = ctx.params;
  if (!churchId)
    return json(
      { error: { code: "missing_params", message: "churchId is required" } },
      400,
    );

  const url = new URL(ctx.request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 100);
  const offset = (page - 1) * limit;

  let query =
    "SELECT id, orgId, firstName, lastName, email, phone, address, status, baptismDate, transferRequestId, householdId, createdAt, updatedAt FROM members WHERE orgId = ?";
  const params: unknown[] = [churchId];

  if (status && VALID_STATUSES.includes(status as MemberStatus)) {
    query += " AND status = ?";
    params.push(status);
  }

  if (search) {
    query += " AND (firstName LIKE ? OR lastName LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const countResult = await ctx.db
    .prepare(
      query.replace(
        "SELECT id, orgId, firstName, lastName, email, phone, address, status, baptismDate, transferRequestId, householdId, createdAt, updatedAt",
        "SELECT COUNT(*) as total",
      ),
    )
    .bind(...params)
    .first<{ total: number }>();

  query += " ORDER BY lastName, firstName LIMIT ? OFFSET ?";
  params.push(limit, offset);

  const result = await ctx.db
    .prepare(query)
    .bind(...params)
    .all();

  return json({
    members: result.results,
    total: countResult?.total ?? 0,
    page,
    limit,
  });
}

export async function getMember(ctx: RouterContext): Promise<Response> {
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

  const member = await ctx.db
    .prepare(
      "SELECT id, orgId, firstName, lastName, email, phone, address, status, baptismDate, transferRequestId, householdId, createdAt, updatedAt FROM members WHERE id = ? AND orgId = ?",
    )
    .bind(id, churchId)
    .first();

  if (!member)
    return json(
      { error: { code: "not_found", message: "Member not found" } },
      404,
    );

  return json({ member });
}

export async function createMember(ctx: RouterContext): Promise<Response> {
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

  const { firstName, lastName, email, phone, address, baptismDate, status } =
    body;
  if (!firstName || typeof firstName !== "string")
    return json(
      { error: { code: "missing_fields", message: "firstName is required" } },
      400,
    );
  if (!lastName || typeof lastName !== "string")
    return json(
      { error: { code: "missing_fields", message: "lastName is required" } },
      400,
    );

  const memberStatus = (status as string) || "active";
  if (!VALID_STATUSES.includes(memberStatus as MemberStatus)) {
    return json(
      {
        error: {
          code: "invalid_status",
          message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
        },
      },
      400,
    );
  }

  const org = await ctx.db
    .prepare("SELECT id, level FROM orgs WHERE id = ?")
    .bind(churchId)
    .first<{ id: string; level: string }>();
  if (!org || (org.level !== "church" && org.level !== "company")) {
    return json(
      {
        error: {
          code: "invalid_org",
          message: "Members can only be added to a Church or Company",
        },
      },
      400,
    );
  }

  const id = crypto.randomUUID();
  await ctx.db
    .prepare(
      "INSERT INTO members (id, orgId, firstName, lastName, email, phone, address, status, baptismDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      churchId,
      firstName,
      lastName,
      (email as string) ?? null,
      (phone as string) ?? null,
      (address as string) ?? null,
      memberStatus,
      (baptismDate as string) ?? null,
    )
    .run();

  return json(
    {
      member: {
        id,
        orgId: churchId,
        firstName,
        lastName,
        email: email ?? null,
        phone: phone ?? null,
        address: address ?? null,
        status: memberStatus,
        baptismDate: baptismDate ?? null,
      },
    },
    201,
  );
}

export async function updateMember(ctx: RouterContext): Promise<Response> {
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

  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== "object")
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
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

  const { firstName, lastName, email, phone, address, baptismDate, status } =
    body;

  if (status && typeof status === "string") {
    if (!VALID_STATUSES.includes(status as MemberStatus)) {
      return json(
        {
          error: {
            code: "invalid_status",
            message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
          },
        },
        400,
      );
    }
    if (!validTransition(member.status, status)) {
      return json(
        {
          error: {
            code: "invalid_transition",
            message: `Cannot transition from ${member.status} to ${status}`,
          },
        },
        400,
      );
    }
    await ctx.db
      .prepare(
        "UPDATE members SET status = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(status, id)
      .run();
  }

  if (firstName !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET firstName = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(firstName, id)
      .run();
  if (lastName !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET lastName = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(lastName, id)
      .run();
  if (email !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET email = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(email, id)
      .run();
  if (phone !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET phone = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(phone, id)
      .run();
  if (address !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET address = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(address, id)
      .run();
  if (baptismDate !== undefined)
    await ctx.db
      .prepare(
        "UPDATE members SET baptismDate = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(baptismDate, id)
      .run();

  const updated = await ctx.db
    .prepare(
      "SELECT id, orgId, firstName, lastName, email, phone, address, status, baptismDate, transferRequestId, householdId, createdAt, updatedAt FROM members WHERE id = ?",
    )
    .bind(id)
    .first();

  return json({ member: updated });
}
