import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerFacilitiesRoutes(app: AppType) {
  app.get("/facilities/bookings", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.facilityBooking).where(eq(schema.facilityBooking.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/facilities/bookings", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { date, timeStart, timeEnd, purpose, requesterId } = await c.req.json();
    const id = generateId();
    await db.insert(schema.facilityBooking).values({ id, congregationId: c.get("congregationId")!, date, timeStart, timeEnd, purpose, requesterId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.facilityBooking).where(eq(schema.facilityBooking.id, id));
    return c.json(r, 201);
  });
}
