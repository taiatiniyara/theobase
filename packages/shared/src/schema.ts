import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const conference = sqliteTable('conference', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const church = sqliteTable('church', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  conferenceId: text('conference_id')
    .notNull()
    .references(() => conference.id),
  address: text('address'),
  status: text('status', { enum: ['active', 'inactive'] })
    .notNull()
    .default('active'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  tokenVersion: integer('token_version').notNull().default(1),
  mfaEnabled: integer('mfa_enabled', { mode: 'boolean' }).notNull().default(false),
  mfaSecret: text('mfa_secret'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const roleAssignment = sqliteTable('role_assignment', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  churchId: text('church_id')
    .notNull()
    .references(() => church.id),
  role: text('role', {
    enum: [
      'clerk',
      'treasurer',
      'counter',
      'pastor',
      'department-head',
      'board-member',
      'member',
      'interest',
      'visitor',
      'conference-treasurer',
      'conference-secretary',
      'conference-president',
      'auditor',
      'operator',
    ],
  }).notNull(),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const member = sqliteTable('member', {
  id: text('id').primaryKey(),
  churchId: text('church_id')
    .notNull()
    .references(() => church.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  dateOfBirth: text('date_of_birth'),
  gender: text('gender', { enum: ['male', 'female', 'other'] }),
  baptismDate: text('baptism_date'),
  membershipStatus: text('membership_status', {
    enum: [
      'baptised',
      'profession',
      'transfer-in',
      'transfer-out',
      'deceased',
      'removed',
      'reinstated',
    ],
  })
    .notNull()
    .default('baptised'),
  householdId: text('household_id').references(() => household.id),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const household = sqliteTable('household', {
  id: text('id').primaryKey(),
  churchId: text('church_id')
    .notNull()
    .references(() => church.id),
  name: text('name').notNull(),
  address: text('address'),
  primaryContactId: text('primary_contact_id'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const givingBatch = sqliteTable('giving_batch', {
  id: text('id').primaryKey(),
  churchId: text('church_id')
    .notNull()
    .references(() => church.id),
  date: text('date').notNull(),
  status: text('status', {
    enum: ['open', 'counter1-confirmed', 'counter2-confirmed', 'committed'],
  })
    .notNull()
    .default('open'),
  counter1Id: text('counter1_id').references(() => user.id),
  counter2Id: text('counter2_id').references(() => user.id),
  counter1ConfirmedAt: integer('counter1_confirmed_at'),
  counter2ConfirmedAt: integer('counter2_confirmed_at'),
  committedAt: integer('committed_at'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const givingRecord = sqliteTable('giving_record', {
  id: text('id').primaryKey(),
  batchId: text('batch_id')
    .notNull()
    .references(() => givingBatch.id),
  memberId: text('member_id')
    .notNull()
    .references(() => member.id),
  type: text('type', { enum: ['tithe', 'offering'] }).notNull(),
  amount: real('amount').notNull(),
  category: text('category', {
    enum: [
      'sabbath-school',
      'local-church-budget',
      'conference-advance',
      'world-budget',
      'building-fund',
      'adra',
      'other',
    ],
  }),
  paymentMethod: text('payment_method', {
    enum: ['envelope', 'cash', 'cheque', 'electronic'],
  })
    .notNull()
    .default('cash'),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(unixepoch())`),
});

export const errorLog = sqliteTable('error_log', {
  id: text('id').primaryKey(),
  churchId: text('church_id'),
  userId: text('user_id'),
  severity: text('severity', { enum: ['error', 'warn', 'info'] }).notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),
  breadcrumbTrail: text('breadcrumb_trail', { mode: 'json' }).$type<Array<Record<string, unknown>>>(),
  deviceInfo: text('device_info', { mode: 'json' }).$type<Record<string, unknown>>(),
  timestamp: integer('timestamp').notNull(),
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
});

export const syncHealth = sqliteTable('sync_health', {
  id: text('id').primaryKey(),
  churchId: text('church_id').notNull(),
  queueDepth: integer('queue_depth').notNull(),
  lastSyncAt: integer('last_sync_at').notNull(),
  syncSuccessRate: real('sync_success_rate').notNull(),
  doLatencyMs: integer('do_latency_ms').notNull(),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
});
