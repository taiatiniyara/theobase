import type { AppType } from "../types";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";

export function registerAuditRoutes(app: AppType) {
  app.get("/audit", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const limit = Math.min(Number(c.req.query("limit") || "100"), 500);
    const offset = Number(c.req.query("offset") || "0");

    const rows = await c.env.DB
      .prepare(
        "SELECT al.id, al.action, al.resource_type, al.resource_id, al.details, al.created_at, p.first_name || ' ' || p.last_name as actor_name FROM audit_log al JOIN person p ON al.actor_id = p.id WHERE al.congregation_id = ? ORDER BY al.created_at DESC LIMIT ? OFFSET ?"
      )
      .bind(congregationId, limit, offset)
      .all();

    return c.json(rows.results ?? []);
  });
}
