import { verify } from './jwt';
import type { JwtPayload, Role } from '@theobase/shared';

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

export async function authenticate(request: Request): Promise<AuthenticatedRequest | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    const { payload } = await verify(token);
    return Object.assign(request, { user: payload }) as AuthenticatedRequest;
  } catch {
    return null;
  }
}

export function requireRole(request: Request, allowedRoles: Role[]): JwtPayload | null {
  const authReq = request as AuthenticatedRequest;
  if (!authReq.user) return null;
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
