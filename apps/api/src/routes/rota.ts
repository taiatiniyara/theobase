import type { AppType } from "../types";
import { and, eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getEmailSender } from "../middleware/get-email";
import { renderRotaAssignmentEmail } from "@theobase/email";
import { getCongregationDO } from "../middleware/get-do";
import { isDuringSabbathHours } from "@theobase/shared";
import { recordAudit } from "../middleware/audit";

export function registerRotaRoutes(app: AppType) {
  const createSlotSchema = z.object({
    date: z.string(),
    role: z.enum([
      "elder",
      "preacher",
      "deacon",
      "deaconess",
      "musician",
      "av_operator",
      "youth_leader",
    ]),
    volunteerId: z.string().optional(),
  });

  const safetySchema = z.object({
    volunteerId: z.string().min(1),
    type: z.enum(["safety_clearance", "child_protection"]),
    issuedDate: z.string().min(1),
    expiryDate: z.string().min(1),
  });

  app.get("/rota/:date", requireAuth(), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);
    const slots = await db
      .select()
      .from(schema.dutySlot)
      .where(
        and(
          eq(schema.dutySlot.congregationId, congregationId),
          eq(schema.dutySlot.date, c.req.param("date"))
        )
      );
    return c.json(slots);
  });

  app.post(
    "/rota/slots",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const body = await c.req.json();
      const parsed = createSlotSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const congregationId = c.get("congregationId");
      if (!congregationId) return c.json({ error: "No congregation" }, 400);

      if (
        parsed.data.volunteerId &&
        ["youth_leader"].includes(parsed.data.role)
      ) {
        const [clearance] = await db
          .select()
          .from(schema.safetyClearance)
          .where(
            and(
              eq(schema.safetyClearance.volunteerId, parsed.data.volunteerId),
              eq(schema.safetyClearance.congregationId, congregationId)
            )
          );
        if (!clearance || clearance.expiryDate < new Date().toISOString()) {
          return c.json(
            {
              error: "Volunteer lacks valid safety clearance for youth duties",
            },
            400
          );
        }
      }

      const id = generateId();
      const now = new Date().toISOString();
      await db.insert(schema.dutySlot).values({
        id,
        congregationId,
        date: parsed.data.date,
        role: parsed.data.role,
        volunteerId: parsed.data.volunteerId || null,
        status: parsed.data.volunteerId ? "assigned" : "open",
        createdAt: now,
      });

      if (parsed.data.volunteerId) {
        const [volunteer] = await db
          .select({ email: schema.person.email })
          .from(schema.person)
          .where(eq(schema.person.id, parsed.data.volunteerId));
        if (volunteer?.email) {
          const [cong] = await db
            .select({
              timezone: schema.congregation.timezone,
              name: schema.congregation.name,
            })
            .from(schema.congregation)
            .where(eq(schema.congregation.id, congregationId));
          if (cong?.timezone && isDuringSabbathHours(cong.timezone)) {
            const doStub2 = getCongregationDO(c, congregationId);
            if (doStub2)
              await doStub2.scheduleReminder(Date.now() + 60 * 1000, {
                date: parsed.data.date,
                role: parsed.data.role,
                volunteerId: parsed.data.volunteerId!,
                email: volunteer.email,
                congregationName: cong?.name,
              });
          } else {
            const sendEmail = await getEmailSender(c);
            await sendEmail({
              to: volunteer.email,
              subject: `You've been assigned: ${parsed.data.role} on ${parsed.data.date}`,
              html: renderRotaAssignmentEmail({
                role: parsed.data.role,
                date: parsed.data.date,
              }),
            });
          }
        }
      }

      const [created] = await db
        .select()
        .from(schema.dutySlot)
        .where(eq(schema.dutySlot.id, id));
      const doStub = getCongregationDO(c, congregationId);
      if (doStub)
        await doStub.slotAssigned({
          id,
          role: parsed.data.role,
          volunteerId: parsed.data.volunteerId || "",
          date: parsed.data.date,
        });
      await recordAudit(db, c.get("userId"), congregationId, {
        action: "rota.slot_create",
        resourceType: "duty_slot",
        resourceId: id,
      });
      return c.json(created, 201);
    }
  );

  app.patch(
    "/rota/slots/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const slotId = c.req.param("id");
      const [existing] = await db
        .select()
        .from(schema.dutySlot)
        .where(eq(schema.dutySlot.id, slotId));
      if (!existing) return c.json({ error: "Not found" }, 404);

      const parsed = z
        .object({
          volunteerId: z.string().optional(),
          status: z
            .enum(["open", "assigned", "declined", "confirmed"])
            .optional(),
        })
        .safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      await db
        .update(schema.dutySlot)
        .set(parsed.data)
        .where(eq(schema.dutySlot.id, slotId));
      const [r] = await db
        .select()
        .from(schema.dutySlot)
        .where(eq(schema.dutySlot.id, slotId));
      return c.json(r);
    }
  );

  app.delete(
    "/rota/slots/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const id = c.req.param("id");
      await db.delete(schema.dutySlot).where(eq(schema.dutySlot.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "rota.slot_delete",
        resourceType: "duty_slot",
        resourceId: id,
      });
      return c.json({ ok: true });
    }
  );

  app.get(
    "/safety-clearances",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const rows = await getDb(c)
        .select()
        .from(schema.safetyClearance)
        .where(
          eq(schema.safetyClearance.congregationId, c.get("congregationId")!)
        );
      return c.json(rows);
    }
  );

  app.post(
    "/safety-clearances",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const parsed = safetySchema.safeParse(await c.req.json());
      if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
      const id = generateId();
      const now = new Date().toISOString();
      await db.insert(schema.safetyClearance).values({
        id,
        congregationId: c.get("congregationId")!,
        ...parsed.data,
        createdAt: now,
      });
      const [r] = await db
        .select()
        .from(schema.safetyClearance)
        .where(eq(schema.safetyClearance.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
        action: "clearance.create",
        resourceType: "safety_clearance",
        resourceId: id,
      });
      return c.json(r, 201);
    }
  );

  app.delete(
    "/safety-clearances/:id",
    requireAuth(),
    loadRoles(),
    requireWriteAccess("clerk"),
    async (c) => {
      const db = getDb(c);
      const id = c.req.param("id");
      await db
        .delete(schema.safetyClearance)
        .where(eq(schema.safetyClearance.id, id));
      return c.json({ ok: true });
    }
  );
}
