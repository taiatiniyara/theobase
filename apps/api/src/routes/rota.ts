import type { AppType } from "../types";
import { and, eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getEmailSender } from "../middleware/get-email";
import { getCongregationDO } from "../middleware/get-do";
import { isDuringSabbathHours } from "../middleware/sabbath-guard";

export function registerRotaRoutes(app: AppType) {
  const createSlotSchema = z.object({
    date: z.string(),
    role: z.enum(["elder", "preacher", "deacon", "deaconess", "musician", "av_operator", "youth_leader"]),
    volunteerId: z.string().optional(),
  });

  app.get("/rota/:date", requireAuth(), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const slots = await db
      .select()
      .from(schema.dutySlot)
      .where(and(eq(schema.dutySlot.congregationId, congregationId), eq(schema.dutySlot.date, c.req.param("date"))));

    return c.json(slots);
  });

  app.post("/rota/slots", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createSlotSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    if (parsed.data.volunteerId && ["youth_leader"].includes(parsed.data.role)) {
      const [clearance] = await db
        .select()
        .from(schema.safetyClearance)
        .where(eq(schema.safetyClearance.volunteerId, parsed.data.volunteerId));
      if (!clearance || clearance.expiryDate < new Date().toISOString()) {
        return c.json({ error: "Volunteer lacks valid safety clearance for youth duties" }, 400);
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
        const [cong] = await db.select({ timezone: schema.congregation.timezone }).from(schema.congregation).where(eq(schema.congregation.id, congregationId));
        if (cong?.timezone && isDuringSabbathHours(cong.timezone)) {
          // Queue notification for after Sabbath via DO alarm if available
        } else {
          const sendEmail = getEmailSender(c);
          await sendEmail({
            to: volunteer.email,
            subject: `You've been assigned: ${parsed.data.role} on ${parsed.data.date}`,
            html: `<p>You have been assigned as <strong>${parsed.data.role}</strong> on <strong>${parsed.data.date}</strong>.</p><p>Log in to Theobase to confirm or decline this duty.</p>`,
          });
        }
      }
    }

    const [created] = await db.select().from(schema.dutySlot).where(eq(schema.dutySlot.id, id));

    const doStub = getCongregationDO(c, congregationId);
    if (doStub) await doStub.slotAssigned({ id, role: parsed.data.role, volunteerId: parsed.data.volunteerId || "", date: parsed.data.date });

    return c.json(created, 201);
  });
}
