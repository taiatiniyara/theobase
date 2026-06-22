import type { AppType } from "../types";
import { eq, asc, and } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerDistrictRoutes(app: AppType) {
  const createRotationSchema = z.object({
    congregationId: z.string().min(1),
    date: z.string().min(1),
    preacherId: z.string().min(1),
    topic: z.string().optional(),
  });
  const createVisitSchema = z.object({
    householdId: z.string().optional(),
    pastorId: z.string().min(1),
    date: z.string().min(1),
    purpose: z.string().optional(),
    notes: z.string().optional(),
  });
  const districtSchema = z.object({
    name: z.string().min(2).max(200),
    organizationId: z.string().optional(),
  });

  app.post(
    "/district/rotations",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk", "district_pastor"),
    async (c) => {
      const db = getDb(c);
      const parsed = createRotationSchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const id = generateId();
      await db
        .insert(schema.preachingRotation)
        .values({ id, ...parsed.data, createdAt: new Date().toISOString() });
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "rotation.create",
        resourceType: "preaching_rotation",
        resourceId: id,
      });
      const [r] = await db
        .select()
        .from(schema.preachingRotation)
        .where(eq(schema.preachingRotation.id, id));
      return c.json(r, 201);
    }
  );

  app.get(
    "/district/rotations",
    requireAuth(),
    loadRoles(),
    requireRole("clerk", "district_pastor"),
    async (c) => {
      const rows = await getDb(c)
        .select()
        .from(schema.preachingRotation)
        .where(
          eq(schema.preachingRotation.congregationId, c.get("congregationId")!)
        )
        .limit(50);
      return c.json(rows);
    }
  );

  app.delete(
    "/district/rotations/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk", "district_pastor"),
    async (c) => {
      const db = getDb(c);
      const id = c.req.param("id");
      const [existing] = await db
        .select()
        .from(schema.preachingRotation)
        .where(eq(schema.preachingRotation.id, id));
      if (!existing) return c.json({ error: "Not found" }, 404);
      await db
        .delete(schema.preachingRotation)
        .where(eq(schema.preachingRotation.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "rotation.delete",
        resourceType: "preaching_rotation",
        resourceId: id,
      });
      return c.json({ ok: true });
    }
  );

  app.post(
    "/district/visits",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk", "district_pastor"),
    async (c) => {
      const db = getDb(c);
      const parsed = createVisitSchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const id = generateId();
      await db
        .insert(schema.pastoralVisit)
        .values({
          id,
          congregationId: c.get("congregationId")!,
          ...parsed.data,
          createdAt: new Date().toISOString(),
        });
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "visit.create",
        resourceType: "pastoral_visit",
        resourceId: id,
      });
      const [r] = await db
        .select()
        .from(schema.pastoralVisit)
        .where(eq(schema.pastoralVisit.id, id));
      return c.json(r, 201);
    }
  );

  app.get(
    "/district/visits",
    requireAuth(),
    loadRoles(),
    requireRole("clerk", "district_pastor"),
    async (c) => {
      const rows = await getDb(c)
        .select()
        .from(schema.pastoralVisit)
        .where(
          eq(schema.pastoralVisit.congregationId, c.get("congregationId")!)
        )
        .limit(50);
      return c.json(rows);
    }
  );

  app.delete(
    "/district/visits/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk", "district_pastor"),
    async (c) => {
      const db = getDb(c);
      const id = c.req.param("id");
      const [existing] = await db
        .select()
        .from(schema.pastoralVisit)
        .where(eq(schema.pastoralVisit.id, id));
      if (!existing) return c.json({ error: "Not found" }, 404);
      await db
        .delete(schema.pastoralVisit)
        .where(eq(schema.pastoralVisit.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "visit.delete",
        resourceType: "pastoral_visit",
        resourceId: id,
      });
      return c.json({ ok: true });
    }
  );

  app.post("/districts", requireAuth(), async (c) => {
    const db = getDb(c);
    const parsed = districtSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [existing] = await db
      .select({ id: schema.district.id })
      .from(schema.district)
      .where(eq(schema.district.name, parsed.data.name));
    if (existing) {
      return c.json(
        { error: `A district named "${parsed.data.name}" already exists.` },
        409
      );
    }

    const id = generateId();
    await db
      .insert(schema.district)
      .values({ id, ...parsed.data, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId") || "", {
      action: "district.create",
      resourceType: "district",
      resourceId: id,
    });
    const [r] = await db
      .select()
      .from(schema.district)
      .where(eq(schema.district.id, id));
    return c.json(r, 201);
  });

  app.get("/districts", requireAuth(), async (c) => {
    const orgId = c.req.query("organizationId");
    const conditions = orgId ? [eq(schema.district.organizationId, orgId)] : [];
    const rows = await getDb(c)
      .select()
      .from(schema.district)
      .where(and(...conditions))
      .orderBy(asc(schema.district.name));
    return c.json(rows);
  });

  app.patch(
    "/districts/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const parsed = districtSchema.partial().safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const districtId = c.req.param("id");
      await db
        .update(schema.district)
        .set(parsed.data)
        .where(eq(schema.district.id, districtId));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "district.update",
        resourceType: "district",
        resourceId: districtId,
      });
      const [r] = await db
        .select()
        .from(schema.district)
        .where(eq(schema.district.id, districtId));
      return c.json(r);
    }
  );

  app.post(
    "/districts/:id/congregations",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const { congregationId } = await c.req.json<{ congregationId: string }>();
      const id = generateId();
      await db
        .insert(schema.districtCongregation)
        .values({ id, districtId: c.req.param("id"), congregationId });
      await recordAudit(db, c.get("userId"), c.get("congregationId") || "", {
        action: "district.congregation_add",
        resourceType: "district_congregation",
        resourceId: id,
      });
      const [r] = await db
        .select()
        .from(schema.districtCongregation)
        .where(eq(schema.districtCongregation.id, id));
      return c.json(r, 201);
    }
  );

  app.delete(
    "/districts/:id/congregations/:congId",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const districtId = c.req.param("id");
      const congId = c.req.param("congId");
      await db
        .delete(schema.districtCongregation)
        .where(
          and(
            eq(schema.districtCongregation.districtId, districtId),
            eq(schema.districtCongregation.congregationId, congId)
          )
        );
      await recordAudit(db, c.get("userId"), c.get("congregationId") || "", {
        action: "district.congregation_remove",
        resourceType: "district_congregation",
        details: JSON.stringify({ districtId, congregationId: congId }),
      });
      return c.json({ ok: true });
    }
  );
}
