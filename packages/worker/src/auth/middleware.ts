import { verify } from './jwt';
import { drizzle } from 'drizzle-orm/d1';
import { eq, or } from 'drizzle-orm';
import { user as userTable } from '@theobase/shared';
import type { JwtPayload, Role } from '@theobase/shared';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export async function authenticate(
  request: Request,
  env?: { DB?: D1Database },
): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await verify(token);
    if (env?.DB && (payload.unitId !== undefined || payload.isSuperAdmin !== undefined)) {
      const db = drizzle(env.DB);
      const profile = await db
        .select()
        .from(userTable)
        .where(or(eq(userTable.id, payload.sub), eq(userTable.email, payload.sub)))
        .get();
      if (profile && profile.tokenVersion !== payload.tokenVersion) return null;
    }
    return Object.assign(request, { user: payload }) as AuthenticatedRequest;
  } catch {
    return null;
  }
}

export function requireRole(request: Request, allowedRoles: Role[]): JwtPayload | null {
  const authReq = request as AuthenticatedRequest;
  if (!authReq.user) return null;
  if (authReq.user.isSuperAdmin) return authReq.user;
  if (allowedRoles.length === 0) return authReq.user;
  if (!allowedRoles.includes(authReq.user.role)) return null;
  return authReq.user;
}

export function requireChurchId(request: Request, churchId: string): JwtPayload | null {
  const authReq = request as AuthenticatedRequest;
  if (!authReq.user) return null;
  if (authReq.user.churchId !== churchId) return null;
  return authReq.user;
}
