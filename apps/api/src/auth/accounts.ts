import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { accounts, auditLog } from '../db/schema'
import { hashSecret } from './crypto'

// Internal account-creation helpers only — deliberately not exposed
// as an HTTP endpoint. Who is allowed to create which kind of account
// (Clerk adding a local-church account, Mission Admin adding Mission
// staff, the platform-operator onboarding a Mission) is an
// authorization question owned by later tickets (#9, #18, #21); this
// ticket only builds the login mechanism itself.

export interface CreateLocalAccountInput {
  displayName: string
  phone: string
  pin: string
  churchId?: number
  districtId?: number
}

export interface CreateInstitutionalAccountInput {
  displayName: string
  email: string
  password: string
  missionId?: number
}

const PIN_PATTERN = /^\d{4,8}$/

// actorId is optional because the very first account ever created
// (the platform-operator bootstrapping themselves — see #21) has no
// pre-existing account to act as its creator. audit_log.actor_id is
// NOT NULL with a real FK (no exception carved out for "system"
// actions), so that first row is self-referential: the new account is
// recorded as its own actor, distinguishable by the 'create_self_provisioned'
// action rather than 'create'. Every other call passes a real actorId.
export async function createLocalAccount(
  db: Database,
  input: CreateLocalAccountInput,
  actorId?: number,
) {
  if (!PIN_PATTERN.test(input.pin)) {
    throw new Error('PIN must be 4-8 digits')
  }
  const pinHash = await hashSecret(input.pin)
  const [account] = await db
    .insert(accounts)
    .values({
      displayName: input.displayName,
      accountType: 'local',
      phone: input.phone,
      pinHash,
      churchId: input.churchId ?? null,
      districtId: input.districtId ?? null,
    })
    .returning()
  await db.insert(auditLog).values({
    actorId: actorId ?? account.id,
    entityType: 'account',
    entityId: account.id,
    action: actorId ? 'create' : 'create_self_provisioned',
  })
  return account
}

const PASSWORD_MIN_LENGTH = 8

// actorId optional for the same bootstrap reason as createLocalAccount
// above.
export async function createInstitutionalAccount(
  db: Database,
  input: CreateInstitutionalAccountInput,
  actorId?: number,
) {
  if (input.password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }
  const passwordHash = await hashSecret(input.password)
  const [account] = await db
    .insert(accounts)
    .values({
      displayName: input.displayName,
      accountType: 'institutional',
      email: input.email,
      passwordHash,
      missionId: input.missionId ?? null,
    })
    .returning()
  await db.insert(auditLog).values({
    actorId: actorId ?? account.id,
    entityType: 'account',
    entityId: account.id,
    action: actorId ? 'create' : 'create_self_provisioned',
  })
  return account
}

export function findAccountByPhone(db: Database, phone: string) {
  return db.query.accounts.findFirst({ where: eq(accounts.phone, phone) })
}

export function findAccountByEmail(db: Database, email: string) {
  return db.query.accounts.findFirst({ where: eq(accounts.email, email) })
}

export function findAccountById(db: Database, id: number) {
  return db.query.accounts.findFirst({ where: eq(accounts.id, id) })
}
