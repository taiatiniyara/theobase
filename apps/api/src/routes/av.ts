import type { AppType } from "../types";
import { and, eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getCongregationDO } from "../middleware/get-do";

export function registerAvRoutes(app: AppType) {
  app.post("/av/order-of-service", requireAuth(), loadRoles(), requireRole("clerk", "av_operator"), async (c) => {
    const db = getDb(c);
    const { date, items } = await c.req.json<{ date: string; items: any[] }>();
    const congregationId = c.get("congregationId")!;
    const now = new Date().toISOString();
    const [existing] = await db.select().from(schema.avOrderOfService).where(and(eq(schema.avOrderOfService.congregationId, congregationId), eq(schema.avOrderOfService.date, date)));
    const id = existing ? existing.id : generateId();
    if (existing) {
      await db.update(schema.avOrderOfService).set({ items: JSON.stringify(items), updatedAt: now }).where(eq(schema.avOrderOfService.id, id));
    } else {
      await db.insert(schema.avOrderOfService).values({ id, congregationId, date, items: JSON.stringify(items), updatedAt: now, createdAt: now });
    }

    const doStub = getCongregationDO(c, congregationId);
    if (doStub) await doStub.orderUpdated(date, items);

    const [r] = await db.select().from(schema.avOrderOfService).where(eq(schema.avOrderOfService.id, id));
    return c.json({ ...r, items: JSON.parse(r.items) }, 201);
  });

  app.get("/av/order-of-service/:date", requireAuth(), loadRoles(), requireRole("clerk", "av_operator", "elder"), async (c) => {
    const db = getDb(c);
    const [r] = await db.select().from(schema.avOrderOfService).where(and(eq(schema.avOrderOfService.congregationId, c.get("congregationId")!), eq(schema.avOrderOfService.date, c.req.param("date"))));
    if (!r) return c.json({ error: "Not found" }, 404);
    return c.json({ ...r, items: JSON.parse(r.items) });
  });
}
