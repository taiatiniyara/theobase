// See CONTEXT.md > UI/UX for the settled per-role breakdown this
// mirrors. Local roles log in via phone+PIN (accountType 'local');
// institutional roles via email+password (accountType 'institutional')
// — see accounts.ts's createLocalAccount/createInstitutionalAccount,
// which only accept the matching role set for each.
export const LOCAL_ROLES = ['treasurer', 'clerk', 'pastor'] as const
export const INSTITUTIONAL_ROLES = ['mission_admin', 'mission_staff', 'platform_operator'] as const
export const ROLES = [...LOCAL_ROLES, ...INSTITUTIONAL_ROLES] as const

export type LocalRole = (typeof LOCAL_ROLES)[number]
export type InstitutionalRole = (typeof INSTITUTIONAL_ROLES)[number]
export type Role = (typeof ROLES)[number]

export interface OrgScope {
  churchId: number | null
  districtId: number | null
  missionId: number | null
}

// Mirrors the accounts_scope_matches_role CHECK constraint in
// schema.ts — this gives a clear application-level error instead of a
// raw SQLite constraint-violation message, but the DB constraint is
// the real guarantee (this function existing doesn't replace it).
export function assertValidScope(role: Role, scope: OrgScope): void {
  const { churchId, districtId, missionId } = scope
  switch (role) {
    case 'treasurer':
    case 'clerk':
      if (churchId === null || districtId !== null || missionId !== null) {
        throw new Error(`role '${role}' requires exactly a churchId (and no district/mission)`)
      }
      return
    case 'pastor':
      if (districtId === null || churchId !== null || missionId !== null) {
        throw new Error(`role 'pastor' requires exactly a districtId (and no church/mission)`)
      }
      return
    case 'mission_admin':
    case 'mission_staff':
      if (missionId === null || churchId !== null || districtId !== null) {
        throw new Error(`role '${role}' requires exactly a missionId (and no church/district)`)
      }
      return
    case 'platform_operator':
      if (churchId !== null || districtId !== null || missionId !== null) {
        throw new Error("role 'platform_operator' must not have a church/district/mission scope")
      }
  }
}
