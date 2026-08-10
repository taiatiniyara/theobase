import { APP_NAME } from '@theobase/shared';
import { ChurchDO } from './church-do';
import type { Env } from './env';

export { ChurchDO };
export type { Env };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const churchMatch = path.match(/^\/church\/([^/]+)(\/.*)?$/);
    if (churchMatch) {
      const churchId = churchMatch[1]!;
      const doPath = churchMatch[2] ?? '/';

      const doId = env.CHURCH_DO.idFromName(churchId);
      const stub = env.CHURCH_DO.get(doId);

      const doUrl = new URL(doPath, request.url);
      const doRequest = new Request(doUrl, request);
      return stub.fetch(doRequest);
    }

    return new Response(`Hello from ${APP_NAME} Worker!`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
} satisfies ExportedHandler<Env>;
