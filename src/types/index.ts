export type OrganizationType = 
  | 'local_church'
  | 'district'
  | 'mission'
  | 'conference'
  | 'union'
  | 'division'
  | 'general_conference';

export interface Organization {
  id: string;
  tenant_id: string;
  name: string;
  type: OrganizationType;
  parent_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  service_times: string | null;
  pastor_name: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberRole = 'clerk' | 'treasurer' | 'pastor' | 'head_elder' | 'mission_admin' | 'super_admin';

export type MembershipStatus = 'active' | 'inactive' | 'transferred_out' | 'deceased' | 'removed';

export interface Member {
  id: string;
  tenant_id: string;
  organization_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  password_hash: string | null;
  email_verified: boolean;
  reset_token: string | null;
  reset_token_expires: string | null;
  verification_token: string | null;
  membership_status: MembershipStatus;
  baptism_date: string | null;
  profession_of_faith_date: string | null;
  original_join_date: string | null;
  role: MemberRole | null;
  guardian_id: string | null;
  household_id: string | null;
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

export type FundType = 'tithe' | 'offering' | 'restricted';

export interface Transaction {
  id: string;
  tenant_id: string;
  organization_id: string;
  member_id: string | null;
  fund_type: FundType;
  offering_sub_category: string | null;
  amount: number;
  transaction_date: string;
  notes: string | null;
  created_by: string | null;
  batch_id: string | null;
  is_synced: boolean;
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

export type FundAllocationFundType = 'tithe' | 'offering' | 'restricted';

export interface FundAllocation {
  id: string;
  transaction_id: string;
  destination_org_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
}

export type RemittanceStatus = 'draft' | 'submitted' | 'confirmed';

export interface Remittance {
  id: string;
  tenant_id: string;
  source_org_id: string;
  destination_org_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: RemittanceStatus;
  submitted_by: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BalanceFundType = 'tithe' | 'offering_local' | 'offering_district' | 'offering_mission' | 'offering_conference' | 'offering_union' | 'offering_division' | 'offering_gc' | 'restricted';

export interface Balance {
  id: string;
  organization_id: string;
  fund_type: BalanceFundType;
  amount: number;
  updated_at: string;
}

export interface Household {
  id: string;
  tenant_id: string;
  organization_id: string;
  name: string;
  head_of_household_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TransferStatus = 'pending_sending_approval' | 'pending_receiving_approval' | 'accepted' | 'rejected';

export interface MemberTransfer {
  id: string;
  tenant_id: string;
  member_id: string;
  sending_org_id: string;
  receiving_org_id: string;
  status: TransferStatus;
  sending_board_vote_date: string | null;
  receiving_board_vote_date: string | null;
  initiated_by: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategory {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  tenant_id: string;
  organization_id: string;
  category_id: string | null;
  amount: number;
  payee: string;
  expense_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemittanceItem {
  id: string;
  remittance_id: string;
  fund_type: string;
  amount_collected: number;
  amount_retained: number;
  amount_remitted: number;
  created_at: string;
}

export interface TenantSignup {
  id: string;
  church_name: string;
  church_type: OrganizationType;
  parent_mission_id: string;
  clerk_name: string;
  clerk_email: string;
  status: 'pending' | 'approved' | 'declined';
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type AuditEntityType = 'transaction' | 'remittance' | 'member' | 'organization' | 'transfer' | 'expense' | 'tenant';
export type AuditAction = 'create' | 'update' | 'delete';

export interface AuditLog {
  id: string;
  tenant_id: string;
  organization_id: string | null;
  actor_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
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
