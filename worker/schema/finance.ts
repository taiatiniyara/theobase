import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const funds = sqliteTable("funds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  forwardingRule: text("forwarding_rule").notNull(),
  conferenceId: integer("conference_id").notNull(),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const expenseCategories = sqliteTable("expense_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  conferenceId: integer("conference_id").notNull(),
  active: integer("active").default(1),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const offeringBatches = sqliteTable("offering_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  churchId: integer("church_id").notNull(),
  sabbathDate: text("sabbath_date").notNull(),
  confirmedBy1: integer("confirmed_by_1"),
  confirmedAt1: text("confirmed_at_1"),
  confirmedBy2: integer("confirmed_by_2"),
  confirmedAt2: text("confirmed_at_2"),
  submittedBy: integer("submitted_by"),
  submittedAt: text("submitted_at"),
  status: text("status").default("pending"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  churchId: integer("church_id").notNull(),
  fundId: integer("fund_id").notNull(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  categoryId: integer("category_id"),
  budgetRef: integer("budget_ref"),
  batchId: integer("batch_id"),
  createdBy: integer("created_by").notNull(),
  createdAt: text("created_at").default("(datetime('now'))"),
  confirmedBy: integer("confirmed_by"),
  confirmedAt: text("confirmed_at"),
  uuid: text("uuid").notNull().unique(),
  envelopeNumber: integer("envelope_number"),
  memberId: integer("member_id"),
  proxyForMemberId: integer("proxy_for_member_id"),
  verified: integer("verified").default(0),
  verifiedBy: integer("verified_by"),
  verifiedAt: text("verified_at"),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  churchId: integer("church_id").notNull(),
  fundId: integer("fund_id").notNull(),
  categoryId: integer("category_id").notNull(),
  plannedAmount: real("planned_amount").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  approved: integer("approved").default(0),
  approvedBy: integer("approved_by"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const budgetTemplates = sqliteTable("budget_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conferenceId: integer("conference_id").notNull(),
  categoryId: integer("category_id").notNull(),
  fundId: integer("fund_id").notNull(),
  plannedAmount: real("planned_amount").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  createdAt: text("created_at").default("(datetime('now'))"),
});
