import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerHealthRoutes(app: AppType) {
  const createEventSchema = z.object({
    name: z.string().min(1),
    date: z.string().min(1),
    type: z.enum(["health_expo", "cooking_school", "seminar", "screening"]),
  });

  const createContactSchema = z.object({
    eventId: z.string().min(1),
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    interests: z.string().optional(),
  });

  app.post("/health/events", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    await db.insert(schema.healthEvent).values({ id, congregationId: c.get("congregationId")!, name: parsed.data.name, date: parsed.data.date, type: parsed.data.type, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "health.event_create", resourceType: "health_event", resourceId: id });
    const [r] = await db.select().from(schema.healthEvent).where(eq(schema.healthEvent.id, id));
    return c.json(r, 201);
  });

  app.get("/health/events", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.healthEvent).where(eq(schema.healthEvent.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/health/contacts", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    await db.insert(schema.healthContact).values({ id, eventId: parsed.data.eventId, congregationId: c.get("congregationId")!, name: parsed.data.name, phone: parsed.data.phone, email: parsed.data.email, interests: parsed.data.interests ? JSON.stringify(parsed.data.interests) : null, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "health.contact_create", resourceType: "health_contact", resourceId: id });
    const [r] = await db.select().from(schema.healthContact).where(eq(schema.healthContact.id, id));
    return c.json(r, 201);
  });

  app.get("/health/contacts", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.healthContact).where(eq(schema.healthContact.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows.map((r: any) => ({ ...r, interests: r.interests ? JSON.parse(r.interests) : null })));
  });
}
