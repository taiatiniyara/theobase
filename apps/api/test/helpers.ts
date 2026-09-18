import type { Database } from '../src/db/client'
import { createInstitutionalAccount } from '../src/auth/accounts'

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
  })
  return account.id
}
