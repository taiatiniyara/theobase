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

export type FundType = 'tithe' | 'offering';

export interface Transaction {
  id: string;
  tenant_id: string;
  organization_id: string;
  member_id: string | null;
  fund_type: FundType;
  amount: number;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfferingPlan {
  id: string;
  tenant_id: string;
  name: string;
  local_percent: number;
  conference_percent: number;
  union_percent: number;
  gc_percent: number;
  created_at: string;
  updated_at: string;
}

export interface FundAllocation {
  id: string;
  transaction_id: string;
  fund_type: FundType;
  amount: number;
  destination_org_id: string;
  created_at: string;
}

export interface Remittance {
  id: string;
  tenant_id: string;
  source_org_id: string;
  destination_org_id: string;
  fund_type: FundType;
  amount: number;
  user_id: string;
  remittance_date: string;
  notes: string | null;
  created_at: string;
}

export interface Balance {
  id: string;
  tenant_id: string;
  organization_id: string;
  fund_type: FundType;
  amount: number;
  updated_at: string;
}

export interface SyncPayload {
  transactions: Omit<Transaction, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[];
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}
