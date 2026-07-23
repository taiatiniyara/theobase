import { sqliteTable, text, integer, real, unique } from "drizzle-orm/sqlite-core";

export const reconciliations = sqliteTable(
  "reconciliations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    churchId: integer("church_id").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    forwardedTithe: real("forwarded_tithe").default(0),
    receivedTithe: real("received_tithe"),
    titheDiscrepancy: real("tithe_discrepancy"),
    titheStatus: text("tithe_status").default("pending"),
    titheNote: text("tithe_note"),
    bankBalance: real("bank_balance"),
    systemBalance: real("system_balance"),
    bankDiscrepancy: real("bank_discrepancy"),
    bankNote: text("bank_note"),
    reconciledBy: integer("reconciled_by"),
    reconciledAt: text("reconciled_at"),
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => ({
    unq: unique("unq_reconciliations_church_year_month").on(
      table.churchId,
      table.year,
      table.month
    ),
  })
);
