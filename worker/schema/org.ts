import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const conferences = sqliteTable("conferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  parentUnionId: integer("parent_union_id"),
  address: text("address"),
  bankDetails: text("bank_details"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const districts = sqliteTable("districts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  conferenceId: integer("conference_id").notNull(),
  pastorUserId: integer("pastor_user_id"),
  createdAt: text("created_at").default("(datetime('now'))"),
});

export const churches = sqliteTable("churches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(),
  parentId: integer("parent_id").notNull(),
  parentType: text("parent_type").notNull(),
  districtId: integer("district_id"),
  address: text("address"),
  bankDetails: text("bank_details"),
  charterStatus: text("charter_status"),
  foundedDate: text("founded_date"),
  createdAt: text("created_at").default("(datetime('now'))"),
});
