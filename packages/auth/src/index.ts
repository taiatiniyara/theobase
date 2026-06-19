import { SignJWT, jwtVerify } from "jose";
import { type MiddlewareHandler } from "hono";

const TOKEN_TTL_SECONDS = 60 * 10;
const JWT_TTL_SECONDS = 60 * 60 * 24;

const DEFAULT_SECRET = "theobase-dev-secret-change-in-production";

function encodeSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createJwt(
  payload: { userId: string; congregationId?: string },
  secretOrTtl?: string | number,
  ttlSeconds?: number
): Promise<string> {
  let secret: string;
  let ttl: number | undefined;
  if (typeof secretOrTtl === "string") {
    secret = secretOrTtl;
    ttl = ttlSeconds;
  } else {
    secret = DEFAULT_SECRET;
    ttl = secretOrTtl;
  }
  const key = encodeSecret(secret);
  return new SignJWT({ sub: payload.userId, congregation_id: payload.congregationId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl ?? JWT_TTL_SECONDS}s`)
    .sign(key);
}

export async function verifyJwt(
  token: string,
  secret?: string
): Promise<{ userId: string; congregationId?: string } | null> {
  try {
    const key = encodeSecret(secret || DEFAULT_SECRET);
    const { payload } = await jwtVerify(token, key);
    return {
      userId: payload.sub!,
      congregationId: payload.congregation_id as string | undefined,
    };
  } catch {
    return null;
  }
}

export function getTokenTtlSeconds(): number {
  return TOKEN_TTL_SECONDS;
}

export function requireAuth(): MiddlewareHandler {
  return async (c, next) => {
    const secret = (c.env as any).JWT_SECRET || DEFAULT_SECRET;

    const cookie = c.req.header("Cookie") || "";
    const cookieMatch = cookie.match(/token=([^;]+)/);

    const authHeader = c.req.header("Authorization") || "";
    const bearerMatch = authHeader.match(/^Bearer (.+)$/);

    const token = cookieMatch?.[1] || bearerMatch?.[1];

    if (!token) return c.json({ error: "Unauthorized" }, 401);

    const payload = await verifyJwt(token, secret);
    if (!payload) return c.json({ error: "Unauthorized" }, 401);

    c.set("userId", payload.userId);
    c.set("congregationId", payload.congregationId);
    await next();
  };
}

export function requireCongregation(): MiddlewareHandler {
  return async (c, next) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      return c.json({ error: "No congregation membership" }, 403);
    }
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
