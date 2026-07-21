import { SignJWT, jwtVerify } from "jose";

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createAccessToken(
  payload: { sub: string; orgId: string; orgLevel: string; role: string },
  secret: string,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .setIssuedAt()
    .sign(secretKey(secret));
}

export async function createRefreshToken(
  userId: string,
  secret: string,
): Promise<string> {
  return new SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(secretKey(secret));
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<{
  sub: string;
  orgId: string;
  orgLevel: string;
  role: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (!payload.sub || !payload.orgId || !payload.orgLevel || !payload.role) {
      return null;
    }
    return {
      sub: payload.sub as string,
      orgId: payload.orgId as string,
      orgLevel: payload.orgLevel as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string,
  secret: string,
): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (payload.type !== "refresh" || !payload.sub) return null;
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}
