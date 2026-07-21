import { Hono, Context, Next } from 'hono';
import type { Env, AuthPayload } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware, getTenantId } from '../middleware/tenant';
import { sendMonthlyReminders } from '../lib/reminders';
import { sendEmail } from '../lib/email';
import { hashPassword, generateToken } from '../lib/crypto';

type Variables = { auth: AuthPayload; tenantId: string };

export const adminRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', tenantMiddleware);

async function requireAdmin(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const auth = c.get('auth');
  if (auth.role !== 'super_admin' && auth.role !== 'mission_admin') {
    return c.json({ error: 'Access denied: Administrator role required' }, 403);
  }
  await next();
}

adminRoutes.use('*', requireAdmin);

adminRoutes.get('/health', async (c) => {
  const tenantId = getTenantId(c);

  const orgCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM organizations WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const memberCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM members WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const txnCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const txnCountToday = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM transactions
     WHERE tenant_id = ? AND created_at >= datetime('now', '-24 hours')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const recentActivity = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM audit_log
     WHERE tenant_id = ? AND created_at >= datetime('now', '-24 hours')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const activeMembers = await c.env.DB.prepare(
    `SELECT COUNT(DISTINCT user_id) as count FROM audit_log
     WHERE tenant_id = ? AND created_at >= datetime('now', '-7 days')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const errorRate = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM audit_log
     WHERE tenant_id = ? AND action = 'delete' AND created_at >= datetime('now', '-7 days')`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const churchCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM organizations
     WHERE tenant_id = ? AND type = 'local_church'`
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const totalTithe = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE tenant_id = ? AND fund_type = 'tithe'`
  )
    .bind(tenantId)
    .first<{ total: number }>();

  const totalOffering = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE tenant_id = ? AND fund_type = 'offering'`
  )
    .bind(tenantId)
    .first<{ total: number }>();

  const totalRestricted = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE tenant_id = ? AND fund_type = 'restricted'`
  )
    .bind(tenantId)
    .first<{ total: number }>();

  const expenseCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM expenses WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const auditLogCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM audit_log WHERE tenant_id = ?'
  )
    .bind(tenantId)
    .first<{ count: number }>();

  const totalRows = (memberCount?.count || 0) + (txnCount?.count || 0) + (expenseCount?.count || 0) + (auditLogCount?.count || 0);
  const estimatedStorageBytes = totalRows * 500;

  return c.json({
    status: 'ok',
    checked_at: new Date().toISOString(),
    organizations: orgCount?.count || 0,
    churches: churchCount?.count || 0,
    members: memberCount?.count || 0,
    transactions: txnCount?.count || 0,
    transactions_24h: txnCountToday?.count || 0,
    expenses: expenseCount?.count || 0,
    audit_entries: auditLogCount?.count || 0,
    activity_24h: recentActivity?.count || 0,
    active_members_7d: activeMembers?.count || 0,
    error_rate_7d: errorRate?.count || 0,
    storage: {
      total_rows: totalRows,
      estimated_bytes: estimatedStorageBytes,
    },
    totals: {
      tithe: totalTithe?.total || 0,
      offering: totalOffering?.total || 0,
      restricted: totalRestricted?.total || 0,
    },
  });
});

adminRoutes.post('/send-reminders', async (c) => {
  const tenantId = getTenantId(c);

  if (!c.env.EMAIL) {
    return c.json({ error: 'Email binding not configured' }, 503);
  }

  const result = await sendMonthlyReminders(c.env.DB, c.env.EMAIL, c.env, tenantId);
  return c.json({ success: true, ...result });
});

adminRoutes.get('/signups', async (c) => {
  const tenantId = getTenantId(c);
  const status = c.req.query('status') || 'pending';

  const signups = await c.env.DB.prepare(
    'SELECT * FROM tenant_signups WHERE parent_mission_id IN (SELECT id FROM organizations WHERE tenant_id = ?) AND status = ?'
  )
    .bind(tenantId, status)
    .all<{
      id: string;
      church_name: string;
      church_type: string;
      parent_mission_id: string;
      clerk_name: string;
      clerk_email: string;
      status: string;
      decline_reason: string | null;
      created_at: string;
    }>();

  return c.json(signups.results);
});

