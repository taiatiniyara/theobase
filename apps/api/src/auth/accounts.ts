import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { accounts, auditLog } from '../db/schema'
import { assertValidScope, type InstitutionalRole, type LocalRole } from './roles'
import { generateToken, hashSecret } from './crypto'

// Internal account-creation helpers only — deliberately not exposed
// as an HTTP endpoint. Who is allowed to create which kind of account
// (Clerk adding a local-church account, Mission Admin adding Mission
// staff, the platform-operator onboarding a Mission) is an
// authorization question owned by later tickets (#18, #21); this
// ticket only builds the role/scope model itself.

export interface CreateLocalAccountInput {
  displayName: string
  phone: string
  pin: string
  role: LocalRole
  churchId?: number
  districtId?: number
}

export interface CreateInstitutionalAccountInput {
  displayName: string
  email: string
  password: string
  role: InstitutionalRole
  missionId?: number
}

export const PIN_PATTERN = /^\d{4,8}$/

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
  const churchId = input.churchId ?? null
  const districtId = input.districtId ?? null
  assertValidScope(input.role, { churchId, districtId, missionId: null })

  const pinHash = await hashSecret(input.pin)
  const [account] = await db
    .insert(accounts)
    .values({
      displayName: input.displayName,
      accountType: 'local',
      role: input.role,
      phone: input.phone,
      pinHash,
      churchId,
      districtId,
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
  const missionId = input.missionId ?? null
  assertValidScope(input.role, { churchId: null, districtId: null, missionId })

  const passwordHash = await hashSecret(input.password)
  const [account] = await db
    .insert(accounts)
    .values({
      displayName: input.displayName,
      accountType: 'institutional',
      role: input.role,
      email: input.email,
      passwordHash,
      missionId,
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

// Lazily issues (and returns) the account's local-verifier seed —
// generated once on the first successful PIN verification (full login
// or a co-signer check), stable after that. See the comment on
// accounts.localVerifierSeed in schema.ts for what this is for.
// Deliberately not audit-logged: it's a device-caching mechanism, not
// a domain event a Mission or church needs visibility into.
export async function ensureLocalVerifierSeed(db: Database, accountId: number): Promise<string> {
  const account = await findAccountById(db, accountId)
  if (!account) {
    throw new Error(`No such account: ${accountId}`)
  }
  if (account.localVerifierSeed) {
    return account.localVerifierSeed
  }
  const seed = generateToken()
  await db.update(accounts).set({ localVerifierSeed: seed }).where(eq(accounts.id, accountId))
  return seed
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
