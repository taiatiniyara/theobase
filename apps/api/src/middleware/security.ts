import type { MiddlewareHandler } from "hono";

export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' wss://api.theobase.net; font-src 'self' https://fonts.gstatic.com"
    );
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = ["/auth/", "/health", "/billing/webhook"];

export function csrfProtection(): MiddlewareHandler {
  return async (c, next) => {
    if (SAFE_METHODS.has(c.req.method)) {
      await next();
      return;
    }

    if (CSRF_EXEMPT_PATHS.some((p) => c.req.path.startsWith(p))) {
      await next();
      return;
    }

    const origin = c.req.header("Origin");
    const referer = c.req.header("Referer");

    const appUrl = c.env.APP_URL || "https://theobase.app";
    const isDev =
      c.env.APP_URL === "" || new URL(appUrl).hostname === "localhost";
    const localDev = ["http://localhost:5173", "http://localhost:8787"];
    const allowedOrigins = isDev ? localDev : [appUrl];

    const requestOrigin = origin || (referer ? new URL(referer).origin : null);

    if (
      !requestOrigin ||
      !allowedOrigins.some((allowed) => requestOrigin === allowed)
    ) {
      return c.json({ error: "Cross-site request rejected" }, 403);
    }

    await next();
  };
}
