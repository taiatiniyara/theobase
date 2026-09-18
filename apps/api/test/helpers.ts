import { env } from 'cloudflare:test'
import { Hono } from 'hono'
import { createInstitutionalAccount } from '../src/auth/accounts'
import type { AppEnv } from '../src/auth/middleware'
import { createSession, setSessionCookie } from '../src/auth/session'
import type { Database } from '../src/db/client'
import { createChurch, createDistrict, createMission } from '../src/db/queries'

let counter = 0

// Every audit_log row needs a real accounts.id as its actor (FK,
// NOT NULL). Tests that only care about some other entity (a mission,
// a district) just need *an* actor to exist — this creates one
// (self-provisioned, since there's no other actor yet either) with a
// unique email per call so parallel/sequential tests in the same file
// don't collide on the accounts.email unique index.
export async function createTestActor(db: Database) {
  counter += 1
  const account = await createInstitutionalAccount(db, {
    displayName: `Test Actor ${counter}`,
    email: `test-actor-${counter}@example.test`,
    password: 'test-password-not-real',
    role: 'platform_operator',
  })
  return account.id
}

// role-scoped accounts (treasurer/clerk need a churchId, mission_admin/
// mission_staff need a missionId) need a real hierarchy row to point
// at — these build a fresh Mission -> District -> Church chain per
// call so tests don't share (and collide on) org entities.
export async function createTestMission(db: Database) {
  const actorId = await createTestActor(db)
  return createMission(db, `Test Mission ${counter}`, { actorId })
}

export async function createTestChurch(db: Database) {
  const actorId = await createTestActor(db)
  const mission = await createMission(db, `Test Mission ${counter}`, { actorId })
  const district = await createDistrict(db, mission.id, `Test District ${counter}`, { actorId })
  return createChurch(db, district.id, `Test Church ${counter}`, { actorId })
}

// Builds a real signed session cookie via the actual Hono cookie
// helper (against a throwaway context) rather than hand-rolling a fake
// cookie string, so route tests exercise the exact same signing path
// production code uses.
export async function loginAs(db: Database, accountId: number): Promise<string> {
  const session = await createSession(db, accountId)
  const cookieApp = new Hono<AppEnv>()
  let cookieHeader = ''
  cookieApp.get('/set', async (ctx) => {
    await setSessionCookie(ctx, session.id, env.SESSION_SECRET)
    cookieHeader = ctx.res.headers.get('set-cookie')?.split(';')[0] ?? ''
    return ctx.body(null)
  })
  await cookieApp.request('/set', {}, env)
  return cookieHeader
}
