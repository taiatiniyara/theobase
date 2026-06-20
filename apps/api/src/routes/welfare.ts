import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerWelfareRoutes(app: AppType) {
  const createCaseSchema = z.object({
    personId: z.string().min(1),
    assistanceType: z.enum(["food", "financial", "clothing", "medical", "other"]),
    description: z.string().min(1).max(2000),
    value: z.number().int().optional(),
  });

  const createPantryItemSchema = z.object({
    name: z.string().min(1),
    quantity: z.number().int().min(0),
    unit: z.string().min(1),
  });

  app.post("/welfare/cases", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const congregationId = c.get("congregationId")!;
    const id = generateId();
    await db.insert(schema.welfareCase).values({ id, congregationId, personId: parsed.data.personId, assistanceType: parsed.data.assistanceType, description: parsed.data.description, value: parsed.data.value, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), congregationId, { action: "welfare.case_create", resourceType: "welfare_case", resourceId: id });
    const [r] = await db.select().from(schema.welfareCase).where(eq(schema.welfareCase.id, id));
    return c.json(r, 201);
  });

  app.get("/welfare/cases", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.welfareCase).where(eq(schema.welfareCase.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/pantry/items", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createPantryItemSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.pantryItem).values({ id, congregationId: c.get("congregationId")!, name: parsed.data.name, quantity: parsed.data.quantity, unit: parsed.data.unit, updatedAt: now, createdAt: now });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "pantry.item_create", resourceType: "pantry_item", resourceId: id });
    const [r] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, id));
    return c.json(r, 201);
  });

  app.get("/pantry/items", requireAuth(), loadRoles(), requireRole("clerk", "dorcas_coordinator"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.pantryItem).where(eq(schema.pantryItem.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.patch("/pantry/items/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const parsed = createPantryItemSchema.partial().safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const itemId = c.req.param("id");
    const [existing] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, itemId));
    if (!existing) return c.json({ error: "Not found" }, 404);
    await db.update(schema.pantryItem).set({ ...parsed.data, updatedAt: new Date().toISOString() }).where(eq(schema.pantryItem.id, itemId));
    const [r] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, itemId));
    return c.json(r);
  });

  app.delete("/pantry/items/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk", "dorcas_coordinator"), async (c) => {
    const db = getDb(c);
    const itemId = c.req.param("id");
    const [existing] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, itemId));
    if (!existing) return c.json({ error: "Not found" }, 404);
    await db.delete(schema.pantryItem).where(eq(schema.pantryItem.id, itemId));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "pantry.item_delete", resourceType: "pantry_item", resourceId: itemId });
    return c.json({ ok: true });
  });
}
