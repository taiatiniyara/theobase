import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  organization_name: z.string().min(2, 'Church name is required'),
  organization_type: z.enum(['local_church', 'district']).default('local_church'),
  parent_mission_id: z.string().min(1, 'Parent Mission is required'),
  clerk_first_name: z.string().min(1, 'First name is required'),
  clerk_last_name: z.string().min(1, 'Last name is required'),
  clerk_email: z.string().email('Invalid email address'),
  clerk_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const organizationSchema = z.object({
  name: z.string().min(2),
  type: z.enum([
    'local_church',
    'district',
    'mission',
    'conference',
    'union',
    'division',
    'general_conference',
  ]),
  parent_id: z.string().nullable().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  service_times: z.string().optional(),
  pastor_name: z.string().optional(),
});

export const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().nullable(),
  membership_status: z
    .enum(['active', 'inactive', 'transferred_out', 'deceased', 'removed'])
    .default('active'),
  baptism_date: z.string().optional(),
  profession_of_faith_date: z.string().optional(),
  original_join_date: z.string().optional(),
  household_id: z.string().nullable().optional(),
  guardian_id: z.string().nullable().optional(),
  password: z.string().min(8).optional(),
});

export const transactionSchema = z.object({
  fund_type: z.enum(['tithe', 'offering', 'restricted']),
  offering_sub_category: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  transaction_date: z.string().min(1, 'Date is required'),
  member_id: z.string().nullable().optional(),
  notes: z.string().optional(),
  batch_id: z.string().optional(),
});

export const batchTransactionSchema = z.object({
  transactions: z.array(transactionSchema).min(1, 'At least one transaction is required'),
});

export const expenseSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  payee: z.string().min(1, 'Payee is required'),
  expense_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export const memberTransferSchema = z.object({
  member_id: z.string().min(1),
  receiving_org_id: z.string().min(1),
});

export const householdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
  head_of_household_id: z.string().nullable().optional(),
  member_ids: z.array(z.string()).optional(),
});

export const remittanceSchema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
});

export const offeringPlanSchema = z.object({
  name: z.string().min(1),
  local_church_pct: z.number().int().min(0).max(100),
  district_pct: z.number().int().min(0).max(100).default(0),
  mission_pct: z.number().int().min(0).max(100).default(0),
  conference_pct: z.number().int().min(0).max(100).default(0),
  union_pct: z.number().int().min(0).max(100).default(0),
  division_pct: z.number().int().min(0).max(100).default(0),
  gc_pct: z.number().int().min(0).max(100).default(20),
});

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordChangeSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BatchTransactionInput = z.infer<typeof batchTransactionSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type MemberTransferInput = z.infer<typeof memberTransferSchema>;
export type HouseholdInput = z.infer<typeof householdSchema>;
export type RemittanceInput = z.infer<typeof remittanceSchema>;
export type OfferingPlanInput = z.infer<typeof offeringPlanSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
