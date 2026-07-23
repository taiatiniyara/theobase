import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  memberId: integer("member_id"),
  conferenceId: integer("conference_id"),
  role: text("role").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpires: text("reset_token_expires"),
  active: integer("active").default(1),
  createdAt: text("created_at").default("(datetime('now'))"),
});
