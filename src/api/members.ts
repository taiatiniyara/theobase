import { Hono } from 'hono';
import type { Env, AuthPayload, GivingHistory, FundType, Member, MembershipStatus, MemberRole } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { writeAuditLog } from '../lib/audit';

type Variables = { auth: AuthPayload; tenantId: string };

export const memberRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

memberRoutes.use('*', authMiddleware);
memberRoutes.use('*', tenantMiddleware);
memberRoutes.use('*', permissionMiddleware);

const MEMBER_PUBLIC_FIELDS = [
  'id', 'tenant_id', 'organization_id', 'first_name', 'last_name',
  'date_of_birth', 'gender', 'phone', 'address', 'email',
  'email_verified', 'membership_status', 'baptism_date',
  'profession_of_faith_date', 'original_join_date', 'role',
  'guardian_id', 'household_id', 'created_at', 'updated_at',
];

const MEMBER_BASIC_FIELDS = [
  'id', 'first_name', 'last_name', 'email', 'phone',
  'membership_status', 'role', 'household_id', 'created_at',
];

async function canManageMember(
  db: D1Database,
  auth: AuthPayload
): Promise<{ allowed: boolean; reason?: string }> {
  const allowedRoles: MemberRole[] = ['clerk', 'treasurer', 'pastor', 'mission_admin', 'super_admin'];
  if (!allowedRoles.includes(auth.role)) {
    return { allowed: false, reason: 'Permission denied' };
  }
  return { allowed: true };
}

// List members for the org with search and filters
memberRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const search = c.req.query('search');
  const status = c.req.query('status') as MembershipStatus | undefined;

  let query = `SELECT ${MEMBER_BASIC_FIELDS.join(', ')} FROM members WHERE tenant_id = ? AND organization_id = ?`;
  const params: any[] = [tenantId, auth.organizationId];

  if (status) {
    query += ' AND membership_status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    const likeSearch = `%${search}%`;
    params.push(likeSearch, likeSearch, likeSearch);
  }

  query += ' ORDER BY last_name, first_name';

  const result = await c.env.DB.prepare(query)
    .bind(...params)
    .all<Member>();

  return c.json(result.results);
});

// Get current member's profile
memberRoutes.get('/me', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);

  const member = await c.env.DB.prepare(
    `SELECT ${MEMBER_PUBLIC_FIELDS.join(', ')} FROM members WHERE id = ? AND tenant_id = ?`
  )
    .bind(auth.userId, tenantId)
    .first<Omit<Member, 'password_hash' | 'reset_token' | 'reset_token_expires' | 'verification_token'>>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json(member);
});

