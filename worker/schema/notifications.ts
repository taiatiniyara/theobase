import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipientUserId: integer("recipient_user_id").notNull(),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  message: text("message").notNull(),
  read: integer("read").default(0),
  createdAt: text("created_at").default("(datetime('now'))"),
});
