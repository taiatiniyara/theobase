import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerWelfareRoutes(app: AppType) {
  app.post("/welfare/cases", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const { personId, assistanceType, description, value } = await c.req.json();
    const congregationId = c.get("congregationId")!;
    const id = generateId();
    await db.insert(schema.welfareCase).values({ id, congregationId, personId, assistanceType, description, value, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.welfareCase).where(eq(schema.welfareCase.id, id));
    return c.json(r, 201);
  });

  app.get("/welfare/cases", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const rows = await getDb(c).select().from(schema.welfareCase).where(eq(schema.welfareCase.congregationId, c.get("congregationId")!));
    return c.json(rows);
  });

  app.post("/pantry/items", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const { name, quantity, unit } = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.pantryItem).values({ id, congregationId: c.get("congregationId")!, name, quantity, unit, updatedAt: now, createdAt: now });
    const [r] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, id));
    return c.json(r, 201);
  });

  app.get("/pantry/items", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const rows = await getDb(c).select().from(schema.pantryItem).where(eq(schema.pantryItem.congregationId, c.get("congregationId")!));
    return c.json(rows);
  });
}
