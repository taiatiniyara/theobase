export const ROLES = [
  'clerk',
  'treasurer',
  'counter',
  'pastor',
  'department-head',
  'board-member',
  'member',
  'interest',
  'visitor',
  'conference-treasurer',
  'conference-secretary',
  'conference-president',
  'auditor',
  'operator',
] as const;

export type Role = (typeof ROLES)[number];

export interface JwtPayload {
  sub: string;
  churchId: string;
  role: Role;
  tokenVersion: number;
  /** Active grant's org unit when the session is grant-scoped (ADR-0018 §7). */
  unitId: string | null;
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

export const MAGIC_LINK_EXPIRY_MS = 10 * 60 * 1000;
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_REFRESH_MS = 24 * 60 * 60 * 1000;

export const MFA_REQUIRED_ROLES: Role[] = ['treasurer', 'counter'];

export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const RATE_LIMIT_MAX_ATTEMPTS = 20;
