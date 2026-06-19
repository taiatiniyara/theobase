import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerSabbathSchoolRoutes(app: AppType) {
  app.post("/sabbath-school/classes", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const db = getDb(c);
    const { division, name, teacherId } = await c.req.json();
    const congregationId = c.get("congregationId")!;
    const id = generateId();
    await db.insert(schema.sabbathSchoolClass).values({ id, congregationId, division, name, teacherId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.id, id));
    return c.json(r, 201);
  });

  app.get("/sabbath-school/classes", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const rows = await getDb(c).select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.congregationId, c.get("congregationId")!));
    return c.json(rows);
  });

  app.post("/sabbath-school/attendance", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const db = getDb(c);
    const items: { classId: string; date: string; memberId: string; present: boolean }[] = (await c.req.json()).attendance;
    for (const item of items) {
      await db.insert(schema.sabbathSchoolAttendance).values({ id: generateId(), classId: item.classId, date: item.date, memberId: item.memberId, present: item.present, createdAt: new Date().toISOString() });
    }
    return c.json({ ok: true });
  });
}
