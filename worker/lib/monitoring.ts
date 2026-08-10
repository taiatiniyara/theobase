export function errorLoggingMiddleware() {
  return async (
    c: { req: { raw: Request; method: string; path: string }; env: Env },
    next: () => Promise<void>
  ): Promise<void> => {
    try {
      await next();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? (err.stack ?? null) : null;
      const ua = c.req.raw.headers.get("user-agent") ?? null;

      try {
        await c.env.DB.prepare(
          `INSERT INTO error_logs (path, method, message, stack, user_agent, created_at)
           VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))`
        )
          .bind(c.req.path, c.req.method, message, stack, ua)
          .run();
      } catch {
        // Log failure is non-fatal
      }

      if (c.env.ANALYTICS) {
        try {
          c.env.ANALYTICS.writeDataPoint({
            blobs: ["error", c.req.path, message.slice(0, 128)],
            doubles: [1],
            indexes: ["error"],
          });
        } catch {
          // Analytics failure is non-fatal
        }
      }

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
