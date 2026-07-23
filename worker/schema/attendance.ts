import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const attendance = sqliteTable(
  "attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    churchId: integer("church_id").notNull(),
    date: text("date").notNull(),
    count: integer("count").notNull(),
    category: text("category").notNull(),
    createdBy: integer("created_by").notNull(),
    createdAt: text("created_at").default("(datetime('now'))"),
    updatedAt: text("updated_at").default("(datetime('now'))"),
  },
  (table) => ({
    unq: unique("unq_attendance_church_date_category").on(
      table.churchId,
      table.date,
      table.category
    ),
  })
);

export const memberAttendance = sqliteTable(
  "member_attendance",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    attendanceId: integer("attendance_id").notNull(),
    memberId: integer("member_id").notNull(),
    createdAt: text("created_at").default("(datetime('now'))"),
  },
  (table) => ({
    unq: unique("unq_member_attendance").on(table.attendanceId, table.memberId),
  })
);
