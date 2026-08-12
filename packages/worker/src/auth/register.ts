import type { Env } from '../env';
import { signMagicLink } from './jwt';
import { MAGIC_LINK_EXPIRY_MS } from '@theobase/shared';
import type { Role } from '@theobase/shared';

async function hashForKV(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function handleChurchRegister(request: Request, env: Env): Promise<Response> {
  const { name, address, email } = (await request.json()) as {
    name: string;
    address?: string;
    email?: string;
  };

  if (!name) {
    return new Response(JSON.stringify({ error: 'Church name is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const churchId = crypto.randomUUID();

  const doId = env.CHURCH_DO.idFromName(churchId);
  const stub = env.CHURCH_DO.get(doId);

  const body = JSON.stringify({
    operation: 'church:create',
    payload: { id: churchId, name, address, status: 'active' },
  });
  await stub.fetch(
    new Request('http://localhost/mutate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }),
  );

  if (env.AUTH_EMAIL && email) {
    const token = await signMagicLink({
      sub: email,
      churchId,
      role: 'clerk' as Role,
      tokenVersion: 1,
      unitId: null,
      isSuperAdmin: false,
    });

    if (env.theobase_auth) {
      const tokenHash = await hashForKV(token);
      await env.theobase_auth.put(`token:${tokenHash}`, 'valid', {
        expirationTtl: MAGIC_LINK_EXPIRY_MS / 1000,
      });
    }

    const loginUrl = `${env.APP_URL}/auth/verify?token=${token}`;
    await env.AUTH_EMAIL.send({
      from: 'Theobase <noreply@theobase.app>',
      to: email,
      subject: `Welcome to ${name} on Theobase`,
      text: `Your church has been created. Click this link to sign in as clerk: ${loginUrl}\n\nThis link expires in 10 minutes.`,
      html: `<p>Your church <strong>${name}</strong> has been created on Theobase.</p><p><a href="${loginUrl}">Click here to sign in as clerk</a>.</p><p>This link expires in 10 minutes.</p>`,
    });
  }

  return new Response(JSON.stringify({ churchId, name }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
