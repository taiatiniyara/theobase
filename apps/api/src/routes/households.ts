import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerHouseholdRoutes(app: AppType) {
  app.post("/households", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { name } = await c.req.json();
    const id = generateId();
    await db.insert(schema.household).values({ id, congregationId: c.get("congregationId")!, name, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.household).where(eq(schema.household.id, id));
    return c.json(r, 201);
  });

  app.get("/households", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.household).where(eq(schema.household.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/candidacies", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { personId, stage, startDate } = await c.req.json();
    const id = generateId();
    await db.insert(schema.candidacy).values({ id, personId, congregationId: c.get("congregationId")!, stage, startDate, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.candidacy).where(eq(schema.candidacy.id, id));
    return c.json(r, 201);
  });

  app.get("/candidacies", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.candidacy).where(eq(schema.candidacy.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });
}
