import { Hono } from 'hono';
import type { Env } from './types';
import { authRoutes } from './api/auth';
import { organizationRoutes } from './api/organizations';
import { transactionRoutes } from './api/transactions';
import { remittanceRoutes } from './api/remittances';
import { balanceRoutes } from './api/balances';
import { memberRoutes } from './api/members';
import { auditRoutes } from './api/audit';
import { dashboardRoutes } from './api/dashboard';
import { reportRoutes } from './api/reports';
import { syncRoutes } from './api/sync';
import { adminRoutes } from './api/admin';
import { sendMonthlyReminders } from './lib/reminders';

const app = new Hono<{ Bindings: Env }>();

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.route('/organizations', organizationRoutes);
app.route('/transactions', transactionRoutes);
app.route('/remittances', remittanceRoutes);
app.route('/balances', balanceRoutes);
app.route('/members', memberRoutes);
app.route('/audit', auditRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/reports', reportRoutes);
app.route('/sync', syncRoutes);
app.route('/admin', adminRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'theobase' });
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(sendMonthlyReminders(env.DB, env.EMAIL, env));
  },
};
