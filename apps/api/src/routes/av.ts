import type { AppType } from "../types";
import { and, eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getCongregationDO } from "../middleware/get-do";

const avItemSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
});

const createOrderSchema = z.object({
  date: z.string().min(1),
  items: z.array(avItemSchema),
});

export function registerAvRoutes(app: AppType) {
  app.post("/av/order-of-service", requireAuth(), loadRoles(), requireRole("clerk", "av_operator"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const { date, items } = parsed.data;
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

  const slideSchema = z.object({ date: z.string().min(1), slideIndex: z.number().int().min(0) });

  app.post("/av/order-of-service/slide", requireAuth(), loadRoles(), requireRole("av_operator", "clerk"), async (c) => {
    const parsed = slideSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const { date, slideIndex } = parsed.data;

    const doStub = getCongregationDO(c, c.get("congregationId")!);
    if (doStub) await doStub.slideChanged(slideIndex);

    return c.json({ slideIndex, date });
  });
}
