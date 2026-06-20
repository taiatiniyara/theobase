import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerSabbathSchoolRoutes(app: AppType) {
  const createClassSchema = z.object({
    division: z.enum(["beginners", "kindergarten", "primary", "juniors", "earliteen", "youth", "adult"]),
    name: z.string().min(1),
    teacherId: z.string().optional(),
  });

  const createAttendanceSchema = z.object({
    attendance: z.array(z.object({
      classId: z.string().min(1),
      date: z.string().min(1),
      memberId: z.string().min(1),
      present: z.boolean(),
    })),
  });

  app.post("/sabbath-school/classes", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createClassSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const congregationId = c.get("congregationId")!;
    const id = generateId();
    await db.insert(schema.sabbathSchoolClass).values({ id, congregationId, division: parsed.data.division, name: parsed.data.name, teacherId: parsed.data.teacherId, createdAt: new Date().toISOString() });
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "sabbath.class_create", resourceType: "sabbath_school_class", resourceId: id });
    const [r] = await db.select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.id, id));
    return c.json(r, 201);
  });

  app.get("/sabbath-school/classes", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.post("/sabbath-school/attendance", requireAuth(), loadRoles(), requireRole("clerk", "sabbath_school_superintendent"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId")!;
    const body = await c.req.json();
    const parsed = createAttendanceSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const classes = await db.select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.congregationId, congregationId));
    const validClassIds = new Set(classes.map((c: { id: string }) => c.id));

    for (const item of parsed.data.attendance) {
      if (!validClassIds.has(item.classId)) continue;
      await db.insert(schema.sabbathSchoolAttendance).values({ id: generateId(), classId: item.classId, date: item.date, memberId: item.memberId, present: item.present, createdAt: new Date().toISOString() });
    }
    return c.json({ ok: true });
  });
}
