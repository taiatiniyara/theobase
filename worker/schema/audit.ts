import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: text("timestamp").default("(datetime('now'))"),
  actorId: integer("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  prevState: text("prev_state"),
  newState: text("new_state"),
  module: text("module").default("core"),
  deviceInfo: text("device_info"),
});
