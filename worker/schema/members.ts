import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    churchId: integer("church_id").notNull(),
    householdId: integer("household_id"),
    fullName: text("full_name").notNull(),
    preferredName: text("preferred_name"),
    dob: text("dob"),
    gender: text("gender"),
    baptismDate: text("baptism_date"),
    baptismType: text("baptism_type"),
    joinDate: text("join_date"),
    prevChurchId: integer("prev_church_id"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    maritalStatus: text("marital_status"),
    status: text("status").notNull().default("active"),
    statusDate: text("status_date"),
    createdAt: text("created_at").notNull().default("(datetime('now'))"),
    updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
    version: integer("version").notNull().default(1),
  },
  (table) => ({
    churchIdx: index("idx_members_church").on(table.churchId),
    statusIdx: index("idx_members_status").on(table.status),
  })
);

export const households = sqliteTable("households", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  churchId: integer("church_id").notNull(),
  headMemberId: integer("head_member_id"),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  module: text("module").notNull().default("core"),
});

export const memberPositions = sqliteTable(
  "member_positions",
  {
    memberId: integer("member_id").notNull(),
    positionId: integer("position_id").notNull(),
    startDate: text("start_date").notNull().default("(datetime('now'))"),
    endDate: text("end_date"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.memberId, table.positionId] }),
  })
);

export const transferRequests = sqliteTable("transfer_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull(),
  fromChurchId: integer("from_church_id").notNull(),
  toChurchId: integer("to_church_id").notNull(),
  initiatedBy: integer("initiated_by").notNull(),
  initiatedAt: text("initiated_at").notNull().default("(datetime('now'))"),
  conferenceApprovedBy: integer("conference_approved_by"),
  conferenceApprovedAt: text("conference_approved_at"),
  acceptedBy: integer("accepted_by"),
  acceptedAt: text("accepted_at"),
  status: text("status").notNull().default("pending_conference"),
  rejectionNote: text("rejection_note"),
  expiresAt: text("expires_at"),
  overrideBy: integer("override_by"),
  overrideAt: text("override_at"),
  overrideAction: text("override_action"),
  overrideNote: text("override_note"),
});
