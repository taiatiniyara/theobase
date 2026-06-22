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
  if (!actorId) {
    console.error(
      JSON.stringify({
        message: "audit: skipping — user has no linked person record",
        userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

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
