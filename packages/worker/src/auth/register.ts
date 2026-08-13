import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { orgUnit, churchExtension, orgAudit } from '@theobase/shared';
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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ADR-0018 §5.4 / ADR-0019 §5: churches self-register against an
// operator-created conference. The form walks Division → Union →
// Conference/Mission and submits the conference unit id as parentId. The
// church is placed in the tree under that unit — no free-form parenting.
export async function handleChurchRegister(request: Request, env: Env): Promise<Response> {
  const { name, address, email, parentId } = (await request.json()) as {
    name: string;
    address?: string;
    email?: string;
    parentId?: string;
  };

  if (!name) {
    return json({ error: 'Church name is required.' }, 400);
  }
  if (!parentId) {
    return json({ error: 'Please select the Conference/Mission for this church.' }, 400);
  }

  if (!env.DB) return json({ error: 'DB binding not configured' }, 500);
  const db = drizzle(env.DB);

  const parent = await db.select().from(orgUnit).where(eq(orgUnit.id, parentId)).get();
  if (!parent) return json({ error: 'Selected Conference/Mission not found.' }, 400);
  if (parent.level !== 'conference') {
    return json({ error: 'Churches can only register under a Conference/Mission.' }, 400);
  }
  // ADR-0019 §4: only an organized (billed) unit may add churches.
  if (parent.status !== 'organized') {
    return json({ error: 'This Conference/Mission is not yet active for new churches.' }, 400);
  }

  const churchId = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await db.insert(orgUnit).values({
    id: churchId,
    parentId: parent.id,
    name,
    level: 'church',
    kind: 'church',
    status: 'organized',
    code: null,
    facets: ['tenant'],
  });

  await db.insert(churchExtension).values({
    id: churchId,
    doClass: 'ChurchDO',
    address: address ?? null,
    status: 'active',
  });

  await db.insert(orgAudit).values({
    id: crypto.randomUUID(),
    actor: email ?? 'anonymous',
    action: 'unit:create',
    unitId: churchId,
    after: { id: churchId, name, address: address ?? null, parentId: parent.id },
    reason: 'Church self-registration',
    timestamp: now,
  });

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

  return json({ churchId, name, parentId: parent.id, parentName: parent.name }, 201);
}