// Get current member's own giving history
memberRoutes.get('/me/giving-history', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = auth.userId;

  const transactions = await c.env.DB.prepare(
    `SELECT fund_type, amount, transaction_date
     FROM transactions
     WHERE tenant_id = ? AND member_id = ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, memberId)
    .all<{ fund_type: FundType; amount: number; transaction_date: string }>();

  const historyMap = new Map<string, GivingHistory>();

  for (const txn of transactions.results) {
    const year = new Date(txn.transaction_date).getFullYear();
    const key = `${year}-${txn.fund_type}`;

    const existing = historyMap.get(key);
    if (existing) {
      existing.total += txn.amount;
      existing.transaction_count += 1;
    } else {
      historyMap.set(key, {
        member_id: memberId,
        member_name: '',
        year,
        fund_type: txn.fund_type,
        total: txn.amount,
        transaction_count: 1,
      });
    }
  }

  return c.json(Array.from(historyMap.values()));
});

// Get giving history for a member
memberRoutes.get('/:id/giving-history', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('id');

  const member = await c.env.DB.prepare(
    'SELECT organization_id, first_name, last_name FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(memberId, tenantId)
    .first<{ organization_id: string; first_name: string; last_name: string }>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  if (auth.userId !== memberId && auth.organizationId !== member.organization_id) {
    return c.json({ error: 'Permission denied' }, 403);
  }

  const transactions = await c.env.DB.prepare(
    `SELECT fund_type, amount, transaction_date
     FROM transactions
     WHERE tenant_id = ? AND member_id = ?
     ORDER BY transaction_date DESC`
  )
    .bind(tenantId, memberId)
    .all<{ fund_type: FundType; amount: number; transaction_date: string }>();

  const memberName = [member.first_name, member.last_name].filter(Boolean).join(' ');
  const historyMap = new Map<string, GivingHistory>();

  for (const txn of transactions.results) {
    const year = new Date(txn.transaction_date).getFullYear();
    const key = `${year}-${txn.fund_type}`;

    const existing = historyMap.get(key);
    if (existing) {
      existing.total += txn.amount;
      existing.transaction_count += 1;
    } else {
      historyMap.set(key, {
        member_id: memberId,
        member_name: memberName,
        year,
        fund_type: txn.fund_type,
        total: txn.amount,
        transaction_count: 1,
      });
    }
  }

  return c.json(Array.from(historyMap.values()));
});

// Create a new member (clerk-managed, no login credentials)
memberRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { first_name, last_name, date_of_birth, gender, phone, address, email, baptism_date, profession_of_faith_date, original_join_date } = await c.req.json();

  if (!first_name || !last_name) {
    return c.json({ error: 'first_name and last_name are required' }, 400);
  }

  const canManage = await canManageMember(c.env.DB, auth);
  if (!canManage.allowed) {
    return c.json({ error: canManage.reason }, 403);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, date_of_birth, gender, phone, address, email, membership_status, baptism_date, profession_of_faith_date, original_join_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
  )
    .bind(id, tenantId, auth.organizationId, first_name, last_name,
      date_of_birth || null, gender || null, phone || null, address || null, email || null,
      baptism_date || null, profession_of_faith_date || null, original_join_date || null, now, now)
    .run();

  const member = await c.env.DB.prepare(
    `SELECT ${MEMBER_PUBLIC_FIELDS.join(', ')} FROM members WHERE id = ? AND tenant_id = ?`
  )
    .bind(id, tenantId)
    .first<Omit<Member, 'password_hash' | 'reset_token' | 'reset_token_expires' | 'verification_token'>>();

  if (member) {
    await writeAuditLog(c.env.DB, {
      tenantId,
      entityType: 'member',
      entityId: id,
      action: 'create',
      userId: auth.userId,
      afterValues: { first_name, last_name, organization_id: auth.organizationId },
    });
  }

  return c.json(member, 201);
});

// Get a member by ID
memberRoutes.get('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('id');

  const member = await c.env.DB.prepare(
    `SELECT ${MEMBER_PUBLIC_FIELDS.join(', ')} FROM members WHERE id = ? AND tenant_id = ?`
  )
    .bind(memberId, tenantId)
    .first<Omit<Member, 'password_hash' | 'reset_token' | 'reset_token_expires' | 'verification_token'>>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  return c.json(member);
});

// Update a member
memberRoutes.put('/:id', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('id');
  const updates = await c.req.json();

  const canManage = await canManageMember(c.env.DB, auth);
  if (!canManage.allowed) {
    return c.json({ error: canManage.reason }, 403);
  }

  const existing = await c.env.DB.prepare(
    `SELECT ${MEMBER_PUBLIC_FIELDS.join(', ')} FROM members WHERE id = ? AND tenant_id = ?`
  )
    .bind(memberId, tenantId)
    .first<Omit<Member, 'password_hash' | 'reset_token' | 'reset_token_expires' | 'verification_token'>>();

  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  const now = new Date().toISOString();
  const beforeValues: Record<string, unknown> = {};
  const afterValues: Record<string, unknown> = {};

  const updatableFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address', 'email', 'baptism_date', 'profession_of_faith_date', 'original_join_date'];
  const setPairs: string[] = [];
  const setParams: any[] = [];

  for (const field of updatableFields) {
    if (updates[field] !== undefined) {
      beforeValues[field] = (existing as any)[field];
      afterValues[field] = updates[field];
      setPairs.push(`${field} = ?`);
      setParams.push(updates[field] || null);
    }
  }

  if (setPairs.length === 0) {
    return c.json({ error: 'No valid fields to update' }, 400);
  }

  setPairs.push('updated_at = ?');
  setParams.push(now);
  setParams.push(memberId, tenantId);

  await c.env.DB.prepare(
    `UPDATE members SET ${setPairs.join(', ')} WHERE id = ? AND tenant_id = ?`
  )
    .bind(...setParams)
    .run();

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'member',
    entityId: memberId,
    action: 'update',
    userId: auth.userId,
    beforeValues,
    afterValues,
  });

  const updated = await c.env.DB.prepare(
    `SELECT ${MEMBER_PUBLIC_FIELDS.join(', ')} FROM members WHERE id = ? AND tenant_id = ?`
  )
    .bind(memberId, tenantId)
    .first<Omit<Member, 'password_hash' | 'reset_token' | 'reset_token_expires' | 'verification_token'>>();

  return c.json(updated);
});

// Update member status
memberRoutes.put('/:id/status', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const memberId = c.req.param('id');
  const { membership_status } = await c.req.json();

  const validStatuses: MembershipStatus[] = ['active', 'inactive', 'transferred_out', 'deceased', 'removed'];
  if (!validStatuses.includes(membership_status)) {
    return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
  }

  const canManage = await canManageMember(c.env.DB, auth);
  if (!canManage.allowed) {
    return c.json({ error: canManage.reason }, 403);
  }

  const existing = await c.env.DB.prepare(
    'SELECT membership_status FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(memberId, tenantId)
    .first<{ membership_status: string }>();

  if (!existing) {
    return c.json({ error: 'Member not found' }, 404);
  }

  const now = new Date().toISOString();

  await c.env.DB.prepare(
    'UPDATE members SET membership_status = ?, updated_at = ? WHERE id = ? AND tenant_id = ?'
  )
    .bind(membership_status, now, memberId, tenantId)
    .run();

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'member',
    entityId: memberId,
    action: 'update',
    userId: auth.userId,
    beforeValues: { membership_status: existing.membership_status },
    afterValues: { membership_status },
  });

  return c.json({ id: memberId, membership_status, message: `Member status updated to ${membership_status}` });
});
