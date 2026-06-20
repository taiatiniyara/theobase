import type { MiddlewareHandler } from "hono";

export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' wss://api.theobase.net; font-src 'self' https://fonts.gstatic.com");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(): MiddlewareHandler {
  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) {
      await next();
      return;
    }

    const origin = c.req.header("Origin");
    const referer = c.req.header("Referer");

    const appUrl = (c.env as any).APP_URL || "https://theobase.app";
    const apiUrl = (c.env as any).API_URL || "https://api.theobase.net";
    const localDev = ["http://localhost:5173", "http://localhost:8787"];

    const allowedOrigins = [appUrl, apiUrl, ...localDev];

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);

    if (!requestOrigin || !allowedOrigins.some((allowed) => requestOrigin === allowed)) {
      return c.json({ error: "Cross-site request rejected" }, 403);
    }

    await next();
  };
}
