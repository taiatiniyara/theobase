export type OrganizationType = 
  | 'local_church'
  | 'district'
  | 'mission'
  | 'conference'
  | 'union'
  | 'general_conference';

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  type: OrganizationType;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'treasurer' | 'pastor' | 'executive_committee' | 'administrator';

export interface Member {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: MemberRole;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: MemberRole;
  organizationId: string;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}
