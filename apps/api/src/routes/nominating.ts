import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerNominatingRoutes(app: AppType) {
  app.post("/nominating/sessions", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { year } = await c.req.json();
    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const id = generateId();
    await db.insert(schema.nominatingSession).values({ id, congregationId: c.get("congregationId")!, year, openedById: user?.personId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.nominatingSession).where(eq(schema.nominatingSession.id, id));
    return c.json(r, 201);
  });

  app.post("/nominating/roles", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const { sessionId, roleType } = await c.req.json();
    const id = generateId();
    await db.insert(schema.nominatingRole).values({ id, sessionId, roleType, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.nominatingRole).where(eq(schema.nominatingRole.id, id));
    return c.json(r, 201);
  });
}
