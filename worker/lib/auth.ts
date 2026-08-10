import { SignJWT, jwtVerify } from "jose";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

function getKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: { sub: string; role: string; conferenceId?: number; churchId?: number },
  secret: string
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(getKey(secret));
}

export async function signRefreshToken(payload: { sub: string }, secret: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ ...payload, type: "refresh", jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<{
  sub: string;
  role: string;
  conferenceId?: number;
  churchId?: number;
  type: string;
  jti?: string;
  exp?: number;
}> {
  const { payload } = await jwtVerify(token, getKey(secret));
  return payload as unknown as {
    sub: string;
    role: string;
    conferenceId?: number;
    churchId?: number;
    type: string;
    jti?: string;
    exp?: number;
  };
}

export async function isTokenBlacklisted(db: D1Database, jti: string): Promise<boolean> {
  const row = await db
    .prepare("SELECT 1 FROM token_blacklist WHERE token_jti = ? LIMIT 1")
    .bind(jti)
    .first();
  return !!row;
}

export async function blacklistToken(
  db: D1Database,
  jti: string,
  expiresAt: string
): Promise<void> {
  await db
    .prepare("INSERT INTO token_blacklist (token_jti, expires_at) VALUES (?, ?)")
    .bind(jti, expiresAt)
    .run();
}

export async function cleanExpiredBlacklist(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM token_blacklist WHERE expires_at < datetime('now')").run();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(derived);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const computedHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computedHex === hashHex;
}

export function generateResetToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const VERIFY_EXPIRY = "24h";

export async function generateVerifyToken(userId: number, secret: string): Promise<string> {
  return new SignJWT({ sub: String(userId), type: "email-verify" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(VERIFY_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyEmailToken(token: string, secret: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, getKey(secret));
  if (payload.type !== "email-verify") throw new Error("Invalid token type");
  if (!payload.sub) throw new Error("Invalid token payload");
  return { sub: payload.sub };
}

const INVITE_EXPIRY = "7d";

export async function signInviteToken(
  payload: { email: string; conferenceId: number; role: string },
  secret: string
): Promise<string> {
  return new SignJWT({ ...payload, type: "invite" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(INVITE_EXPIRY)
    .sign(getKey(secret));
}

export async function verifyInviteToken(
  token: string,
  secret: string
): Promise<{ email: string; conferenceId: number; role: string }> {
  const { payload } = await jwtVerify(token, getKey(secret));
  if (payload.type !== "invite") throw new Error("Invalid token type");
  if (!payload.email || !payload.conferenceId || !payload.role) {
    throw new Error("Invalid invite payload");
  }
  return {
    email: String(payload.email),
    conferenceId: Number(payload.conferenceId),
    role: String(payload.role),
  };
}
