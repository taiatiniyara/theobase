import { APP_NAME } from '@theobase/shared';
import { ChurchDO } from './church-do';
import {
  handleSendLink,
  handleVerify,
  handleRefresh,
  handleSetupMfa,
  handleVerifyMfa,
  handleInvite,
} from './auth/handlers';
import { handleChurchRegister } from './auth/register';
import { handleParseCsv } from './auth/csv';
import { authenticate, requireChurchId } from './auth/middleware';
import type { Env } from './env';

export { ChurchDO };
export type { Env };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': env.APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const cors = (resp: Response) => {
      for (const [k, v] of Object.entries(corsHeaders)) {
        resp.headers.set(k, v);
      }
      return resp;
    };

    if (path === '/auth/send-link') return cors(await handleSendLink(request, env));
    if (path === '/auth/verify') return cors(await handleVerify(request, env));
    if (path === '/auth/refresh') return cors(await handleRefresh(request));
    if (path === '/auth/setup-mfa') return cors(await handleSetupMfa(request));
    if (path === '/auth/verify-mfa') return cors(await handleVerifyMfa(request, env));
    if (path === '/auth/invite') return cors(await handleInvite(request, env));

    if (path === '/church/register' && request.method === 'POST') {
      return cors(await handleChurchRegister(request, env));
    }

    if (path === '/church/parse-csv' && request.method === 'POST') {
      return cors(await handleParseCsv(request));
    }

    const churchMatch = path.match(/^\/church\/([^/]+)(\/.*)?$/);
    if (churchMatch) {
      const churchId = churchMatch[1]!;
      const doPath = churchMatch[2] ?? '/';

      const authed = await authenticate(request);
      if (doPath !== '/state') {
        if (!authed)
          return cors(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
        const user = requireChurchId(authed, churchId);
        if (!user)
          return cors(
            new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }),
          );
      }

      const doId = env.CHURCH_DO.idFromName(churchId);
      const stub = env.CHURCH_DO.get(doId);

      const doUrl = new URL(doPath, request.url);
      const doRequest = new Request(doUrl, request);
      return cors(await stub.fetch(doRequest));
    }

    return new Response(`Hello from ${APP_NAME} Worker!`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
} satisfies ExportedHandler<Env>;
