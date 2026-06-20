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

const READ_ONLY_ROLES = new Set(["pastor", "elder", "member"]);

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

export function isWriteRole(role: string): boolean {
  return WRITE_ROLES.has(role);
}

export function isReadOnly(userRoles: string[]): boolean {
  return userRoles.length > 0 && userRoles.every((r) => READ_ONLY_ROLES.has(r));
}

export function requireWriteAccess(...roles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const userRoles: string[] = c.get("userRoles") || [];

    if (roles.length > 0 && !roles.some((r) => userRoles.includes(r))) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    const hasWriteRole = userRoles.some((r) => WRITE_ROLES.has(r));
    if (!hasWriteRole) {
      return c.json({ error: "Read-only access. Contact your clerk to modify records." }, 403);
    }

    await next();
  };
}

export const DEPARTMENT_ROLE_MAP: Record<string, string> = {
  pathfinders: "pathfinder_director",
  adventurers: "adventurer_director",
  sabbath_school: "sabbath_school_superintendent",
  dorcas: "dorcas_coordinator",
  health: "health_ministries_leader",
  av: "av_operator",
};

export function requireDepartmentRole(departmentType: string): MiddlewareHandler {
  return async (c, next) => {
    const userRoles: string[] = c.get("userRoles") || [];

    if (userRoles.includes("clerk") || userRoles.includes("pastor") || userRoles.includes("district_pastor")) {
      await next();
      return;
    }

    const requiredRole = DEPARTMENT_ROLE_MAP[departmentType];
    if (!requiredRole || !userRoles.includes(requiredRole)) {
      return c.json({ error: "Access limited to department leaders" }, 403);
    }

    await next();
  };
}

export function anonymizeForViewer(
  records: Record<string, unknown>[],
  userRoles: string[],
): Record<string, unknown>[] {
  const isDistrictPastor = userRoles.includes("district_pastor") && !userRoles.includes("clerk");

  if (!isDistrictPastor) return records;

  const sensitiveFields = new Set([
    "firstName", "lastName", "email", "phone", "address",
    "first_name", "last_name", "person_id", "member_id",
    "volunteer_id", "actor_name",
  ]);

  return records.map((record) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (sensitiveFields.has(key)) {
        cleaned[key] = "[redacted]";
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  });
}
