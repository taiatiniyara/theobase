import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerCrisisRoutes(app: AppType) {
  const createAssetSchema = z.object({
    type: z.enum(["generator", "water_tank", "shelter", "first_aid", "comms_radio", "vehicle", "kitchen", "medical"]),
    description: z.string().min(1),
    status: z.enum(["operational", "damaged", "offline"]).optional(),
  });

  app.post("/crisis/assets", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createAssetSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.congregationAsset).values({ id, congregationId: c.get("congregationId")!, type: parsed.data.type, description: parsed.data.description, status: parsed.data.status || "operational", updatedAt: now, createdAt: now });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "crisis.asset_create", resourceType: "congregation_asset", resourceId: id });
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
