import { and, eq } from 'drizzle-orm'
import { createLocalAccount, PIN_PATTERN } from '../auth/accounts'
import { hashSecret } from '../auth/crypto'
import type { Account } from '../auth/middleware'
import type { LocalRole } from '../auth/roles'
import type { AuditContext } from './audit'
import { recordAudit } from './audit'
import type { Database } from './client'
import { accountRemovalRequests, accounts, churches } from './schema'

// Local account management (#18) — Clerk can add/edit accounts at
// their own church freely; removing one is a separate, gated flow
// below (createRemovalRequest etc.), never a direct delete. Only
// treasurer/clerk accounts live at a church — pastor is district-
// scoped and managed by Mission Admin as part of district structure
// (see CONTEXT.md > UI/UX > District management), so this
// deliberately never accepts 'pastor' as a role to create or edit.
const CHURCH_MANAGED_ROLES: LocalRole[] = ['treasurer', 'clerk']

export class LocalAccountNotFoundError extends Error {}
export class LocalAccountAccessError extends Error {}
export class LocalAccountValidationError extends Error {}
export class RemovalRequestNotFoundError extends Error {}
export class RemovalRequestStateError extends Error {}
export class RemovalRequestAccessError extends Error {}

// hasPendingRemovalRequest lets the Clerk's settings tab show "removal
// pending" up front instead of only finding out via a 409 after
// clicking "request removal" again — Clerks don't have any other way
// to see this, since reviewing requests is Pastor-only.
export async function listLocalAccountsForChurch(db: Database, churchId: number) {
  const rows = await db
    .select({
      id: accounts.id,
      displayName: accounts.displayName,
      role: accounts.role,
      phone: accounts.phone,
      active: accounts.active,
      createdAt: accounts.createdAt,
      pendingRemovalRequestId: accountRemovalRequests.id,
    })
    .from(accounts)
    .leftJoin(
      accountRemovalRequests,
      and(eq(accountRemovalRequests.targetAccountId, accounts.id), eq(accountRemovalRequests.status, 'pending')),
    )
    .where(eq(accounts.churchId, churchId))

  return rows.map(({ pendingRemovalRequestId, ...row }) => ({
    ...row,
    hasPendingRemovalRequest: pendingRemovalRequestId !== null,
  }))
}

export interface CreateLocalAccountAtChurchInput {
  displayName: string
  phone: string
  pin: string
  role: LocalRole
}

export async function createLocalAccountAtChurch(
  db: Database,
  clerk: Account,
  input: CreateLocalAccountAtChurchInput,
  ctx: AuditContext,
) {
  if (!CHURCH_MANAGED_ROLES.includes(input.role)) {
    throw new LocalAccountValidationError("role must be 'treasurer' or 'clerk'")
  }
  const existing = await db.query.accounts.findFirst({ where: eq(accounts.phone, input.phone) })
  if (existing) {
    throw new LocalAccountValidationError('That phone number is already in use')
  }
  return createLocalAccount(
    db,
    { displayName: input.displayName, phone: input.phone, pin: input.pin, role: input.role, churchId: clerk.churchId as number },
    ctx.actorId,
  )
}

export interface EditLocalAccountInput {
  displayName?: string
  phone?: string
  pin?: string
}

async function assertManagedByClerk(db: Database, clerk: Account, targetAccountId: number) {
  const target = await db.query.accounts.findFirst({ where: eq(accounts.id, targetAccountId) })
  if (!target) {
    throw new LocalAccountNotFoundError('No such account')
  }
  if (target.churchId !== clerk.churchId) {
    throw new LocalAccountAccessError("This account is not at the Clerk's own church")
  }
  return target
}

// Edits are unrestricted beyond "same church" — see CONTEXT.md: "Clerk
// can add or edit accounts at their church freely." A PIN reset is
// included here (not a separate feature) since credential recovery is
// squarely "account management," and this app has no self-service
// PIN-recovery path (no SMS/OTP dependency by design) — without an
// admin-side reset, a locked-out account would have no way back in.
export async function editLocalAccount(
  db: Database,
  clerk: Account,
  targetAccountId: number,
  input: EditLocalAccountInput,
  ctx: AuditContext,
) {
  const target = await assertManagedByClerk(db, clerk, targetAccountId)

  const changed: string[] = []
  const values: { displayName?: string; phone?: string; pinHash?: string; failedLoginAttempts?: number; lockedUntil?: null } = {}

  if (input.displayName !== undefined) {
    values.displayName = input.displayName
    changed.push('displayName')
  }
  if (input.phone !== undefined && input.phone !== target.phone) {
    const existing = await db.query.accounts.findFirst({ where: eq(accounts.phone, input.phone) })
    if (existing) {
      throw new LocalAccountValidationError('That phone number is already in use')
    }
    values.phone = input.phone
    changed.push('phone')
  }
  if (input.pin !== undefined) {
    if (!PIN_PATTERN.test(input.pin)) {
      throw new LocalAccountValidationError('PIN must be 4-8 digits')
    }
    values.pinHash = await hashSecret(input.pin)
    // A fresh PIN should actually work immediately, not still be
    // locked out from wrong guesses against the old one.
    values.failedLoginAttempts = 0
    values.lockedUntil = null
    changed.push('pin')
  }

  if (changed.length === 0) {
    return target
  }

  const [updated] = await db.update(accounts).set(values).where(eq(accounts.id, targetAccountId)).returning()
  await recordAudit(db, 'account', targetAccountId, 'edit', { ...ctx, metadata: { changed } })
  return updated
}

