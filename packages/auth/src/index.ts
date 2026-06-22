import { SignJWT, jwtVerify } from "jose";
import { type MiddlewareHandler } from "hono";

const TOKEN_TTL_SECONDS = 60 * 10;
const JWT_TTL_SECONDS = 60 * 60 * 24;

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is not configured. Set a strong random secret (min 16 chars) via wrangler secret put JWT_SECRET."
    );
  }
  return secret;
}

export async function createJwt(
  payload: { userId: string; congregationId?: string },
  secret: string,
  ttlSeconds?: number
): Promise<string> {
  requireSecret(secret);
  const key = encodeSecret(secret);
  return new SignJWT({
    sub: payload.userId,
    congregation_id: payload.congregationId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds ?? JWT_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifyJwt(
  token: string,
  secret: string
): Promise<{ userId: string; congregationId?: string } | { error: string }> {
  try {
    requireSecret(secret);
    const key = encodeSecret(secret);
    const { payload } = await jwtVerify(token, key);
    return {
      userId: payload.sub!,
      congregationId: payload.congregation_id as string | undefined,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "JWTExpired") {
      return { error: "Token expired" };
    }
    return { error: "Invalid token" };
  }
}

export function getTokenTtlSeconds(): number {
  return TOKEN_TTL_SECONDS;
}

export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const secret = (c.env as any).JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not configured");
      return c.json({ error: "Authentication service unavailable" }, 500);
    }

    const cookie = c.req.header("Cookie") || "";
    const cookieMatch = cookie.match(/token=([^;]+)/);

    const authHeader = c.req.header("Authorization") || "";
    const bearerMatch = authHeader.match(/^Bearer (.+)$/);

    const token = cookieMatch?.[1] || bearerMatch?.[1];

    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const payload = await verifyJwt(token, secret);
    if ("error" in payload) return c.json({ error: payload.error }, 401);

    c.set("userId", payload.userId);
    c.set("congregationId", payload.congregationId);
    await next();
  };
}

export function requireRole(...roles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const userRoles: string[] = c.get("userRoles") || [];
    if (roles.length > 0 && !roles.some((r) => userRoles.includes(r))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }
    await next();
  };
}

const WRITE_ROLES = new Set([
  "clerk",
  "treasurer",
  "pathfinder_director",
  "adventurer_director",
  "sabbath_school_superintendent",
  "dorcas_coordinator",
  "health_ministries_leader",
  "av_operator",
  "youth_leader",
  "music_coordinator",
  "deacon",
  "deaconess",
  "head_deacon",
  "head_deaconess",
  "district_pastor",
]);

export function requireWriteAccess(...roles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const userRoles: string[] = c.get("userRoles") || [];

    if (roles.length > 0 && !roles.some((r) => userRoles.includes(r))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const hasWriteRole = userRoles.some((r) => WRITE_ROLES.has(r));
    if (!hasWriteRole) {
      return c.json(
        { error: "Read-only access. Contact your clerk to modify records." },
        403
      );
    }

    await next();
  };
}
