import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { ROLES } from '../auth/roles'

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
// The CHECKs below keep exactly the right credential columns
// populated for each type, the right role for each type, and the
// right org-scope column for each role — all at the DB level, not
// just in app code (auth/roles.ts's assertValidScope mirrors the
// scope one for a clearer error message, but the constraint here is
// the real guarantee). See auth/roles.ts for what each role means.
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    displayName: text('display_name').notNull(),
    accountType: text('account_type', { enum: ['local', 'institutional'] }).notNull(),
    role: text('role', { enum: ROLES }).notNull(),

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
    check(
      'accounts_role_matches_account_type',
      sql`
        (${table.role} IN ('treasurer', 'clerk', 'pastor') AND ${table.accountType} = 'local')
        OR
        (${table.role} IN ('mission_admin', 'mission_staff', 'platform_operator')
          AND ${table.accountType} = 'institutional')
      `,
    ),
    check(
      'accounts_scope_matches_role',
      sql`
        (${table.role} IN ('treasurer', 'clerk')
          AND ${table.churchId} IS NOT NULL AND ${table.districtId} IS NULL AND ${table.missionId} IS NULL)
        OR
        (${table.role} = 'pastor'
          AND ${table.districtId} IS NOT NULL AND ${table.churchId} IS NULL AND ${table.missionId} IS NULL)
        OR
        (${table.role} IN ('mission_admin', 'mission_staff')
          AND ${table.missionId} IS NOT NULL AND ${table.churchId} IS NULL AND ${table.districtId} IS NULL)
        OR
        (${table.role} = 'platform_operator'
          AND ${table.churchId} IS NULL AND ${table.districtId} IS NULL AND ${table.missionId} IS NULL)
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
