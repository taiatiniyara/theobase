import type { AppType } from "../types";
import { eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerDisciplineRoutes(app: AppType) {
  const createCaseSchema = z.object({
    personId: z.string().min(1),
    caseType: z.enum(["censure", "removal", "reinstatement", "counseling"]),
    description: z.string().min(1).max(2000),
    boardMeetingId: z.string().optional(),
  });

  const resolveCaseSchema = z.object({
    resolution: z.string().min(1).max(2000),
    status: z.enum(["resolved", "appealed"]),
    boardMeetingId: z.string().optional(),
  });

  app.post("/discipline/cases", requireAuth(), loadRoles(), requireRole("clerk", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const body = await c.req.json();
    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    const userId = c.get("userId");

    await db.insert(schema.disciplineCase).values({
      id,
      congregationId,
      personId: parsed.data.personId,
      caseType: parsed.data.caseType,
      description: parsed.data.description,
      boardMeetingId: parsed.data.boardMeetingId || null,
      decidedById: userId,
      createdAt: now,
      updatedAt: now,
    });

    const [created] = await db.select().from(schema.disciplineCase).where(eq(schema.disciplineCase.id, id));
    await recordAudit(db, userId, congregationId, { action: "discipline.case_create", resourceType: "discipline_case", resourceId: id });
    return c.json(created, 201);
  });

  app.get("/discipline/cases", requireAuth(), loadRoles(), requireRole("clerk", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const cases = await db
      .select()
      .from(schema.disciplineCase)
      .where(eq(schema.disciplineCase.congregationId, congregationId))
      .orderBy(asc(schema.disciplineCase.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json(cases);
  });

  app.get("/discipline/cases/:id", requireAuth(), loadRoles(), requireRole("clerk", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const [found] = await db
      .select()
      .from(schema.disciplineCase)
      .where(eq(schema.disciplineCase.id, c.req.param("id")));

    if (!found || found.congregationId !== congregationId) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(found);
  });

  app.patch("/discipline/cases/:id/resolve", requireAuth(), loadRoles(), requireRole("clerk", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const body = await c.req.json();
    const parsed = resolveCaseSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const caseId = c.req.param("id");
    const [found] = await db
      .select()
      .from(schema.disciplineCase)
      .where(eq(schema.disciplineCase.id, caseId));

    if (!found || found.congregationId !== congregationId) {
      return c.json({ error: "Not found" }, 404);
    }

    const now = new Date().toISOString();
    await db
      .update(schema.disciplineCase)
      .set({
        status: parsed.data.status,
        resolution: parsed.data.resolution,
        boardMeetingId: parsed.data.boardMeetingId || found.boardMeetingId,
        decidedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.disciplineCase.id, caseId));

    const [updated] = await db.select().from(schema.disciplineCase).where(eq(schema.disciplineCase.id, caseId));
    await recordAudit(db, c.get("userId"), congregationId, { action: "discipline.case_resolve", resourceType: "discipline_case", resourceId: caseId });
    return c.json(updated);
  });
}
