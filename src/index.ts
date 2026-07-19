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
import { householdRoutes } from './api/households';
import { transferRoutes } from './api/transfers';
import { expenseRoutes } from './api/expenses';
import { sendMonthlyReminders } from './lib/reminders';
import { serveStatic, serveStyles, serveAppJs, serveSwJs } from './frontend/serve';

const app = new Hono<{ Bindings: Env }>();

// Static PWA assets
app.get('/app', (c) => serveStatic('/app')!);
app.get('/app.js', (c) => serveAppJs());
app.get('/styles.css', (c) => serveStyles());
app.get('/sw.js', (c) => serveSwJs());
app.get('/manifest.json', (c) => serveStatic('/manifest.json')!);

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
app.route('/households', householdRoutes);
app.route('/transfers', transferRoutes);
app.route('/expenses', expenseRoutes);

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
