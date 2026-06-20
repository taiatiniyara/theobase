import type { AppType } from "../types";
import { eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

const orgSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["general_conference", "division", "union", "conference"]),
  parentId: z.string().optional(),
});

const orgPatchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
});

export function registerOrganizationRoutes(app: AppType) {
  app.post("/organizations", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = orgSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.organization).values({ id, ...parsed.data, createdAt: now });
    const [r] = await db.select().from(schema.organization).where(eq(schema.organization.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId") || "", { action: "org.create", resourceType: "organization", resourceId: id });
    return c.json(r, 201);
  });

  app.get("/organizations", requireAuth(), async (c) => {
    const rows = await getDb(c).select().from(schema.organization).orderBy(asc(schema.organization.name));
    return c.json(rows);
  });

  app.get("/organizations/:id", requireAuth(), async (c) => {
    const [r] = await getDb(c).select().from(schema.organization).where(eq(schema.organization.id, c.req.param("id")));
    if (!r) return c.json({ error: "Not found" }, 404);
    return c.json(r);
  });

  app.patch("/organizations/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = orgPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    await db.update(schema.organization).set(parsed.data).where(eq(schema.organization.id, c.req.param("id")));
    const [r] = await db.select().from(schema.organization).where(eq(schema.organization.id, c.req.param("id")));
    return c.json(r);
  });

  app.delete("/organizations/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.organization).where(eq(schema.organization.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId") || "", { action: "org.delete", resourceType: "organization", resourceId: id });
    return c.json({ ok: true });
  });

  app.get("/departments", requireAuth(), loadRoles(), async (c) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);
    const rows = await getDb(c).select().from(schema.department).where(eq(schema.department.congregationId, congregationId)).orderBy(asc(schema.department.name));
    return c.json(rows);
  });

  const deptSchema = z.object({ name: z.string().min(2).max(200), type: z.enum(["pathfinders", "adventurers", "sabbath_school", "dorcas", "health", "av", "other"]) });
  app.post("/departments", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = deptSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.department).values({ id, congregationId: c.get("congregationId")!, ...parsed.data, createdAt: now });
    const [r] = await db.select().from(schema.department).where(eq(schema.department.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "dept.create", resourceType: "department", resourceId: id });
    return c.json(r, 201);
  });

  app.patch("/departments/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = deptSchema.partial().safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    await db.update(schema.department).set(parsed.data).where(eq(schema.department.id, c.req.param("id")));
    const [r] = await db.select().from(schema.department).where(eq(schema.department.id, c.req.param("id")));
    return c.json(r);
  });

  app.delete("/departments/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.department).where(eq(schema.department.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "dept.delete", resourceType: "department", resourceId: id });
    return c.json({ ok: true });
  });
}
