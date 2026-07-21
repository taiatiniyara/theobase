import type { D1Database } from "@cloudflare/workers-types";

export interface RouterContext {
  db: D1Database;
  jwtSecret: string;
  request: Request;
  params: Record<string, string>;
  user?: { sub: string; orgId: string; orgLevel: string; role: string };
}

type Handler = (ctx: RouterContext) => Response | Promise<Response>;
type Middleware = (
  ctx: RouterContext,
  next: (ctx: RouterContext) => Promise<Response>,
) => Response | Promise<Response>;

interface Route {
  method: string;
  pattern: URLPattern;
  handler: Handler;
  middlewares: Middleware[];
}

const routes: Route[] = [];

export function addRoute(
  method: string,
  pathname: string,
  handler: Handler,
  middlewares: Middleware[] = [],
): void {
  routes.push({
    method: method.toUpperCase(),
    pattern: new URLPattern({ pathname }),
    handler,
    middlewares,
  });
}

export function router(
  request: Request,
  db: D1Database,
  jwtSecret: string,
): Promise<Response> {
  const url = new URL(request.url);

  for (const route of routes) {
    if (route.method !== request.method) continue;
    const match = route.pattern.exec(url);
    if (match) {
      const ctx: RouterContext = {
        db,
        jwtSecret,
        request,
        params: match.pathname.groups as Record<string, string>,
      };

      if (route.middlewares.length === 0) {
        return Promise.resolve(route.handler(ctx));
      }

      let index = 0;
      const next = (currentCtx: RouterContext): Promise<Response> => {
        if (index < route.middlewares.length) {
          const mid = route.middlewares[index]!;
          index++;
          return Promise.resolve(mid(currentCtx, next));
        }
        return Promise.resolve(route.handler(currentCtx));
      };
      return next(ctx);
    }
  }

  return Promise.resolve(
    json({ error: { code: "not_found", message: "Not found" } }, 404),
  );
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
