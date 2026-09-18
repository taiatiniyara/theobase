import { env } from 'cloudflare:test'
import { and, eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { getDb } from '../src/db/client'
import { createMission } from '../src/db/queries'
import { auditLog } from '../src/db/schema'
import { createTestActor } from './helpers'

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
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Fiji Mission', { actorId })

    const rows = await entriesFor(db, mission.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      actorId,
      entityType: 'mission',
      entityId: mission.id,
      action: 'create',
    })
    expect(rows[0].createdAt).toBeTruthy()
  })

  it('captures reason and metadata when provided', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Fiji Mission', {
      actorId,
      reason: 'initial onboarding',
      metadata: { source: 'seed' },
    })

    const [row] = await entriesFor(db, mission.id)
    expect(row.reason).toBe('initial onboarding')
    expect(JSON.parse(row.metadata as string)).toEqual({ source: 'seed' })
  })

  it('rejects UPDATE at the database level, not just by convention', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Fiji Mission', { actorId })

    await expect(
      env.DB.prepare("UPDATE audit_log SET reason = 'tampered' WHERE entity_id = ?")
        .bind(mission.id)
        .run(),
    ).rejects.toThrow(/append-only/)
  })

  it('rejects DELETE at the database level, not just by convention', async () => {
    const db = getDb(env.DB)
    const actorId = await createTestActor(db)
    const mission = await createMission(db, 'Fiji Mission', { actorId })

    await expect(
      env.DB.prepare('DELETE FROM audit_log WHERE entity_id = ?').bind(mission.id).run(),
    ).rejects.toThrow(/append-only/)
  })

  it('rejects an actor_id that does not reference a real account', async () => {
    const db = getDb(env.DB)
    await expect(createMission(db, 'Fiji Mission', { actorId: 999_999 })).rejects.toThrow()
  })
})
