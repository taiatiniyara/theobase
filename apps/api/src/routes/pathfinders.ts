import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerPathfinderRoutes(app: AppType) {
  app.post("/pathfinder/progress", requireAuth(), loadRoles(), requireRole("clerk", "pathfinder_director"), async (c) => {
    const db = getDb(c);
    const { memberId, className, clubType, status } = await c.req.json();
    const id = generateId();
    await db.insert(schema.pathfinderProgress).values({ id, memberId, className, clubType, status, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.pathfinderProgress).where(eq(schema.pathfinderProgress.id, id));
    return c.json(r, 201);
  });

  app.get("/pathfinder/progress/:memberId", requireAuth(), loadRoles(), requireRole("clerk", "pathfinder_director"), async (c) => {
    const db = getDb(c);
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await db.select().from(schema.pathfinderProgress).where(eq(schema.pathfinderProgress.memberId, c.req.param("memberId"))).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/pathfinder/honors", requireAuth(), loadRoles(), requireRole("clerk", "pathfinder_director"), async (c) => {
    const db = getDb(c);
    const { memberId, name, category, earnedAt } = await c.req.json();
    const id = generateId();
    await db.insert(schema.pathfinderHonor).values({ id, memberId, name, category, earnedAt, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.pathfinderHonor).where(eq(schema.pathfinderHonor.id, id));
    return c.json(r, 201);
  });

  app.get("/pathfinder/honors/:memberId", requireAuth(), loadRoles(), requireRole("clerk", "pathfinder_director"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.pathfinderHonor).where(eq(schema.pathfinderHonor.memberId, c.req.param("memberId"))).limit(limit).offset(offset);
    return c.json(rows);
  });
}