adminRoutes.post('/signups/:id/approve', async (c) => {
  const tenantId = getTenantId(c);
  const signupId = c.req.param('id');
  const now = new Date().toISOString();

  const signup = await c.env.DB.prepare(
    'SELECT * FROM tenant_signups WHERE id = ? AND status = ?'
  )
    .bind(signupId, 'pending')
    .first<{
      id: string;
      church_name: string;
      church_type: string;
      parent_mission_id: string;
      clerk_name: string;
      clerk_email: string;
    }>();

  if (!signup) {
    return c.json({ error: 'Signup not found or already processed' }, 404);
  }

  const orgId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO organizations (id, tenant_id, name, type, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(orgId, tenantId, signup.church_name, signup.church_type, signup.parent_mission_id, now, now)
    .run();

  const memberId = crypto.randomUUID();
  const tempPassword = generateToken(12);
  const passwordHash = await hashPassword(tempPassword);

  await c.env.DB.prepare(
    `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, email, password_hash, role, email_verified, membership_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  )
    .bind(memberId, tenantId, orgId, signup.clerk_name, '', signup.clerk_email, passwordHash, 'clerk', true, now, now)
    .run();

  await c.env.DB.prepare(
    "UPDATE tenant_signups SET status = 'approved', updated_at = ? WHERE id = ?"
  )
    .bind(now, signupId)
    .run();

  if (c.env.EMAIL) {
    const fromName = c.env.EMAIL_FROM_NAME || 'Theobase';
    const fromAddress = c.env.EMAIL_FROM_ADDRESS || 'noreply@theobase.org';

    await sendEmail(c.env.EMAIL, signup.clerk_email, fromName, fromAddress,
      'Your Theobase signup has been approved!',
      `<p>Dear ${signup.clerk_name},</p><p>Your church "${signup.church_name}" has been approved. You can now log in with your email and the temporary password: <strong>${tempPassword}</strong></p><p>Please change your password after logging in.</p>`,
      `Dear ${signup.clerk_name}, your church "${signup.church_name}" has been approved. Log in at https://theobase.org with your email and temporary password: ${tempPassword}`
    ).catch(() => {});
  }

  return c.json({
    organization_id: orgId,
    member_id: memberId,
    church_name: signup.church_name,
    status: 'approved',
    message: 'Church approved. Clerk account created and confirmation email sent.',
  });
});

adminRoutes.post('/signups/:id/decline', async (c) => {
  const tenantId = getTenantId(c);
  const signupId = c.req.param('id');
  const { reason } = await c.req.json();
  const now = new Date().toISOString();

  const signup = await c.env.DB.prepare(
    'SELECT * FROM tenant_signups WHERE id = ? AND status = ?'
  )
    .bind(signupId, 'pending')
    .first<{
      id: string;
      church_name: string;
      clerk_name: string;
      clerk_email: string;
    }>();

  if (!signup) {
    return c.json({ error: 'Signup not found or already processed' }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE tenant_signups SET status = 'declined', decline_reason = ?, updated_at = ? WHERE id = ?"
  )
    .bind(reason || null, now, signupId)
    .run();

  if (c.env.EMAIL) {
    const fromName = c.env.EMAIL_FROM_NAME || 'Theobase';
    const fromAddress = c.env.EMAIL_FROM_ADDRESS || 'noreply@theobase.org';

    await sendEmail(c.env.EMAIL, signup.clerk_email, fromName, fromAddress,
      'Your Theobase signup has been declined',
      `<p>Dear ${signup.clerk_name},</p><p>Your signup for "${signup.church_name}" has been declined.</p>${reason ? `<p>Reason: ${reason}</p>` : ''}<p>Please contact your Mission administrator for more information.</p>`,
      `Dear ${signup.clerk_name}, your signup for "${signup.church_name}" has been declined.${reason ? ` Reason: ${reason}` : ''}`
    ).catch(() => {});
  }

  return c.json({ status: 'declined', message: 'Signup declined.' });
});
