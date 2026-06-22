import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

const createPersonSchema = z.object({
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isMember: z.boolean().optional(),
});

const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(200).optional(),
  lastName: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  isMember: z.boolean().optional(),
});

const roleAssignSchema = z.object({
  personId: z.string().min(1),
  congregationId: z.string().min(1),
  roleType: z.string().min(1),
});

export function registerPersonRoutes(app: AppType) {
  app.post(
    "/persons",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const parsed = createPersonSchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

      const congregationId = c.get("congregationId")!;
      const id = generateId();
      const now = new Date().toISOString();
      await db
        .insert(schema.person)
        .values({
          id,
          congregationId,
          ...parsed.data,
          createdAt: now,
          updatedAt: now,
        });
      const [r] = await db
        .select()
        .from(schema.person)
        .where(eq(schema.person.id, id));
      await recordAudit(db, c.get("userId"), congregationId, {
        action: "person.create",
        resourceType: "person",
        resourceId: id,
      });
      return c.json(r, 201);
    }
  );

  app.patch(
    "/persons/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const parsed = updatePersonSchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

      const personId = c.req.param("id");
      const congregationId = c.get("congregationId")!;
      const [existing] = await db
        .select()
        .from(schema.person)
        .where(eq(schema.person.id, personId));
      if (!existing || existing.congregationId !== congregationId)
        return c.json({ error: "Not found" }, 404);

      await db
        .update(schema.person)
        .set({ ...parsed.data, updatedAt: new Date().toISOString() })
        .where(eq(schema.person.id, personId));
      const [r] = await db
        .select()
        .from(schema.person)
        .where(eq(schema.person.id, personId));
      return c.json(r);
    }
  );

  app.post(
    "/roles",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const parsed = roleAssignSchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      if (parsed.data.congregationId !== c.get("congregationId"))
        return c.json(
          { error: "Cannot assign roles outside your congregation" },
          403
        );

      const [personCheck] = await db
        .select({ congregationId: schema.person.congregationId })
        .from(schema.person)
        .where(eq(schema.person.id, parsed.data.personId));
      if (
        !personCheck ||
        personCheck.congregationId !== parsed.data.congregationId
      ) {
        return c.json(
          { error: "Person does not belong to this congregation" },
          403
        );
      }

      const id = generateId();
      await db
        .insert(schema.role)
        .values({
          id,
          personId: parsed.data.personId,
          congregationId: parsed.data.congregationId,
          roleType: parsed.data.roleType as any,
          createdAt: new Date().toISOString(),
        });
      const [r] = await db
        .select()
        .from(schema.role)
        .where(eq(schema.role.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "role.assign",
        resourceType: "role",
        resourceId: id,
        details: JSON.stringify({
          personId: parsed.data.personId,
          roleType: parsed.data.roleType,
        }),
      });
      return c.json(r, 201);
    }
  );

  app.delete(
    "/roles/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const id = c.req.param("id");
      await db.delete(schema.role).where(eq(schema.role.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "role.remove",
        resourceType: "role",
        resourceId: id,
      });
      return c.json({ ok: true });
    }
  );
}
