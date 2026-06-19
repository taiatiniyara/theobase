import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerDistrictRoutes(app: AppType) {
  app.post("/district/rotations", requireAuth(), loadRoles(), requireRole("clerk", "district_pastor"), async (c) => {
    const db = getDb(c);
    const { congregationId, date, preacherId, topic } = await c.req.json();
    const id = generateId();
    await db.insert(schema.preachingRotation).values({ id, congregationId, date, preacherId, topic, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.preachingRotation).where(eq(schema.preachingRotation.id, id));
    return c.json(r, 201);
  });

  app.get("/district/rotations", requireAuth(), loadRoles(), requireRole("clerk", "district_pastor"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.preachingRotation).where(eq(schema.preachingRotation.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/district/visits", requireAuth(), loadRoles(), requireRole("clerk", "district_pastor"), async (c) => {
    const db = getDb(c);
    const { householdId, pastorId, date, purpose, notes } = await c.req.json();
    const id = generateId();
    await db.insert(schema.pastoralVisit).values({ id, householdId, pastorId, congregationId: c.get("congregationId")!, date, purpose, notes, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.pastoralVisit).where(eq(schema.pastoralVisit.id, id));
    return c.json(r, 201);
  });
}
