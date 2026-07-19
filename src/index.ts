import { Hono } from 'hono';
import type { Env } from './types';
import { authRoutes } from './api/auth';
import { organizationRoutes } from './api/organizations';
import { transactionRoutes } from './api/transactions';
import { remittanceRoutes } from './api/remittances';
import { balanceRoutes } from './api/balances';

const app = new Hono<{ Bindings: Env }>();

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.route('/organizations', organizationRoutes);
app.route('/transactions', transactionRoutes);
app.route('/remittances', remittanceRoutes);
app.route('/balances', balanceRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'theobase' });
});

export default app;
