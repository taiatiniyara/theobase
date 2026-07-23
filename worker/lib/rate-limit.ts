interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const AUTH_LIMIT: RateLimitConfig = { maxRequests: 5, windowMs: 60_000 };

export async function checkRateLimitAsync(
  request: Request,
  env: Env,
  key: string,
  config: RateLimitConfig = AUTH_LIMIT
): Promise<Response | null> {
  if (!env.DB) return null;

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown";
  const rateKey = `${key}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    await env.DB.prepare("DELETE FROM rate_limits WHERE key = ? AND window_start < ?")
      .bind(rateKey, windowStart)
      .run();

    const result = await env.DB.prepare(
      "INSERT OR REPLACE INTO rate_limits (key, window_start, count) VALUES (?, ?, COALESCE((SELECT count FROM rate_limits WHERE key = ? AND window_start > ?), 0) + 1) RETURNING count"
    )
      .bind(rateKey, now, rateKey, windowStart)
      .first<{ count: number }>();

    if (result && result.count > config.maxRequests) {
      return new Response(
        JSON.stringify({
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Please wait before retrying.",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(config.windowMs / 1000)),
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  } catch {
    return null;
  }

  return null;
}
