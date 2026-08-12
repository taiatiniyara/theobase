// ====================================================================
// SDA organization hierarchy (ADR-0018) — pure constants, types, and maps.
// The DDL lives in schema.ts (single source of truth for drizzle).
// ====================================================================

export const ORG_LEVELS = [
  'gc',
  'division',
  'union',
  'conference',
  'district',
  'church',
  'company',
  'institution',
] as const;
export type OrgLevel = (typeof ORG_LEVELS)[number];

export const ORG_KINDS = [
  'general-conference',
  'division',
  'union-conference',
  'union-mission',
  'attached-mission',
  'conference',
  'mission',
  'field',
  'attached-field',
  'district',
  'church',
  'company',
  'group',
  'institution',
] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const ORG_STATUSES = ['organized', 'constituted', 'attached', 'inactive'] as const;
export type OrgStatus = (typeof ORG_STATUSES)[number];

export const ORG_FACETS = ['tenant', 'subscribable', 'aggregator', 'non-entity', 'institution'] as const;
export type OrgFacet = (typeof ORG_FACETS)[number];

export const LEVEL_FACETS: Record<OrgLevel, readonly OrgFacet[]> = {
  gc: ['aggregator'],
  division: ['aggregator', 'subscribable'],
  union: ['aggregator', 'subscribable'],
  conference: ['aggregator', 'subscribable'],
  district: ['aggregator', 'non-entity'],
  church: ['tenant'],
  company: [],
  institution: ['institution'],
};

// --------------------------------------------------------------------
// Roles & grants (replaces role_assignment)
// --------------------------------------------------------------------

const CHURCH_ROLES = [
  'clerk',
  'treasurer',
  'counter',
  'pastor',
  'department-head',
  'board-member',
  'member',
  'interest',
  'visitor',
] as const;

const ORG_ROLES = [
  'conference-treasurer',
  'conference-secretary',
  'conference-president',
] as const;

export const GRANT_ROLES = [...CHURCH_ROLES, ...ORG_ROLES, 'auditor'] as const;
export type GrantRole = (typeof GRANT_ROLES)[number];

/** Level classification of an org unit. Level is structural; kind is Yearbook naming/status. */
export function levelForKind(kind: OrgKind): OrgLevel {
  switch (kind) {
    case 'general-conference':
      return 'gc';
    case 'division':
      return 'division';
    case 'union-conference':
    case 'union-mission':
    case 'attached-mission':
      return 'union';
    case 'conference':
    case 'mission':
    case 'field':
    case 'attached-field':
      return 'conference';
    case 'district':
      return 'district';
    case 'church':
      return 'church';
    case 'company':
    case 'group':
      return 'company';
    case 'institution':
      return 'institution';
  }
}

export const LEVEL_ROLES: Record<OrgLevel, readonly GrantRole[]> = {
  gc: [...ORG_ROLES, 'auditor'],
  division: [...ORG_ROLES, 'auditor'],
  union: [...ORG_ROLES, 'auditor'],
  conference: [...ORG_ROLES, 'auditor'],
  district: ['pastor', 'auditor'],
  church: [...CHURCH_ROLES, 'auditor'],
  company: [],
  institution: [],
};

export function canGrantAtLevel(role: GrantRole, level: OrgLevel): boolean {
  return LEVEL_ROLES[level].includes(role);
}

// --------------------------------------------------------------------
// Transfers (D1-authoritative; orchestrated by a durable workflow)
// --------------------------------------------------------------------

export const TRANSFER_STATUSES = ['pending-accept', 'accepted', 'rejected'] as const;
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

// --------------------------------------------------------------------
// orgAudit — append-only governance trail (trusted writers, no hash chain)
// --------------------------------------------------------------------

export const ORG_AUDIT_ACTIONS = [
  'unit:create',
  'unit:update',
  'unit:promote',
  'unit:deactivate',
  'unit:delete',
  'grant:grant',
  'grant:revoke',
  'grant:expire',
  'subscription:set',
  'subscription:grace',
  'subscription:end',
  'transfer:initiate',
  'transfer:accept',
  'transfer:reject',
] as const;
export type OrgAuditAction = (typeof ORG_AUDIT_ACTIONS)[number];

// --------------------------------------------------------------------
// JWT — active grant carries unitId + role; super admin has neither.
// Draft of the target shape; auth.ts still owns the current JwtPayload
// until the migration lands.
// --------------------------------------------------------------------

export interface OrgJwtPayload {
  sub: string;
  unitId: string | null;
  role: GrantRole | null;
  isSuperAdmin: boolean;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export interface ActiveGrant {
  userId: string;
  unitId: string;
  role: GrantRole;
}

export function hasRole(payload: OrgJwtPayload, roleCheck: (role: GrantRole) => boolean): boolean {
  if (payload.isSuperAdmin) return true;
  if (!payload.role) return false;
  return roleCheck(payload.role);
}