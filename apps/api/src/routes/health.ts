import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerHealthRoutes(app: AppType) {
  app.post("/health/events", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const db = getDb(c);
    const { name, date, type } = await c.req.json();
    const id = generateId();
    await db.insert(schema.healthEvent).values({ id, congregationId: c.get("congregationId")!, name, date, type, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.healthEvent).where(eq(schema.healthEvent.id, id));
    return c.json(r, 201);
  });

  app.get("/health/events", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const rows = await getDb(c).select().from(schema.healthEvent).where(eq(schema.healthEvent.congregationId, c.get("congregationId")!));
    return c.json(rows);
  });

  app.post("/health/contacts", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const db = getDb(c);
    const { eventId, name, phone, email, interests } = await c.req.json();
    const id = generateId();
    await db.insert(schema.healthContact).values({ id, eventId, congregationId: c.get("congregationId")!, name, phone, email, interests: JSON.stringify(interests), createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.healthContact).where(eq(schema.healthContact.id, id));
    return c.json(r, 201);
  });

  app.get("/health/contacts", requireAuth(), loadRoles(), requireRole("clerk", "health_ministries_leader"), async (c) => {
    const rows = await getDb(c).select().from(schema.healthContact).where(eq(schema.healthContact.congregationId, c.get("congregationId")!));
    return c.json(rows.map((r: any) => ({ ...r, interests: r.interests ? JSON.parse(r.interests) : null })));
  });
}
