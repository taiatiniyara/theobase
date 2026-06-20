import type { AppType } from "../types";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";

export interface AuditEntry {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
}

export async function recordAudit(
  db: ReturnType<typeof drizzle>,
  userId: string,
  congregationId: string,
  entry: AuditEntry
) {
  const userRow = await db
    .select({ personId: schema.user.personId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  const actorId = userRow[0]?.personId;
  if (!actorId) return;

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await db.insert(schema.auditLog).values({
    id,
    congregationId,
    actorId,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId ?? null,
    details: entry.details ?? null,
    createdAt,
  });
}

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
