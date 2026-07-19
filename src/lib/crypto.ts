import { SignJWT, jwtVerify } from 'jose';

export async function hashPassword(password: string): Promise<string> {
  // Simple SHA-256 hash for foundation - use bcrypt/argon2 in production
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(secret));
  return jwt;
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
