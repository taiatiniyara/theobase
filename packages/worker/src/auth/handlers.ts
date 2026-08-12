import { signMagicLink, signSession, verify } from './jwt';
import { verifyTotp, generateTotpSecret } from './totp';
import {
  MAGIC_LINK_EXPIRY_MS,
  SESSION_EXPIRY_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ATTEMPTS,
} from '@theobase/shared';
import type { Role } from '@theobase/shared';

interface EmailBinding {
  send(message: EmailMessage): Promise<void>;
}

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

async function hashForKV(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleSendLink(
  request: Request,
  env: { theobase_auth?: KVNamespace; AUTH_EMAIL: EmailBinding; APP_URL: string },
): Promise<Response> {
  if (!env.theobase_auth) return json({ error: 'KV namespace not configured. Create theobase-auth KV and bind it as theobase_auth.' }, 500);
  const { email } = (await request.json()) as { email: string };
  if (!email) return json({ error: 'Email required' }, 400);

  const rateKey = `rate:${email}`;
  const attempts = parseInt((await env.theobase_auth.get(rateKey)) ?? '0');
  if (attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    return json({ error: 'Too many attempts. Try again later.' }, 429);
  }
  await env.theobase_auth.put(rateKey, String(attempts + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_MS / 1000,
  });

  const token = await signMagicLink({
    sub: email,
    churchId: '',
    role: 'member' as Role,
    tokenVersion: 0,
  });

  const tokenHash = await hashForKV(token);
  await env.theobase_auth.put(`token:${tokenHash}`, 'valid', {
    expirationTtl: MAGIC_LINK_EXPIRY_MS / 1000,
  });

  const loginUrl = `${env.APP_URL}/login?token=${token}`;

  await env.AUTH_EMAIL.send({
    from: 'Theobase <noreply@theobase.app>',
    to: email,
    subject: 'Sign in to Theobase',
    text: `Click this link to sign in: ${loginUrl}\n\nThis link expires in 10 minutes.`,
    html: `<p>Click <a href="${loginUrl}">here</a> to sign in to Theobase.</p><p>This link expires in 10 minutes.</p>`,
  });

  return json({ message: 'Check your email for the login link.' });
}

export async function handleVerify(
  request: Request,
  env: { theobase_auth?: KVNamespace },
): Promise<Response> {
  if (!env.theobase_auth) return json({ error: 'KV namespace not configured.' }, 500);
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return json({ error: 'Token required' }, 400);

  const tokenHash = await hashForKV(token);
  const stored = await env.theobase_auth.get(`token:${tokenHash}`);
  if (!stored) return json({ error: 'Invalid or expired token' }, 401);

  await env.theobase_auth.delete(`token:${tokenHash}`);

  const { payload } = await verify(token);
  if (!payload) return json({ error: 'Invalid token' }, 401);

  const sessionToken = await signSession({
    sub: payload.sub,
    churchId: payload.churchId,
    role: payload.role,
    tokenVersion: payload.tokenVersion,
  });

  const response = json(
    {
      token: sessionToken,
      user: {
        id: payload.sub,
        churchId: payload.churchId,
        role: payload.role,
      },
    },
    200,
  );

  response.headers.set(
    'Set-Cookie',
    `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_EXPIRY_MS / 1000}`,
  );

  response.headers.append(
    'Set-Cookie',
    `session_noh=${sessionToken}; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_EXPIRY_MS / 1000}`,
  );

  return response;
}

export async function handleRefresh(request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'No token' }, 401);
  const token = authHeader.slice(7);

  try {
    const { payload } = await verify(token);
    const sessionToken = await signSession({
      sub: payload.sub,
      churchId: payload.churchId,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    });
    return json({ token: sessionToken });
  } catch {
    return json({ error: 'Invalid token' }, 401);
  }
}

export async function handleSetupMfa(request: Request): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'No token' }, 401);
  const token = authHeader.slice(7);

  try {
    const { payload } = await verify(token);
    const secret = generateTotpSecret();

    return json({
      secret,
      uri: `otpauth://totp/Theobase:${payload.sub}?secret=${secret}&issuer=Theobase`,
    });
  } catch {
    return json({ error: 'Invalid token' }, 401);
  }
}

export async function handleVerifyMfa(request: Request, _env: unknown): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'No token' }, 401);
  const token = authHeader.slice(7);

  const { code, secret } = (await request.json()) as { code: string; secret: string };

  const isValid = await verifyTotp(secret, code);
  if (!isValid) return json({ error: 'Invalid MFA code' }, 401);

  try {
    const { payload } = await verify(token);
    const sessionToken = await signSession({
      sub: payload.sub,
      churchId: payload.churchId,
      role: payload.role,
      tokenVersion: payload.tokenVersion + 1,
    });
    return json({ token: sessionToken });
  } catch {
    return json({ error: 'Invalid token' }, 401);
  }
}

export async function handleInvite(
  request: Request,
  env: { AUTH_EMAIL: EmailBinding; APP_URL: string },
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'No token' }, 401);

  try {
    const { email, role, churchId } = (await request.json()) as {
      email: string;
      role: Role;
      churchId: string;
    };

    const inviteUrl = `${env.APP_URL}/auth/accept-invite?email=${encodeURIComponent(email)}&role=${role}&churchId=${churchId}`;

    await env.AUTH_EMAIL.send({
      from: 'Theobase <noreply@theobase.app>',
      to: email,
      subject: `You've been invited as ${role} on Theobase`,
      text: `You've been invited to join Theobase as ${role}. Click here to accept: ${inviteUrl}`,
      html: `<p>You've been invited to join Theobase as <strong>${role}</strong>.</p><p><a href="${inviteUrl}">Accept Invitation</a></p>`,
    });

    return json({ message: 'Invitation sent.' });
  } catch {
    return json({ error: 'Failed to send invite' }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
