import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerTransferRoutes(app: AppType) {
  app.post("/transfers", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { memberId, toCongregationId } = await c.req.json();
    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const id = generateId();
    await db.insert(schema.transferRequest).values({ id, memberId, fromCongregationId: c.get("congregationId")!, toCongregationId, requestedById: user?.personId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.transferRequest).where(eq(schema.transferRequest.id, id));
    return c.json(r, 201);
  });

  app.get("/transfers", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const rows = await getDb(c).select().from(schema.transferRequest).where(eq(schema.transferRequest.fromCongregationId, c.get("congregationId")!));
    return c.json(rows);
  });

  app.patch("/transfers/:id", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const transferId = c.req.param("id");
    const { status } = await c.req.json<{ status: string }>();
    const userId = c.get("userId");

    const [transfer] = await db.select().from(schema.transferRequest).where(eq(schema.transferRequest.id, transferId));
    if (!transfer) return c.json({ error: "Not found" }, 404);

    const validTransitions: Record<string, string[]> = {
      requested: ["approved_by_sending", "rejected"],
      approved_by_sending: ["received_by_destination", "rejected"],
      received_by_destination: ["completed"],
    };

    const allowed = validTransitions[transfer.status] || [];
    if (!allowed.includes(status)) {
      return c.json({ error: `Cannot transition from ${transfer.status} to ${status}` }, 400);
    }

    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const updates: Record<string, any> = { status: status as any };

    if (status === "approved_by_sending" && user?.personId) updates.approvedById = user.personId;
    if (status === "received_by_destination" && user?.personId) updates.receivedById = user.personId;

    await db.update(schema.transferRequest).set(updates).where(eq(schema.transferRequest.id, transferId));
    const [updated] = await db.select().from(schema.transferRequest).where(eq(schema.transferRequest.id, transferId));
    return c.json(updated);
  });
}