// First half of the Pastor removal sign-off flow (#18) — async, unlike
// dual sign-off: the Clerk submits this, and a District Pastor reviews
// it later on their own login. The target stays fully active in the
// meantime (see approveRemovalRequest/rejectRemovalRequest) — nothing
// here changes that.
export async function createRemovalRequest(
  db: Database,
  clerk: Account,
  targetAccountId: number,
  ctx: AuditContext,
) {
  const target = await assertManagedByClerk(db, clerk, targetAccountId)
  if (!CHURCH_MANAGED_ROLES.includes(target.role as LocalRole)) {
    throw new LocalAccountValidationError('Only treasurer/clerk accounts can be requested for removal')
  }
  if (!target.active) {
    throw new RemovalRequestStateError('This account has already been removed')
  }
  const existingPending = await db.query.accountRemovalRequests.findFirst({
    where: and(eq(accountRemovalRequests.targetAccountId, targetAccountId), eq(accountRemovalRequests.status, 'pending')),
  })
  if (existingPending) {
    throw new RemovalRequestStateError('A removal request is already pending for this account')
  }

  const [request] = await db
    .insert(accountRemovalRequests)
    .values({ targetAccountId, requestedByAccountId: clerk.id })
    .returning()
  await recordAudit(db, 'account_removal_request', request.id, 'request', {
    ...ctx,
    metadata: { targetAccountId },
  })
  return request
}

// District-wide, not per-church — see CONTEXT.md > District-level
// roles: a Pastor's oversight (and this sign-off authority) covers
// every church in their district, not just one.
export function listPendingRemovalRequestsForDistrict(db: Database, districtId: number) {
  return db
    .select({
      id: accountRemovalRequests.id,
      targetAccountId: accountRemovalRequests.targetAccountId,
      targetDisplayName: accounts.displayName,
      targetRole: accounts.role,
      churchId: churches.id,
      churchName: churches.name,
      requestedByAccountId: accountRemovalRequests.requestedByAccountId,
      createdAt: accountRemovalRequests.createdAt,
    })
    .from(accountRemovalRequests)
    .innerJoin(accounts, eq(accounts.id, accountRemovalRequests.targetAccountId))
    .innerJoin(churches, eq(churches.id, accounts.churchId))
    .where(and(eq(churches.districtId, districtId), eq(accountRemovalRequests.status, 'pending')))
}

async function loadRequestForDistrictPastor(db: Database, pastor: Account, requestId: number) {
  const request = await db.query.accountRemovalRequests.findFirst({
    where: eq(accountRemovalRequests.id, requestId),
  })
  if (!request) {
    throw new RemovalRequestNotFoundError('No such removal request')
  }
  const target = await db.query.accounts.findFirst({ where: eq(accounts.id, request.targetAccountId) })
  const church = target ? await db.query.churches.findFirst({ where: eq(churches.id, target.churchId as number) }) : null
  if (!church || church.districtId !== pastor.districtId) {
    throw new RemovalRequestAccessError("This request is not in the Pastor's district")
  }
  if (request.status !== 'pending') {
    throw new RemovalRequestStateError(`This request has already been ${request.status}`)
  }
  return { request, target: target! }
}

export async function approveRemovalRequest(
  db: Database,
  pastor: Account,
  requestId: number,
  ctx: AuditContext,
) {
  const { target } = await loadRequestForDistrictPastor(db, pastor, requestId)

  const [updated] = await db
    .update(accountRemovalRequests)
    .set({ status: 'approved', reviewedByAccountId: pastor.id, reviewedAt: new Date().toISOString() })
    .where(eq(accountRemovalRequests.id, requestId))
    .returning()
  await db.update(accounts).set({ active: false }).where(eq(accounts.id, target.id))

  await recordAudit(db, 'account_removal_request', requestId, 'approve', {
    ...ctx,
    metadata: { targetAccountId: target.id },
  })
  await recordAudit(db, 'account', target.id, 'deactivate', {
    ...ctx,
    metadata: { removalRequestId: requestId },
  })

  return updated
}

export async function rejectRemovalRequest(
  db: Database,
  pastor: Account,
  requestId: number,
  reason: string,
  ctx: AuditContext,
) {
  const { target } = await loadRequestForDistrictPastor(db, pastor, requestId)

  const [updated] = await db
    .update(accountRemovalRequests)
    .set({
      status: 'rejected',
      reviewedByAccountId: pastor.id,
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
    })
    .where(eq(accountRemovalRequests.id, requestId))
    .returning()

  await recordAudit(db, 'account_removal_request', requestId, 'reject', {
    ...ctx,
    reason,
    metadata: { targetAccountId: target.id },
  })

  return updated
}
