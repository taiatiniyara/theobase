import { Hono } from 'hono';
import type { Env } from './types';
import { authRoutes } from './api/auth';
import { organizationRoutes } from './api/organizations';

const app = new Hono<{ Bindings: Env }>();

// Public routes
app.route('/auth', authRoutes);

// Protected routes
app.route('/organizations', organizationRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'theobase' });
});

export default app;
