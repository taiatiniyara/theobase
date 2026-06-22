import type { MiddlewareHandler } from "hono";

export function correlationId(): MiddlewareHandler {
  return async (c, next) => {
    const id = c.req.header("x-correlation-id") || crypto.randomUUID();
    c.set("correlationId", id);
    c.header("x-correlation-id", id);

    const start = Date.now();
    await next();
    const duration = Date.now() - start;

    const logLine = JSON.stringify({
      correlation_id: id,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

    if (c.res.status >= 400) {
      console.error(logLine);
    } else {
      console.log(logLine);
    }
  };
}
