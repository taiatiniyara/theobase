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

export type AuditEntityType = 'transaction' | 'remittance' | 'member' | 'organization';
export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  tenant_id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  user_id: string;
  before_values: string | null;
  after_values: string | null;
  created_at: string;
}

export interface GivingHistory {
  member_id: string;
  member_name: string;
  year: number;
  fund_type: FundType;
  total: number;
  transaction_count: number;
}

export interface SyncPayload {
  transactions: Omit<Transaction, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>[];
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  content: string | ArrayBuffer;
  filename: string;
  type: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailPayload {
  to: string | string[];
  from: EmailAddress;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  messageId: string;
}

export interface SendEmail {
  send(payload: EmailPayload): Promise<EmailSendResult>;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  EMAIL: SendEmail;
  EMAIL_FROM_NAME?: string;
  EMAIL_FROM_ADDRESS?: string;
}
