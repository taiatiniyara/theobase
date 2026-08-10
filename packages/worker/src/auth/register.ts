import type { Env } from '../env';
import { signSession } from './jwt';
import { authenticate } from './middleware';

export async function handleChurchRegister(request: Request, env: Env): Promise<Response> {
  const authed = await authenticate(request);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, address, conferenceId } = (await request.json()) as {
    name: string;
    address?: string;
    conferenceId?: string;
  };

  const churchId = crypto.randomUUID();

  const doId = env.CHURCH_DO.idFromName(churchId);
  const stub = env.CHURCH_DO.get(doId);

  const body = JSON.stringify({
    operation: 'church:create',
    payload: { id: churchId, name, address, conferenceId, status: 'active' },
  });
  const doReq = new Request('http://localhost/mutate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: request.headers.get('Authorization') ?? '',
    },
    body,
  });
  await stub.fetch(doReq);

  const sessionToken = await signSession({
    sub: authed.user.sub,
    churchId,
    role: 'clerk',
    tokenVersion: authed.user.tokenVersion,
  });

  return new Response(JSON.stringify({ churchId, name, token: sessionToken }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}
