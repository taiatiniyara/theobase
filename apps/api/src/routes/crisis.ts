import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerCrisisRoutes(app: AppType) {
  app.post("/crisis/assets", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { type, description, status } = await c.req.json();
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.congregationAsset).values({ id, congregationId: c.get("congregationId")!, type, description, status: status || "operational", updatedAt: now, createdAt: now });
    const [r] = await db.select().from(schema.congregationAsset).where(eq(schema.congregationAsset.id, id));
    return c.json(r, 201);
  });

  app.get("/crisis/assets", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.congregationAsset).where(eq(schema.congregationAsset.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });
}
