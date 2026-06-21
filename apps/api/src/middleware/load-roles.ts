import type { MiddlewareHandler } from "hono";
import type { Bindings, Variables } from "../types";

export function loadRoles(): MiddlewareHandler<{ Bindings: Bindings; Variables: Variables }> {
  return async (c, next) => {
    const userId = c.get("userId");
    const congregationId = c.get("congregationId");
    if (!userId || !congregationId) {
      c.set("userRoles", []);
      return await next();
    }

    try {
      const db = c.env.DB;

      const userResult = await db
        .prepare("SELECT person_id FROM user WHERE id = ?")
        .bind(userId)
        .first<{ person_id: string | null }>();

      if (!userResult?.person_id) {
        c.set("userRoles", []);
        return await next();
      }

      const roleResult = await db
        .prepare("SELECT role_type FROM role WHERE person_id = ? AND congregation_id = ?")
        .bind(userResult.person_id, congregationId)
        .all<{ role_type: string }>();

      c.set("userRoles", (roleResult.results || []).map((r) => r.role_type));
    } catch {
      c.set("userRoles", []);
    }

    await next();
  };
}
