import { Context, Next } from 'hono';
import type { Env, AuthPayload, MemberRole, OrganizationType } from '../types';

// Define which roles can access which organization types
const ROLE_HIERARCHY: Record<MemberRole, OrganizationType[]> = {
  treasurer: ['local_church', 'district', 'mission', 'conference', 'union', 'general_conference'],
  pastor: ['local_church', 'district', 'mission', 'conference', 'union', 'general_conference'],
  executive_committee: ['local_church', 'district', 'mission', 'conference', 'union', 'general_conference'],
  administrator: ['local_church', 'district', 'mission', 'conference', 'union', 'general_conference'],
};

// Define visibility rules: which orgs can a user at a given level see?
const VISIBILITY_RULES: Record<OrganizationType, OrganizationType[]> = {
  local_church: ['local_church'],
  district: ['local_church', 'district'],
  mission: ['local_church', 'district', 'mission'],
  conference: ['local_church', 'district', 'mission', 'conference'],
  union: ['local_church', 'district', 'mission', 'conference', 'union'],
  general_conference: ['local_church', 'district', 'mission', 'conference', 'union', 'general_conference'],
};

export async function permissionMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.get('auth') as AuthPayload | undefined;

  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Get the organization being accessed (from route params or context)
  const targetOrgId = c.req.param('org_id') || c.req.param('id');
  
  if (targetOrgId) {
    // Fetch the target organization
    const org = await c.env.DB.prepare(
      'SELECT * FROM organizations WHERE id = ? AND tenant_id = ?'
    )
      .bind(targetOrgId, auth.tenantId)
      .first<{ id: string; type: OrganizationType; tenant_id: string }>();

    if (!org) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    // Fetch the user's organization to determine their level
    const userOrg = await c.env.DB.prepare(
      'SELECT type FROM organizations WHERE id = ? AND tenant_id = ?'
    )
      .bind(auth.organizationId, auth.tenantId)
      .first<{ type: OrganizationType }>();

    if (!userOrg) {
      return c.json({ error: 'User organization not found' }, 404);
    }

    // Check if user's role allows access to this organization type
    const allowedTypes = ROLE_HIERARCHY[auth.role];
    if (!allowedTypes.includes(org.type)) {
      return c.json({ error: 'Permission denied' }, 403);
    }

    // Check visibility: can user at their level see this org?
    const visibleTypes = VISIBILITY_RULES[userOrg.type];
    if (!visibleTypes.includes(org.type)) {
      return c.json({ error: 'Permission denied: cannot access organizations at this level' }, 403);
    }

    // For treasurer/pastor at local_church level: can only access their own church
    if (userOrg.type === 'local_church' && (auth.role === 'treasurer' || auth.role === 'pastor')) {
      if (org.id !== auth.organizationId) {
        return c.json({ error: 'Permission denied: can only access your own organization' }, 403);
      }
    }
  }

  await next();
}

export function canAccessOrganization(
  userRole: MemberRole,
  userOrgType: OrganizationType,
  targetOrgType: OrganizationType,
  userOrgId: string,
  targetOrgId: string
): boolean {
  const allowedTypes = ROLE_HIERARCHY[userRole];
  
  // Check if role allows this organization type
  if (!allowedTypes.includes(targetOrgType)) {
    return false;
  }

  // Check visibility rules
  const visibleTypes = VISIBILITY_RULES[userOrgType];
  if (!visibleTypes.includes(targetOrgType)) {
    return false;
  }

  // Local church treasurer/pastor can only access their own organization
  if (userOrgType === 'local_church' && (userRole === 'treasurer' || userRole === 'pastor')) {
    return userOrgId === targetOrgId;
  }

  // Others can access any organization within their visibility scope
  return true;
}
