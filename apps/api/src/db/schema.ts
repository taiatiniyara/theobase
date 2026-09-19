import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
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

    // Local-role only (see #23). Server-generated on first successful
    // PIN verification (full login, or a co-signer check for dual
    // sign-off — see auth/routes.ts's /verify-pin), then handed to the
    // device that earned it so it can derive and cache its own offline
    // verifier. Deliberately a separate secret from pinHash: a stolen
    // server dump and a stolen device don't cross-compromise each
    // other, and this can be rotated independently to revoke every
    // device's cached offline-verification capability without forcing
    // a PIN reset.
    localVerifierSeed: text('local_verifier_seed'),

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
    // No CHECK constraint enforcing localVerifierSeed is local-only:
    // adding one here would force drizzle-kit's SQLite table-rebuild
    // strategy (DROP+recreate `accounts`), which fails against D1
    // specifically — D1 wraps migration files in a transaction, and
    // `PRAGMA foreign_keys=OFF` (the standard SQLite recipe for
    // rebuilding a table other tables still reference) is silently
    // ineffective inside a transaction, so the DROP fails with a live
    // FK violation the moment any real session/audit_log/counts row
    // exists (confirmed empirically, not just from docs). The
    // constraint would only prevent an unused, harmless value sitting
    // on an institutional row — low enough stakes that
    // ensureLocalVerifierSeed (the only code path that ever sets this
    // column, and it only ever operates on already-local accounts) is
    // an acceptable, app-level-only substitute here, unlike the
    // higher-stakes constraints elsewhere in this table.
  ],
)

// Each Mission's own master list of fund/offering categories (Calendars
// of Offerings vary by division/union/mission — see CONTEXT.md > Data
// model notes). isTithe distinguishes Tithe from the rest per the
// reference notes (kept separate, remitted up, never used locally) —
// nothing enforces that yet (no money movement through the app at
// all for MVP), it's just a flag later reporting/UI can key off.
//
// No delete path: `active` is how a Mission "removes" a category.
// Once count records (a later ticket) start referencing a category by
// id, hard-deleting the row would either break that FK or silently
// invalidate history — soft-deactivation is what keeps "category
// changes never retroactively alter past count records" true at the
// storage level, not just as an app-level promise.
export const fundCategories = sqliteTable(
  'fund_categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    missionId: integer('mission_id')
      .notNull()
      .references(() => missions.id),
    name: text('name').notNull(),
    isTithe: integer('is_tithe', { mode: 'boolean' }).notNull().default(false),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [uniqueIndex('fund_categories_mission_name_unique').on(table.missionId, table.name)],
)

// Per-church override of a Mission category's applicability.
// Deliberately sparse: a category applies to a church by default (no
// row here) unless a Clerk has explicitly toggled it off (or back on)
// for that church — see fundCategories.ts's
// listActiveFundCategoriesForChurch for the default-enabled join this
// implies. One row per (church, category) pair, upserted on toggle
// rather than accumulating history rows — audit_log is the history.
export const churchFundCategories = sqliteTable(
  'church_fund_categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    churchId: integer('church_id')
      .notNull()
      .references(() => churches.id),
    fundCategoryId: integer('fund_category_id')
      .notNull()
      .references(() => fundCategories.id),
    enabled: integer('enabled', { mode: 'boolean' }).notNull(),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    uniqueIndex('church_fund_categories_church_category_unique').on(
      table.churchId,
      table.fundCategoryId,
    ),
  ],
)

// A Treasurer's weekly count — see CONTEXT.md > Real-world workflow /
// UI-UX > Count-entry form. clientRecordId is a client-generated id
// (a UUID from apps/web's local storage), unique here, so a submission
// retried after a flaky sync (client never saw the response, doesn't
// know if it landed) is idempotent rather than creating a duplicate
// financial record — essential given "no assumption sync happens
// within X days" means retries can be arbitrarily delayed and repeated.
//
// No dual sign-off / reconciliation status here yet — those are #12
// and #14, layered on top later. This ticket is deliberately just
// "the treasurer's numbers, saved reliably," matching its own scope.
export const counts = sqliteTable('counts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientRecordId: text('client_record_id').notNull().unique(),
  churchId: integer('church_id')
    .notNull()
    .references(() => churches.id),
  enteredByAccountId: integer('entered_by_account_id')
    .notNull()
    .references(() => accounts.id),
  sabbathDate: text('sabbath_date').notNull(), // YYYY-MM-DD
  recordedAt: text('recorded_at').notNull(), // client's local entry time, not server insert time
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
})

// One line per fund category amount within a count. fundCategoryId is
// a snapshot reference — categories are never hard-deleted (see
// fundCategories above), so this stays resolvable even after a
// category is later deactivated or a church's toggle changes.
// amountCents is an integer (minor currency unit) to avoid float
// rounding on money; no currency column yet — single-Mission MVP,
// not worth multi-currency infrastructure until it's actually needed.
export const countLines = sqliteTable(
  'count_lines',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    countId: integer('count_id')
      .notNull()
      .references(() => counts.id),
    fundCategoryId: integer('fund_category_id')
      .notNull()
      .references(() => fundCategories.id),
    amountCents: integer('amount_cents').notNull(),
  },
  (table) => [
    uniqueIndex('count_lines_count_category_unique').on(table.countId, table.fundCategoryId),
    check('count_lines_amount_non_negative', sql`${table.amountCents} >= 0`),
  ],
)

// Session id is a random opaque token, held in a signed httpOnly
// cookie (signing prevents tampering with which session id is sent;
// server-side storage here — rather than a fully stateless signed
// JWT — is what makes a session revocable, e.g. once a "log out other
// devices" or forced-logout feature exists).
//
// expiresAt is nullable and, as of #23, always null: a hard expiry
// (the original 30-day TTL) could strand a treasurer mid-offline-
// period with no way back in, contradicting CONTEXT.md's "no
// assumption sync happens within X days." A session still gets
// revoked "opportunistically once connectivity returns" for free —
// getSessionAccount re-fetches the account from D1 on every request
// that actually reaches the Worker, so a server-side lock or removal
// takes effect the moment the device is next online, without this
// column's help. The column stays nullable rather than being dropped
// so a future ticket can reintroduce a real expiry without another
// destructive migration.
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  expiresAt: text('expires_at'),
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
