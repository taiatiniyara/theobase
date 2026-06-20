import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerPathfinderRoutes(app: AppType) {
  const createProgressSchema = z.object({
    memberId: z.string().min(1),
    className: z.enum(["friend", "companion", "explorer", "ranger", "guide", "little_lamb", "eager_beaver", "busy_bee", "sunbeam", "builder", "helping_hand"]),
    clubType: z.enum(["pathfinders", "adventurers"]),
    status: z.enum(["in_progress", "completed"]).optional(),
  });

  const createHonorSchema = z.object({
    memberId: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    earnedAt: z.string().min(1).optional(),
  });

  app.post("/pathfinder/progress", requireAuth(), loadRoles(), requireRole("clerk", "pathfinder_director"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createProgressSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.pathfinderProgress).values({ id, memberId: parsed.data.memberId, className: parsed.data.className, clubType: parsed.data.clubType, status: parsed.data.status, completedAt: parsed.data.status === "completed" ? now : undefined, createdAt: now });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "pathfinder.progress_create", resourceType: "pathfinder_progress", resourceId: id });
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
    const body = await c.req.json();
    const parsed = createHonorSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    await db.insert(schema.pathfinderHonor).values({ id, memberId: parsed.data.memberId, name: parsed.data.name, category: parsed.data.category, earnedAt: parsed.data.earnedAt, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "pathfinder.honor_create", resourceType: "pathfinder_honor", resourceId: id });
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
