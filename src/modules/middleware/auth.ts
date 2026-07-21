import type { RouterContext } from "../../lib/router";
import { json } from "../../lib/router";
import { verifyToken } from "../../lib/jwt";

export async function authMiddleware(
  ctx: RouterContext,
  next: (ctx: RouterContext) => Promise<Response>,
): Promise<Response> {
  const header = ctx.request.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return json(
      { error: { code: "unauthorized", message: "Authentication required" } },
      401,
    );
  }

  const token = header.slice(7);
  const payload = await verifyToken(token, ctx.jwtSecret);
  if (!payload) {
    return json(
      { error: { code: "invalid_token", message: "Invalid or expired token" } },
      401,
    );
  }

  ctx.user = payload;
  return next(ctx);
}

export function requireAdmin(ctx: RouterContext): Response | null {
  if (ctx.user?.role !== "system-admin") {
    return json(
      { error: { code: "forbidden", message: "Admin access required" } },
      403,
    );
  }
  return null;
}
