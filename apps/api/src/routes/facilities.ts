import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerFacilitiesRoutes(app: AppType) {
  const createBookingSchema = z.object({
    date: z.string().min(1),
    timeStart: z.string().min(1),
    timeEnd: z.string().min(1),
    purpose: z.string().min(1),
    requesterId: z.string().optional(),
  });

  app.get("/facilities/bookings", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.facilityBooking).where(eq(schema.facilityBooking.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/facilities/bookings", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    await db.insert(schema.facilityBooking).values({ id, congregationId: c.get("congregationId")!, date: parsed.data.date, timeStart: parsed.data.timeStart, timeEnd: parsed.data.timeEnd, purpose: parsed.data.purpose, requesterId: parsed.data.requesterId, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "facility.booking_create", resourceType: "facility_booking", resourceId: id });
    const [r] = await db.select().from(schema.facilityBooking).where(eq(schema.facilityBooking.id, id));
    return c.json(r, 201);
  });
}
