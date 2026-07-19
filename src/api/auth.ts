import { Hono } from 'hono';
import { hashPassword, signJwt, verifyPassword, generateToken } from '../lib/crypto';
import { sendEmail } from '../lib/email';
import type { Env, AuthPayload } from '../types';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const env = c.env;

  const member = await env.DB.prepare(
    'SELECT id, tenant_id, email, password_hash, role, organization_id, email_verified FROM members WHERE email = ?'
  )
    .bind(email)
    .first<{
      id: string;
      tenant_id: string;
      email: string;
      password_hash: string;
      role: string;
      organization_id: string;
      email_verified: boolean;
    }>();

  if (!member) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (!member.email_verified) {
    return c.json({ error: 'Email not verified. Please check your email for the verification link.' }, 403);
  }

  const isValid = await verifyPassword(password, member.password_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const payload: AuthPayload = {
    userId: member.id,
    tenantId: member.tenant_id,
    role: member.role as AuthPayload['role'],
    organizationId: member.organization_id,
  };

  const token = await signJwt(payload as unknown as Record<string, unknown>, env.JWT_SECRET);

  return c.json({ token });
});

authRoutes.post('/logout', async (c) => {
  return c.json({ message: 'Logged out successfully' });
});

authRoutes.post('/register', async (c) => {
  const env = c.env;
  const { email, password, first_name, last_name, tenant_id, organization_id } = await c.req.json();

  if (!email || !password || !first_name || !last_name || !tenant_id || !organization_id) {
    return c.json({ error: 'All fields are required: email, password, first_name, last_name, tenant_id, organization_id' }, 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM members WHERE email = ?')
    .bind(email)
    .first<{ id: string }>();

  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO members (id, tenant_id, organization_id, first_name, last_name, email, password_hash, role, verification_token, email_verified, membership_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  )
    .bind(id, tenant_id, organization_id, first_name, last_name, email, passwordHash, 'clerk', verificationToken, false, now, now)
    .run();

  if (env.EMAIL) {
    const fromName = env.EMAIL_FROM_NAME || 'Theobase';
    const fromAddress = env.EMAIL_FROM_ADDRESS || 'noreply@theobase.org';
    const verifyLink = `https://theobase.org/auth/verify-email?token=${verificationToken}`;

    await sendEmail(env.EMAIL, email, fromName, fromAddress,
      'Verify your Theobase account',
      `<p>Welcome, ${first_name}!</p><p>Click <a href="${verifyLink}">here</a> to verify your email address.</p>`,
      `Welcome, ${first_name}! Visit this link to verify your email: ${verifyLink}`
    ).catch(() => {});
  }

  return c.json({ id, email, message: 'Registration successful. Please check your email to verify your account.' }, 201);
});

authRoutes.get('/verify-email', async (c) => {
  const env = c.env;
  const token = c.req.query('token');

  if (!token) {
    return c.json({ error: 'Verification token is required' }, 400);
  }

  const member = await env.DB.prepare(
    'SELECT id FROM members WHERE verification_token = ?'
  )
    .bind(token)
    .first<{ id: string }>();

  if (!member) {
    return c.json({ error: 'Invalid or expired verification token' }, 400);
  }

  await env.DB.prepare(
    'UPDATE members SET email_verified = ?, verification_token = ?, updated_at = ? WHERE id = ?'
  )
    .bind(true, null, new Date().toISOString(), member.id)
    .run();

  return c.json({ message: 'Email verified successfully. You may now log in.' });
});

authRoutes.post('/forgot-password', async (c) => {
  const env = c.env;
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const member = await env.DB.prepare(
    'SELECT id, first_name FROM members WHERE email = ?'
  )
    .bind(email)
    .first<{ id: string; first_name: string }>();

  if (!member) {
    return c.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  const resetToken = generateToken();
  const expires = new Date(Date.now() + 3600000).toISOString();

  await env.DB.prepare(
    'UPDATE members SET reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?'
  )
    .bind(resetToken, expires, new Date().toISOString(), member.id)
    .run();

  if (env.EMAIL) {
    const fromName = env.EMAIL_FROM_NAME || 'Theobase';
    const fromAddress = env.EMAIL_FROM_ADDRESS || 'noreply@theobase.org';
    const resetLink = `https://theobase.org/auth/reset-password?token=${resetToken}`;

    await sendEmail(env.EMAIL, email, fromName, fromAddress,
      'Reset your Theobase password',
      `<p>Hello ${member.first_name},</p><p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      `Hello ${member.first_name}, visit this link to reset your password: ${resetLink}`
    ).catch(() => {});
  }

  return c.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
});

authRoutes.post('/reset-password', async (c) => {
  const env = c.env;
  const { token, password } = await c.req.json();

  if (!token || !password) {
    return c.json({ error: 'Token and new password are required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const member = await env.DB.prepare(
    'SELECT id, reset_token, reset_token_expires FROM members WHERE reset_token = ?'
  )
    .bind(token)
    .first<{ id: string; reset_token: string; reset_token_expires: string }>();

  if (!member) {
    return c.json({ error: 'Invalid or expired reset token' }, 400);
  }

  if (new Date(member.reset_token_expires) < new Date()) {
    return c.json({ error: 'Reset token has expired' }, 400);
  }

  const passwordHash = await hashPassword(password);

  await env.DB.prepare(
    'UPDATE members SET password_hash = ?, reset_token = ?, reset_token_expires = ?, updated_at = ? WHERE id = ?'
  )
    .bind(passwordHash, null, null, new Date().toISOString(), member.id)
    .run();

  return c.json({ message: 'Password reset successfully. You may now log in.' });
});

authRoutes.post('/signup', async (c) => {
  const env = c.env;
  const { church_name, church_type, parent_mission_id, clerk_name, clerk_email } = await c.req.json();

  if (!church_name || !parent_mission_id || !clerk_name || !clerk_email) {
    return c.json({ error: 'church_name, parent_mission_id, clerk_name, and clerk_email are required' }, 400);
  }

  if (!clerk_email.includes('@')) {
    return c.json({ error: 'Invalid email address' }, 400);
  }

  const mission = await env.DB.prepare(
    'SELECT id FROM organizations WHERE id = ? AND type = ?'
  )
    .bind(parent_mission_id, 'mission')
    .first<{ id: string }>();

  if (!mission) {
    return c.json({ error: 'Parent mission not found' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO tenant_signups (id, church_name, church_type, parent_mission_id, clerk_name, clerk_email, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  )
    .bind(id, church_name, church_type || 'local_church', parent_mission_id, clerk_name, clerk_email, now, now)
    .run();

  return c.json({
    id,
    church_name,
    status: 'pending',
    message: 'Signup request submitted. You will receive an email when it is approved or declined.',
  }, 201);
});
