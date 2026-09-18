import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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

// Append-only audit log. Every mutating action across the app writes
// here (who, what, when, why) — no update/delete path is exposed by
// this schema's query layer, and the DB itself rejects UPDATE/DELETE
// via a trigger (see migrations/0000_*.sql), so this holds even
// against a bug or a direct DB console session.
//
// actorId intentionally has no FK constraint yet: the accounts table
// doesn't exist until the Authentication ticket (#8). It stores the
// future accounts.id once that lands.
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actorId: integer('actor_id').notNull(),
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
