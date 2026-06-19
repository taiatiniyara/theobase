import type { AppType } from "../types";
import { eq, desc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerCommunionRoutes(app: AppType) {
  app.post("/communion", requireAuth(), loadRoles(), requireRole("clerk", "elder", "deacon", "deaconess"), async (c) => {
    const db = getDb(c);
    const { date, rooms, inventory } = await c.req.json<{
      date: string;
      rooms: { name: string; gender: string; volunteerIds: string[] }[];
      inventory: { item: string; quantity: number; unit: string }[];
    }>();
    const serviceId = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.communionService).values({ id: serviceId, congregationId: c.get("congregationId")!, date, createdAt: now });
    for (const room of rooms) {
      await db.insert(schema.communionRoom).values({ id: generateId(), serviceId, name: room.name, gender: room.gender as any, volunteerIds: JSON.stringify(room.volunteerIds) });
    }
    for (const inv of inventory) {
      await db.insert(schema.communionInventory).values({ id: generateId(), serviceId, item: inv.item as any, quantity: inv.quantity, unit: inv.unit });
    }
    const roomsResult = await db.select().from(schema.communionRoom).where(eq(schema.communionRoom.serviceId, serviceId));
    const invResult = await db.select().from(schema.communionInventory).where(eq(schema.communionInventory.serviceId, serviceId));
    return c.json({ id: serviceId, date, rooms: roomsResult, inventory: invResult }, 201);
  });

  app.get("/communion", requireAuth(), loadRoles(), requireRole("clerk", "elder", "deacon", "deaconess"), async (c) => {
    const db = getDb(c);
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const services = await db
      .select()
      .from(schema.communionService)
      .where(eq(schema.communionService.congregationId, c.get("congregationId")!))
      .orderBy(desc(schema.communionService.date))
      .limit(limit)
      .offset(offset);

    return c.json(services);
  });

  app.get("/communion/:id", requireAuth(), loadRoles(), requireRole("clerk", "elder", "deacon", "deaconess"), async (c) => {
    const db = getDb(c);
    const [service] = await db
      .select()
      .from(schema.communionService)
      .where(eq(schema.communionService.id, c.req.param("id")));

    if (!service) return c.json({ error: "Not found" }, 404);

    const rooms = await db.select().from(schema.communionRoom).where(eq(schema.communionRoom.serviceId, service.id));
    const inventory = await db.select().from(schema.communionInventory).where(eq(schema.communionInventory.serviceId, service.id));

    return c.json({ ...service, rooms, inventory });
  });
}
