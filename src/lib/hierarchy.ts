import type { Organization, OrganizationType } from '../types';

export interface OrgHierarchy {
  local_church: Organization | null;
  district: Organization | null;
  mission: Organization | null;
  conference: Organization | null;
  union: Organization | null;
  division: Organization | null;
  general_conference: Organization | null;
}

/**
 * Traverse up the org hierarchy from a given organization.
 * Returns all ancestors keyed by type.
 */
export async function getOrgHierarchy(
  db: D1Database,
  orgId: string,
  tenantId: string
): Promise<OrgHierarchy> {
  const hierarchy: OrgHierarchy = {
    local_church: null,
    district: null,
    mission: null,
    conference: null,
    union: null,
    division: null,
    general_conference: null,
  };

  let currentId: string | null = orgId;

  while (currentId) {
    const org: Organization | null = await db.prepare(
      'SELECT * FROM organizations WHERE id = ? AND tenant_id = ?'
    )
      .bind(currentId, tenantId)
      .first<Organization>() as Organization | null;

    if (!org) break;

    hierarchy[org.type] = org;
    currentId = org.parent_id;
  }

  return hierarchy;
}

/**
 * Find the parent organization of a specific type.
 */
export async function findParentByType(
  db: D1Database,
  orgId: string,
  tenantId: string,
  targetType: OrganizationType
): Promise<Organization | null> {
  let currentId: string | null = orgId;

  while (currentId) {
    const org: Organization | null = await db.prepare(
      'SELECT * FROM organizations WHERE id = ? AND tenant_id = ?'
    )
      .bind(currentId, tenantId)
      .first<Organization>() as Organization | null;

    if (!org) return null;
    if (org.type === targetType) return org;
    currentId = org.parent_id;
  }

  return null;
}
