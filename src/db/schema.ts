import { sqliteTable, text, integer, real, numeric } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  dasherized_name: text('dasherized_name').notNull().unique(),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  type: text('type', {
    enum: [
      'local_church',
      'district',
      'mission',
      'conference',
      'union',
      'division',
      'general_conference',
    ],
  }).notNull(),
  parent_id: text('parent_id').references((): any => organizations.id),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  service_times: text('service_times'),
  pastor_name: text('pastor_name'),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const fiscalPeriods = sqliteTable('fiscal_periods', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  year: integer('year').notNull(),
  start_month: integer('start_month').notNull(),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
});

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  date_of_birth: text('date_of_birth'),
  gender: text('gender', { enum: ['male', 'female'] }),
  phone: text('phone'),
  address: text('address'),
  email: text('email').unique(),
  password_hash: text('password_hash'),
  email_verified: integer('email_verified', { mode: 'boolean' }).default(false),
  reset_token: text('reset_token'),
  reset_token_expires: text('reset_token_expires'),
  verification_token: text('verification_token'),
  membership_status: text('membership_status', {
    enum: ['active', 'inactive', 'transferred_out', 'deceased', 'removed'],
  }).notNull().default('active'),
  baptism_date: text('baptism_date'),
  profession_of_faith_date: text('profession_of_faith_date'),
  original_join_date: text('original_join_date'),
  role: text('role', {
    enum: [
      'clerk',
      'treasurer',
      'pastor',
      'head_elder',
      'mission_admin',
      'super_admin',
    ],
  }),
  guardian_id: text('guardian_id').references((): any => members.id),
  household_id: text('household_id').references((): any => households.id),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const households = sqliteTable('households', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  head_of_household_id: text('head_of_household_id').references(() => members.id),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const memberTransfers = sqliteTable('member_transfers', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  member_id: text('member_id').notNull().references(() => members.id),
  sending_org_id: text('sending_org_id').notNull().references(() => organizations.id),
  receiving_org_id: text('receiving_org_id').notNull().references(() => organizations.id),
  status: text('status', {
    enum: [
      'pending_sending_approval',
      'pending_receiving_approval',
      'accepted',
      'rejected',
    ],
  }).notNull().default('pending_sending_approval'),
  sending_board_vote_date: text('sending_board_vote_date'),
  receiving_board_vote_date: text('receiving_board_vote_date'),
  initiated_by: text('initiated_by').notNull().references(() => members.id),
  rejection_reason: text('rejection_reason'),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  member_id: text('member_id').references(() => members.id),
  fund_type: text('fund_type', {
    enum: ['tithe', 'offering', 'restricted'],
  }).notNull(),
  offering_sub_category: text('offering_sub_category'),
  amount: real('amount').notNull(),
  transaction_date: text('transaction_date').notNull(),
  notes: text('notes'),
  created_by: text('created_by').references(() => members.id),
  batch_id: text('batch_id'),
  is_synced: integer('is_synced', { mode: 'boolean' }).default(true),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const offeringPlans = sqliteTable('offering_plans', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  local_church_pct: integer('local_church_pct').notNull(),
  district_pct: integer('district_pct').notNull().default(0),
  mission_pct: integer('mission_pct').notNull().default(0),
  conference_pct: integer('conference_pct').notNull().default(0),
  union_pct: integer('union_pct').notNull().default(0),
  division_pct: integer('division_pct').notNull().default(0),
  gc_pct: integer('gc_pct').notNull().default(20),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const fundAllocations = sqliteTable('fund_allocations', {
  id: text('id').primaryKey(),
  transaction_id: text('transaction_id').notNull().references(() => transactions.id),
  destination_org_id: text('destination_org_id').notNull().references(() => organizations.id),
  amount: real('amount').notNull(),
  percentage: integer('percentage'),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
});

export const expenseCategories = sqliteTable('expense_categories', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  code: text('code'),
  parent_id: text('parent_id').references((): any => expenseCategories.id),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
});

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  category_id: text('category_id').references(() => expenseCategories.id),
  amount: real('amount').notNull(),
  payee: text('payee').notNull(),
  expense_date: text('expense_date').notNull(),
  notes: text('notes'),
  created_by: text('created_by').references(() => members.id),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const balances = sqliteTable('balances', {
  id: text('id').primaryKey(),
  organization_id: text('organization_id').notNull().references(() => organizations.id),
  fund_type: text('fund_type', {
    enum: ['tithe', 'offering_local', 'offering_district', 'offering_mission', 'offering_conference', 'offering_union', 'offering_division', 'offering_gc', 'restricted'],
  }).notNull(),
  amount: real('amount').notNull().default(0),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const remittances = sqliteTable('remittances', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  source_org_id: text('source_org_id').notNull().references(() => organizations.id),
  destination_org_id: text('destination_org_id').notNull().references(() => organizations.id),
  period_start: text('period_start').notNull(),
  period_end: text('period_end').notNull(),
  total_amount: real('total_amount').notNull(),
  status: text('status', {
    enum: ['draft', 'submitted', 'confirmed'],
  }).notNull().default('draft'),
  submitted_by: text('submitted_by').references(() => members.id),
  submitted_at: text('submitted_at'),
  confirmed_at: text('confirmed_at'),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
  updated_at: text('updated_at').notNull().default("(datetime('now'))"),
});

export const remittanceItems = sqliteTable('remittance_items', {
  id: text('id').primaryKey(),
  remittance_id: text('remittance_id').notNull().references(() => remittances.id),
  fund_type: text('fund_type').notNull(),
  amount_collected: real('amount_collected').notNull(),
  amount_retained: real('amount_retained').notNull(),
  amount_remitted: real('amount_remitted').notNull(),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
});

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  tenant_id: text('tenant_id').notNull().references(() => tenants.id),
  organization_id: text('organization_id'),
  actor_id: text('actor_id').references(() => members.id),
  action: text('action').notNull(),
  entity_type: text('entity_type').notNull(),
  entity_id: text('entity_id'),
  before_values: text('before_values'),
  after_values: text('after_values'),
  created_at: text('created_at').notNull().default("(datetime('now'))"),
});
