import { Toucan } from "toucan-js";

export function sentryMiddleware() {
  return async (
    c: { req: { raw: Request }; env: Env },
    next: () => Promise<void>
  ): Promise<void> => {
    const dsn = c.env.SENTRY_DSN;
    if (!dsn) {
      await next();
      return;
    }

    const sentry = new Toucan({
      dsn,
      request: c.req.raw,
      environment: c.env.SENTRY_ENVIRONMENT ?? "production",
    });

    try {
      await next();
    } catch (err) {
      sentry.captureException(err);
      throw err;
    }
  };
}

export function analyticsMiddleware() {
  return async (
    c: { req: { raw: Request; method: string; path: string }; env: Env },
    next: () => Promise<void>
  ): Promise<void> => {
    const start = Date.now();
    await next();
    if (!c.env.ANALYTICS) return;

    try {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [c.req.method, c.req.path, String(Date.now() - start)],
        doubles: [Date.now() - start],
        indexes: [c.req.method],
      });
    } catch {
      // Analytics failure is non-fatal
    }
  };
}
