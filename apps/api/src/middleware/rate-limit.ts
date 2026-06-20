import type { MiddlewareHandler } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimiter(limit: number = 10, windowSeconds: number = 60): MiddlewareHandler {
  // Uses in-memory Map per Worker isolate.
  // For distributed rate limiting across Workers, replace with D1-backed counter:
  //   INSERT INTO rate_store (key, count, reset_at) VALUES (?, 1, ?)
  //     ON CONFLICT (key) DO UPDATE SET count = count + 1
  const store = new Map<string, RateLimitEntry>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000).unref?.();

  return async (c, next) => {
    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
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
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    await next();
  };
}

export function authRateLimiter(): MiddlewareHandler {
  return rateLimiter(5, 60);
}
