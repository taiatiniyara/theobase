import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { churches, districts } from '../db/schema'
import type { OrgScope, Role } from './roles'

interface ScopedAccount extends OrgScope {
  role: Role
}

// "Can this account act on this church/district/mission" — the
// hierarchy-aware half of permission enforcement (requireRole in
// middleware.ts only checks role; a Mission Staff account passing
// requireRole('mission_staff') still shouldn't be able to touch a
// different Mission's data, which is what these check).
//
// platform-operator always returns false here deliberately: per
// CONTEXT.md > Platform-operator role, it has "no standing access to
// any Mission's actual financial records... by default" — these
// functions gate exactly that kind of record access. Its own
// operational actions (provisioning a Mission, etc. — #21) are a
// separate, not-yet-built authorization path, not an exception to
// this rule.

export async function canAccessChurch(
  db: Database,
  account: ScopedAccount,
  churchId: number,
): Promise<boolean> {
  if (account.role === 'platform_operator') return false
  if (account.churchId === churchId) return true // Treasurer/Clerk at that church

  const church = await db.query.churches.findFirst({ where: eq(churches.id, churchId) })
  if (!church) return false

  if (account.districtId !== null && account.districtId === church.districtId) {
    return true // Pastor of that church's district
  }
  if (account.missionId !== null) {
    const district = await db.query.districts.findFirst({
      where: eq(districts.id, church.districtId),
    })
    if (district && district.missionId === account.missionId) {
      return true // Mission Admin/Staff of that church's mission
    }
  }
  return false
}

export async function canAccessDistrict(
  db: Database,
  account: ScopedAccount,
  districtId: number,
): Promise<boolean> {
  if (account.role === 'platform_operator') return false
  if (account.districtId === districtId) return true // Pastor of that district

  const district = await db.query.districts.findFirst({ where: eq(districts.id, districtId) })
  if (!district) return false

  return account.missionId !== null && account.missionId === district.missionId
}

export function canAccessMission(account: ScopedAccount, missionId: number): boolean {
  if (account.role === 'platform_operator') return false
  return account.missionId === missionId
}
