export interface MemberDto {
  id: number;
  church_id: number;
  household_id: number | null;
  full_name: string;
  preferred_name: string | null;
  dob: string | null;
  gender: string | null;
  baptism_date: string | null;
  baptism_type: string | null;
  join_date: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface MemberDetailDto extends MemberDto {
  prev_church_id: number | null;
  address: string | null;
  marital_status: string | null;
  status_date: string | null;
  church_name: string | null;
  household_name: string | null;
  positions: {
    id: number;
    name: string;
    module: string;
    start_date: string;
    end_date: string | null;
  }[];
}

export interface HouseholdDto {
  id: number;
  church_id: number;
  head_member_id: number | null;
  name: string;
  address: string | null;
  created_at: string;
  head_member_name: string | null;
  member_count: number;
}

export interface PositionDto {
  id: number;
  name: string;
  module: string;
}

export interface TransferDto {
  id: number;
  member_id: number;
  from_church_id: number;
  to_church_id: number;
  initiated_by: number;
  initiated_at: string;
  conference_approved_by: number | null;
  conference_approved_at: string | null;
  accepted_by: number | null;
  accepted_at: string | null;
  status: string;
  rejection_note: string | null;
  expires_at: string | null;
  override_by: number | null;
  override_at: string | null;
  override_action: string | null;
  override_note: string | null;
  member_name: string;
  from_church_name: string;
  to_church_name: string;
}

export interface FundDto {
  id: number;
  name: string;
  type: string;
  forwarding_rule: string;
  conference_id: number;
  created_at: string;
}

export interface ExpenseCategoryDto {
  id: number;
  name: string;
  conference_id: number;
  active: number;
  created_at: string;
}

export interface BatchDto {
  id: number;
  church_id: number;
  sabbath_date: string;
  status: string;
  confirmed_by_1: number | null;
  confirmed_at_1: string | null;
  confirmed_by_2: number | null;
  confirmed_at_2: string | null;
  submitted_by: number | null;
  submitted_at: string | null;
  created_at: string;
  church_name: string;
  confirmed_by_1_email: string | null;
  confirmed_by_2_email: string | null;
  submitted_by_email: string | null;
  transaction_count: number;
  total_amount: number;
}

export interface BatchDetailDto extends BatchDto {
  transactions: TransactionDto[];
}

export interface TransactionDto {
  id: number;
  church_id: number;
  fund_id: number;
  type: string;
  amount: number;
  description: string | null;
  category_id: number | null;
  budget_ref: number | null;
  batch_id: number | null;
  envelope_number: number | null;
  member_id: number | null;
  created_by: number;
  created_at: string;
  confirmed_by: number | null;
  confirmed_at: string | null;
  uuid: string;
  fund_name: string;
  fund_type: string;
  church_name: string;
  created_by_email: string;
  confirmed_by_email: string | null;
  category_name: string | null;
  member_name: string | null;
}

export interface BudgetDto {
  id: number;
  church_id: number;
  fund_id: number;
  category_id: number;
  planned_amount: number;
  fiscal_year: number;
  approved: number;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  fund_name: string;
  fund_type: string;
  church_name: string;
  category_name: string;
  spent_amount: number;
}

export interface BudgetTemplateDto {
  id: number;
  conference_id: number;
  category_id: number;
  fund_id: number;
  planned_amount: number;
  fiscal_year: number;
  created_at: string;
  category_name: string;
  fund_name: string;
}

export interface NotificationDto {
  id: number;
  recipient_user_id: number;
  type: string;
  entity_type: string;
  entity_id: number;
  message: string;
  read: number;
  created_at: string;
  actor_email: string | null;
}

export interface AuditLogEntryDto {
  id: number;
  timestamp: string;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number;
  prev_state: string | null;
  new_state: string | null;
  module: string;
  device_info: string | null;
  actor_email: string | null;
}

export interface AuditLogResponseDto {
  entries: AuditLogEntryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceRecordDto {
  id: number;
  church_id: number;
  date: string;
  count: number;
  category: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStatsDto {
  category: string;
  average: number | null;
  weeks: number;
  min: number | null;
  max: number | null;
}

export interface AttendanceTrendPointDto {
  date: string;
  count: number;
  category: string;
}

export interface ContributionSummaryDto {
  donorId: number;
  donorName: string;
  totals: Record<string, number>;
  grandTotal: number;
  transactionCount: number;
}

export interface ContributionStatementDto {
  donorId: number;
  donorName: string;
  year: number;
  churchId: number;
  churchName: string;
  transactions: {
    id: number;
    date: string;
    fund: string;
    fundName: string;
    amount: number;
    type: string;
    description: string | null;
    envelopeNumber: number | null;
  }[];
  totals: Record<string, number>;
  grandTotal: number;
}

export interface GivingDeclarationDto {
  id: number;
  church_id: number;
  fund_id: number;
  amount: number;
  description: string | null;
  member_id: number;
  proxy_for_member_id: number | null;
  verified: number;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  uuid: string;
  member_name: string;
  proxy_for_name: string | null;
  fund_name: string;
  fund_type: string;
}

export interface TitheEntryDto {
  churchId: number;
  churchName: string;
  forwardedAmount: number;
  status: string;
  receivedAmount: number;
  note: string | null;
}

export interface TitheReportEntryDto {
  churchId: number;
  churchName: string;
  forwarded: number;
  received: number;
  difference: number;
  status: string;
}

export type Role =
  "sysadmin" | "president" | "secretary" | "treasurer" | "auditor" | "pastor" | "member";

export const ROLES = [
  "sysadmin",
  "president",
  "secretary",
  "treasurer",
  "auditor",
  "pastor",
  "member",
] as const;

export const PERMISSIONS: Record<string, Role[]> = {
  "org:manage": ["sysadmin"],
  "org:read": ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor", "member"],
  "members:write": ["sysadmin", "secretary", "pastor"],
  "members:read": [
    "sysadmin",
    "president",
    "secretary",
    "treasurer",
    "auditor",
    "pastor",
    "member",
  ],
  "finance:write": ["sysadmin", "treasurer"],
  "finance:read": ["sysadmin", "president", "secretary", "treasurer", "auditor", "pastor"],
  "audit:read": ["sysadmin", "auditor", "president"],
  "users:invite": ["sysadmin", "secretary"],
  "attendance:write": ["sysadmin", "secretary", "pastor"],
  "attendance:read": [
    "sysadmin",
    "president",
    "secretary",
    "treasurer",
    "auditor",
    "pastor",
    "member",
  ],
};
