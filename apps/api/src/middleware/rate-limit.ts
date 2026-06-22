import type { MiddlewareHandler } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT_EXEMPT_PATHS = ["/health"];

export function rateLimiter(
  limit: number = 10,
  windowSeconds: number = 60
): MiddlewareHandler {
  const store = new Map<string, RateLimitEntry>();

  return async (c, next) => {
    if (RATE_LIMIT_EXEMPT_PATHS.some((p) => c.req.path === p)) {
      await next();
      return;
    }

    const ip =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For") ||
      "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowSeconds * 1000 };
      store.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > limit) {
      return c.json(
        { error: "Too many requests. Please try again later." },
        429
      );
    }

    await next();
  };
}

export function authRateLimiter(): MiddlewareHandler {
  return rateLimiter(5, 60);
}
