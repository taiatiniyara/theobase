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
import { importKeysFromEnv } from './auth/jwt';
import { handleParseCsv } from './auth/csv';
import { handlePlacementRequest } from './org/placement';
import { handleOrgTree } from './org/tree';
import { authenticate, requireChurchId } from './auth/middleware';
import type { Env } from './env';

export { ChurchDO };
export type { Env };

export default {
  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const { runRestoreDrill } = await import('./restore-drill');
    await runRestoreDrill(env);
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    await importKeysFromEnv(env);

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

    try {
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

    if (path === '/placement/request' && request.method === 'POST') {
      return cors(await handlePlacementRequest(request, env));
    }

    if (path === '/org/tree' && request.method === 'GET') {
      return cors(await handleOrgTree(request, env));
    }

    if (path === '/church/seed-demo' && request.method === 'POST') {
      const { seedDemoChurch } = await import('./demo-seed');
      const churchId = await seedDemoChurch(env);
      return cors(new Response(JSON.stringify({ churchId, message: 'Demo church seeded successfully' }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (path === '/op/seed' && request.method === 'POST') {
      const seedToken = env.SEED_TOKEN || '';
      if (!seedToken || request.headers.get('Authorization') !== `Bearer ${seedToken}`) {
        return cors(new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { 'Content-Type': 'application/json' },
        }));
      }
      const { seedOrgHierarchy } = await import('./org-seed');
      const result = await seedOrgHierarchy(env);
      return cors(new Response(JSON.stringify(result), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (path.startsWith('/op/purge/') && request.method === 'POST') {
      const seedToken = env.SEED_TOKEN || '';
      const authHeader = request.headers.get('Authorization');
      const isSeed = seedToken && authHeader === `Bearer ${seedToken}`;
      if (!isSeed) {
        const authed = await authenticate(request, env);
        if (!authed?.user.isSuperAdmin) {
          return cors(new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401, headers: { 'Content-Type': 'application/json' },
          }));
        }
      }
      const churchId = path.slice('/op/purge/'.length);
      const doId = env.CHURCH_DO.idFromName(churchId);
      const stub = env.CHURCH_DO.get(doId);
      const resp = await stub.fetch(new Request('http://localhost/purge', {
        method: 'POST',
        headers: { Authorization: authHeader ?? '' },
      }));
      return cors(new Response(resp.body, {
        status: resp.status,
        headers: Object.fromEntries(resp.headers.entries()),
      }));
    }

    if (path === '/observability/error' && request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      console.error('[Obs] Error:', body.severity, body.message);
      return cors(new Response(JSON.stringify({ ok: true }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (path === '/observability/sync-health' && request.method === 'POST') {
      const body = await request.json() as Record<string, unknown>;
      console.log('[Obs] Sync Health:', body.churchId, 'depth:', body.queueDepth);
      return cors(new Response(JSON.stringify({ ok: true }), {
        status: 201, headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (path === '/observability/restore-drill' && request.method === 'POST') {
      const { runRestoreDrill } = await import('./restore-drill');
      const result = await runRestoreDrill(env);
      return cors(new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    }

    if (path === '/observability/restore-drill' && request.method === 'GET') {
      const state = await env.CHURCH_DO.idFromName('drill-check').toString();
      return cors(new Response(JSON.stringify({ drill: 'status', state }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      }));
    }

    const churchMatch = path.match(/^\/church\/([^/]+)(\/.*)?$/);
    if (churchMatch) {
      const churchId = churchMatch[1]!;
      const doPath = churchMatch[2] ?? '/';

      const authed = await authenticate(request, env);
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
      const doResp = await stub.fetch(doRequest);
      return cors(new Response(doResp.body, {
        status: doResp.status,
        headers: Object.fromEntries(doResp.headers.entries()),
      }));
    }

    return new Response(`Hello from ${APP_NAME} Worker!`, {
      headers: { 'Content-Type': 'text/plain' },
    });
    } catch (err) {
      console.error('[Worker] Unhandled error:', err);
      return cors(new Response(JSON.stringify({
        error: err instanceof Error ? err.message : 'Internal server error',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
  },
} satisfies ExportedHandler<Env>;
