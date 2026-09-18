import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Org hierarchy: Mission -> District -> Church. District is a
// first-class level (not a Mission->Church shortcut) — see
// CONTEXT.md > Data model notes / District-level roles.

export const missions = sqliteTable('missions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
})

export const districts = sqliteTable('districts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  missionId: integer('mission_id')
    .notNull()
    .references(() => missions.id),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
})

export const churches = sqliteTable('churches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  districtId: integer('district_id')
    .notNull()
    .references(() => districts.id),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
})

// Per-person accounts, two kinds sharing one table and one session
// model (see auth/session.ts) — see CONTEXT.md > Architecture / UI-UX
// > Mission-level staff/CFO role:
//  - 'local': Clerk/Treasurer/Pastor — phone + self-set PIN, no
//    SMS/OTP dependency for routine login.
//  - 'institutional': Mission Admin/Staff/platform-operator — email +
//    password. That constraint doesn't apply to office users.
// The CHECK below keeps exactly the right credential columns
// populated for each type at the DB level, not just in app code.
// churchId/districtId/missionId are nullable org-scope pointers; the
// Role & permission model ticket (#9) interprets them per role
// (platform-operator has none set).
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    displayName: text('display_name').notNull(),
    accountType: text('account_type', { enum: ['local', 'institutional'] }).notNull(),

    phone: text('phone').unique(),
    pinHash: text('pin_hash'),

    email: text('email').unique(),
    passwordHash: text('password_hash'),

    churchId: integer('church_id').references(() => churches.id),
    districtId: integer('district_id').references(() => districts.id),
    missionId: integer('mission_id').references(() => missions.id),

    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: text('locked_until'),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    check(
      'accounts_credentials_match_type',
      sql`
        (${table.accountType} = 'local'
          AND ${table.phone} IS NOT NULL AND ${table.pinHash} IS NOT NULL
          AND ${table.email} IS NULL AND ${table.passwordHash} IS NULL)
        OR
        (${table.accountType} = 'institutional'
          AND ${table.email} IS NOT NULL AND ${table.passwordHash} IS NOT NULL
          AND ${table.phone} IS NULL AND ${table.pinHash} IS NULL)
      `,
    ),
  ],
)

// Session id is a random opaque token, held in a signed httpOnly
// cookie (signing prevents tampering with which session id is sent;
// server-side storage here — rather than a fully stateless signed
// JWT — is what makes a session revocable, e.g. once a "log out other
// devices" or forced-logout feature exists).
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  expiresAt: text('expires_at').notNull(),
})

// Append-only audit log. Every mutating action across the app writes
// here (who, what, when, why) — no update/delete path is exposed by
// this schema's query layer, and the DB itself rejects UPDATE/DELETE
// via a trigger (see migrations/0001_*.sql), so this holds even
// against a bug or a direct DB console session.
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorId: integer('actor_id')
    .notNull()
    .references(() => accounts.id),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  action: text('action').notNull(),
  reason: text('reason'),
  // JSON-encoded context (e.g. before/after values). D1/SQLite has no
  // native JSON column type, so this is stored as text.
  metadata: text('metadata'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
})
