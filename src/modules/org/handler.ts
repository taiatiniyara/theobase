import type { RouterContext } from "../../lib/router";
import { json } from "../../lib/router";

const VALID_LEVELS = [
  "division",
  "union",
  "conference",
  "church",
  "company",
] as const;

export async function listOrgs(ctx: RouterContext): Promise<Response> {
  const user = ctx.user;
  if (!user) {
    return json(
      { error: { code: "unauthorized", message: "Authentication required" } },
      401,
    );
  }

  let orgs;
  if (user.role === "system-admin") {
    orgs = await ctx.db
      .prepare(
        "SELECT id, parentId, name, level, districtId, createdAt, updatedAt FROM orgs ORDER BY level, name",
      )
      .all();
  } else {
    orgs = await ctx.db
      .prepare(
        "SELECT id, parentId, name, level, districtId, createdAt, updatedAt FROM orgs WHERE id = ?",
      )
      .bind(user.orgId)
      .all();
  }

  return json({ orgs: orgs.results });
}

export async function createOrg(ctx: RouterContext): Promise<Response> {
  const body = await ctx.request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
    );
  }

  const { name, level, parentId } = body as Record<string, unknown>;
  if (!name || typeof name !== "string") {
    return json(
      { error: { code: "missing_fields", message: "name is required" } },
      400,
    );
  }
  if (
    !level ||
    !VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])
  ) {
    return json(
      {
        error: {
          code: "invalid_level",
          message: `level must be one of: ${VALID_LEVELS.join(", ")}`,
        },
      },
      400,
    );
  }

  if (parentId && typeof parentId === "string") {
    const parent = await ctx.db
      .prepare("SELECT id FROM orgs WHERE id = ?")
      .bind(parentId)
      .first();
    if (!parent) {
      return json(
        { error: { code: "invalid_parent", message: "Parent org not found" } },
        400,
      );
    }
  }

  const id = crypto.randomUUID();
  await ctx.db
    .prepare("INSERT INTO orgs (id, name, level, parentId) VALUES (?, ?, ?, ?)")
    .bind(id, name as string, level as string, (parentId as string) ?? null)
    .run();

  return json({ org: { id, name, level, parentId: parentId ?? null } }, 201);
}

export async function getOrg(ctx: RouterContext): Promise<Response> {
  const { id } = ctx.params;
  if (!id) {
    return json(
      { error: { code: "missing_params", message: "id is required" } },
      400,
    );
  }

  const org = await ctx.db
    .prepare(
      "SELECT id, parentId, name, level, districtId, createdAt, updatedAt FROM orgs WHERE id = ?",
    )
    .bind(id)
    .first();

  if (!org) {
    return json(
      { error: { code: "not_found", message: "Org not found" } },
      404,
    );
  }

  return json({ org });
}

export async function updateOrg(ctx: RouterContext): Promise<Response> {
  const { id } = ctx.params;
  if (!id) {
    return json(
      { error: { code: "missing_params", message: "id is required" } },
      400,
    );
  }

  const body = await ctx.request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
    );
  }

  const { name, parentId } = body as Record<string, unknown>;

  const existing = await ctx.db
    .prepare("SELECT id FROM orgs WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) {
    return json(
      { error: { code: "not_found", message: "Org not found" } },
      404,
    );
  }

  if (name !== undefined && typeof name === "string") {
    await ctx.db
      .prepare(
        "UPDATE orgs SET name = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(name, id)
      .run();
  }
  if (parentId !== undefined) {
    await ctx.db
      .prepare(
        "UPDATE orgs SET parentId = ?, updatedAt = datetime('now') WHERE id = ?",
      )
      .bind(parentId, id)
      .run();
  }

  const org = await ctx.db
    .prepare(
      "SELECT id, parentId, name, level, districtId, createdAt, updatedAt FROM orgs WHERE id = ?",
    )
    .bind(id)
    .first();

  return json({ org });
}
