import { Hono } from 'hono';
import type { Env, AuthPayload, MemberTransfer, TransferStatus } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { permissionMiddleware } from '../middleware/permission';
import { writeAuditLog } from '../lib/audit';

type Variables = { auth: AuthPayload; tenantId: string };

export const transferRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

transferRoutes.use('*', authMiddleware);
transferRoutes.use('*', tenantMiddleware);
transferRoutes.use('*', permissionMiddleware);

transferRoutes.post('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const { member_id, receiving_org_id } = await c.req.json();

  if (!member_id || !receiving_org_id) {
    return c.json({ error: 'member_id and receiving_org_id are required' }, 400);
  }

  const member = await c.env.DB.prepare(
    'SELECT id, organization_id FROM members WHERE id = ? AND tenant_id = ?'
  )
    .bind(member_id, tenantId)
    .first<{ id: string; organization_id: string }>();

  if (!member) {
    return c.json({ error: 'Member not found' }, 404);
  }

  if (member.organization_id === receiving_org_id) {
    return c.json({ error: 'Member is already in this organization' }, 400);
  }

  const receivingOrg = await c.env.DB.prepare(
    'SELECT id FROM organizations WHERE id = ? AND tenant_id = ?'
  )
    .bind(receiving_org_id, tenantId)
    .first<{ id: string }>();

  if (!receivingOrg) {
    return c.json({ error: 'Receiving organization not found' }, 404);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    `INSERT INTO member_transfers (id, tenant_id, member_id, sending_org_id, receiving_org_id, status, initiated_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, tenantId, member_id, member.organization_id, receiving_org_id, 'pending_sending_approval', auth.userId, now, now)
    .run();

  const transfer = await c.env.DB.prepare('SELECT * FROM member_transfers WHERE id = ?')
    .bind(id)
    .first<MemberTransfer>();

  if (transfer) {
    await writeAuditLog(c.env.DB, {
      tenantId,
      entityType: 'transfer',
      entityId: id,
      action: 'create',
      userId: auth.userId,
      afterValues: { member_id, sending_org_id: member.organization_id, receiving_org_id, status: 'pending_sending_approval' },
    });
  }

  return c.json(transfer, 201);
});

transferRoutes.get('/', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const status = c.req.query('status') as TransferStatus | undefined;

  let query = 'SELECT * FROM member_transfers WHERE tenant_id = ? AND (sending_org_id = ? OR receiving_org_id = ?)';
  const params: any[] = [tenantId, auth.organizationId, auth.organizationId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const transfers = await c.env.DB.prepare(query)
    .bind(...params)
    .all<MemberTransfer>();

  return c.json(transfers.results);
});

transferRoutes.post('/:id/approve-sending', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const transferId = c.req.param('id');
  const now = new Date().toISOString();

  const transfer = await c.env.DB.prepare(
    'SELECT * FROM member_transfers WHERE id = ? AND tenant_id = ? AND status = ?'
  )
    .bind(transferId, tenantId, 'pending_sending_approval')
    .first<MemberTransfer>();

  if (!transfer) {
    return c.json({ error: 'Transfer not found or already processed' }, 404);
  }

  if (transfer.sending_org_id !== auth.organizationId) {
    return c.json({ error: 'Only the sending church can approve sending' }, 403);
  }

  await c.env.DB.prepare(
    'UPDATE member_transfers SET status = ?, sending_board_vote_date = ?, updated_at = ? WHERE id = ?'
  )
    .bind('pending_receiving_approval', now, now, transferId)
    .run();

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'transfer',
    entityId: transferId,
    action: 'update',
    userId: auth.userId,
    beforeValues: { status: 'pending_sending_approval' },
    afterValues: { status: 'pending_receiving_approval', sending_board_vote_date: now },
  });

  return c.json({ transfer_id: transferId, status: 'pending_receiving_approval' });
});

transferRoutes.post('/:id/accept', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const transferId = c.req.param('id');
  const now = new Date().toISOString();

  const transfer = await c.env.DB.prepare(
    'SELECT * FROM member_transfers WHERE id = ? AND tenant_id = ? AND status = ?'
  )
    .bind(transferId, tenantId, 'pending_receiving_approval')
    .first<MemberTransfer>();

  if (!transfer) {
    return c.json({ error: 'Transfer not found or already processed' }, 404);
  }

  if (transfer.receiving_org_id !== auth.organizationId) {
    return c.json({ error: 'Only the receiving church can accept the transfer' }, 403);
  }

  await c.env.DB.prepare(
    'UPDATE member_transfers SET status = ?, receiving_board_vote_date = ?, updated_at = ? WHERE id = ?'
  )
    .bind('accepted', now, now, transferId)
    .run();

  await c.env.DB.prepare(
    'UPDATE members SET membership_status = ?, organization_id = ?, updated_at = ? WHERE id = ?'
  )
    .bind('active', transfer.receiving_org_id, now, transfer.member_id)
    .run();

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'transfer',
    entityId: transferId,
    action: 'update',
    userId: auth.userId,
    beforeValues: { status: 'pending_receiving_approval' },
    afterValues: { status: 'accepted', receiving_board_vote_date: now },
  });

  return c.json({ transfer_id: transferId, status: 'accepted', member_id: transfer.member_id, new_organization_id: transfer.receiving_org_id });
});

transferRoutes.post('/:id/reject', async (c) => {
  const auth = c.get('auth');
  const tenantId = getTenantId(c);
  const transferId = c.req.param('id');
  const { reason } = await c.req.json();
  const now = new Date().toISOString();

  const transfer = await c.env.DB.prepare(
    'SELECT * FROM member_transfers WHERE id = ? AND tenant_id = ?'
  )
    .bind(transferId, tenantId)
    .first<MemberTransfer>();

  if (!transfer) {
    return c.json({ error: 'Transfer not found' }, 404);
  }

  if (transfer.receiving_org_id !== auth.organizationId && transfer.sending_org_id !== auth.organizationId) {
    return c.json({ error: 'Only sending or receiving church can reject' }, 403);
  }

  await c.env.DB.prepare(
    'UPDATE member_transfers SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?'
  )
    .bind('rejected', reason || null, now, transferId)
    .run();

  await writeAuditLog(c.env.DB, {
    tenantId,
    entityType: 'transfer',
    entityId: transferId,
    action: 'update',
    userId: auth.userId,
    beforeValues: { status: transfer.status },
    afterValues: { status: 'rejected' },
  });

  return c.json({ transfer_id: transferId, status: 'rejected' });
});
