import type { D1Database } from "@cloudflare/workers-types";
import type { RouterContext } from "../../lib/router";
import { json } from "../../lib/router";
import { hashPassword, verifyPassword } from "../../lib/hash";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt";

export async function register(ctx: RouterContext): Promise<Response> {
  const body = await ctx.request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
    );
  }

  const { email, password, role, orgId } = body as Record<string, unknown>;
  const missing: string[] = [];
  if (!email || typeof email !== "string") missing.push("email");
  if (!password || typeof password !== "string") missing.push("password");
  if (!role || typeof role !== "string") missing.push("role");
  if (!orgId || typeof orgId !== "string") missing.push("orgId");
  if (missing.length > 0) {
    return json(
      {
        error: {
          code: "missing_fields",
          message: `Missing required fields: ${missing.join(", ")}`,
        },
      },
      400,
    );
  }

  const emailLower = (email as string).toLowerCase().trim();

  const existing = await ctx.db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind(emailLower)
    .first();
  if (existing) {
    return json(
      {
        error: {
          code: "duplicate_email",
          message: "A user with this email already exists",
        },
      },
      409,
    );
  }

  const validRoles = [
    "member",
    "clerk",
    "treasurer",
    "pastor",
    "elder",
    "conference-secretary",
    "conference-treasurer",
    "union-officer",
    "division-officer",
    "system-admin",
  ];
  if (!validRoles.includes(role as string)) {
    return json(
      { error: { code: "invalid_role", message: "Invalid role" } },
      400,
    );
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password as string);

  await ctx.db
    .prepare(
      "INSERT INTO users (id, orgId, email, passwordHash, role) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, orgId as string, emailLower, passwordHash, role as string)
    .run();

  return json(
    {
      user: {
        id,
        email: emailLower,
        role: role as string,
        orgId: orgId as string,
        active: true,
      },
    },
    201,
  );
}

export async function login(ctx: RouterContext): Promise<Response> {
  const body = await ctx.request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return json(
      { error: { code: "invalid_body", message: "Invalid request body" } },
      400,
    );
  }

  const { email, password } = body as Record<string, unknown>;
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    return json(
      {
        error: {
          code: "missing_fields",
          message: "Email and password are required",
        },
      },
      400,
    );
  }

  const emailLower = (email as string).toLowerCase().trim();

  const user = await ctx.db
    .prepare(
      "SELECT id, orgId, email, passwordHash, role, active FROM users WHERE email = ?",
    )
    .bind(emailLower)
    .first<{
      id: string;
      orgId: string;
      email: string;
      passwordHash: string;
      role: string;
      active: number;
    }>();

  if (!user || !user.active) {
    return json(
      {
        error: {
          code: "invalid_credentials",
          message: "Invalid email or password",
        },
      },
      401,
    );
  }

  const valid = await verifyPassword(password as string, user.passwordHash);
  if (!valid) {
    return json(
      {
        error: {
          code: "invalid_credentials",
          message: "Invalid email or password",
        },
      },
      401,
    );
  }

  const orgLevel = await getOrgLevel(ctx.db, user.orgId);
  const accessToken = await createAccessToken(
    { sub: user.id, orgId: user.orgId, orgLevel, role: user.role },
    ctx.jwtSecret,
  );
  const refreshTokenValue = await createRefreshToken(user.id, ctx.jwtSecret);

  const refreshId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  await ctx.db
    .prepare(
      "INSERT INTO refresh_tokens (id, userId, tokenHash, expiresAt) VALUES (?, ?, ?, ?)",
    )
    .bind(refreshId, user.id, refreshTokenValue, expiresAt)
    .run();

  return json({
    accessToken,
    refreshToken: `${refreshId}:${refreshTokenValue}`,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      orgLevel,
    },
  });
}

export async function refresh(ctx: RouterContext): Promise<Response> {
  const body = (await ctx.request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.refreshToken !== "string") {
    return json(
      { error: { code: "invalid_body", message: "refreshToken is required" } },
      400,
    );
  }

  const refreshToken = body.refreshToken as string;
  const [refreshId, tokenValue] = refreshToken.split(":");
  if (!refreshId || !tokenValue) {
    return json(
      { error: { code: "invalid_token", message: "Invalid refresh token" } },
      401,
    );
  }

  const stored = await ctx.db
    .prepare(
      "SELECT id, userId, tokenHash, expiresAt FROM refresh_tokens WHERE id = ?",
    )
    .bind(refreshId)
    .first<{
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: string;
    }>();

  if (!stored || new Date(stored.expiresAt) < new Date()) {
    return json(
      { error: { code: "expired_token", message: "Refresh token expired" } },
      401,
    );
  }

  const payload = await verifyRefreshToken(tokenValue, ctx.jwtSecret);
  if (!payload || payload.sub !== stored.userId) {
    return json(
      { error: { code: "invalid_token", message: "Invalid refresh token" } },
      401,
    );
  }

  await ctx.db
    .prepare("DELETE FROM refresh_tokens WHERE id = ?")
    .bind(refreshId)
    .run();

  const user = await ctx.db
    .prepare(
      "SELECT id, orgId, email, role FROM users WHERE id = ? AND active = 1",
    )
    .bind(stored.userId)
    .first<{ id: string; orgId: string; email: string; role: string }>();

  if (!user) {
    return json(
      { error: { code: "user_not_found", message: "User not found" } },
      401,
    );
  }

  const orgLevel = await getOrgLevel(ctx.db, user.orgId);
  const accessToken = await createAccessToken(
    { sub: user.id, orgId: user.orgId, orgLevel, role: user.role },
    ctx.jwtSecret,
  );
  const newRefreshTokenValue = await createRefreshToken(user.id, ctx.jwtSecret);
  const newRefreshId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await ctx.db
    .prepare(
      "INSERT INTO refresh_tokens (id, userId, tokenHash, expiresAt) VALUES (?, ?, ?, ?)",
    )
    .bind(newRefreshId, user.id, newRefreshTokenValue, expiresAt)
    .run();

  return json({
    accessToken,
    refreshToken: `${newRefreshId}:${newRefreshTokenValue}`,
  });
}

async function getOrgLevel(db: D1Database, orgId: string): Promise<string> {
  const org = await db
    .prepare("SELECT level FROM orgs WHERE id = ?")
    .bind(orgId)
    .first<{ level: string }>();
  return org?.level ?? "church";
}
