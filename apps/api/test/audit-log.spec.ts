import { env } from 'cloudflare:test'
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { getDb } from '../src/db/client'
import { createMission } from '../src/db/queries'
import { auditLog } from '../src/db/schema'

// audit_log rows can't be cleaned up between tests (it's append-only —
// see the immutability tests below), and storage is shared across
// tests within this file, so every assertion here scopes to the
// specific mission.id it just created rather than assuming a fresh
// table.
function entriesFor(db: ReturnType<typeof getDb>, entityId: number) {
  return db
    .select()
    .from(auditLog)
    .where(and(eq(auditLog.entityType, 'mission'), eq(auditLog.entityId, entityId)))
}

describe('audit log', () => {
  it('records actor, entity, action and timestamp on create', async () => {
    const db = getDb(env.DB)
    const mission = await createMission(db, 'Fiji Mission', { actorId: 42 })

    const rows = await entriesFor(db, mission.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      actorId: 42,
      entityType: 'mission',
      entityId: mission.id,
      action: 'create',
    })
    expect(rows[0].createdAt).toBeTruthy()
  })

  it('captures reason and metadata when provided', async () => {
    const db = getDb(env.DB)
    const mission = await createMission(db, 'Fiji Mission', {
      actorId: 1,
      reason: 'initial onboarding',
      metadata: { source: 'seed' },
    })

    const [row] = await entriesFor(db, mission.id)
    expect(row.reason).toBe('initial onboarding')
    expect(JSON.parse(row.metadata as string)).toEqual({ source: 'seed' })
  })

  it('rejects UPDATE at the database level, not just by convention', async () => {
    const db = getDb(env.DB)
    const mission = await createMission(db, 'Fiji Mission', { actorId: 1 })

    await expect(
      env.DB.prepare("UPDATE audit_log SET reason = 'tampered' WHERE entity_id = ?")
        .bind(mission.id)
        .run(),
    ).rejects.toThrow(/append-only/)
  })

  it('rejects DELETE at the database level, not just by convention', async () => {
    const db = getDb(env.DB)
    const mission = await createMission(db, 'Fiji Mission', { actorId: 1 })

    await expect(
      env.DB.prepare('DELETE FROM audit_log WHERE entity_id = ?').bind(mission.id).run(),
    ).rejects.toThrow(/append-only/)
  })
})
