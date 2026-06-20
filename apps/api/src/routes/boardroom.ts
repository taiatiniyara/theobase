import type { AppType } from "../types";
import { eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z, detectRevisionFork } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getCongregationDO } from "../middleware/get-do";
import { recordAudit } from "../middleware/audit";

export function registerBoardroomRoutes(app: AppType) {
  const createMeetingSchema = z.object({
    date: z.string(),
    agenda: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
  });

  const createDecisionSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    moverId: z.string().optional(),
    seconderId: z.string().optional(),
    voteOutcome: z.enum(["approved", "rejected", "tabled"]).optional(),
  });

  app.post("/board/meetings", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(schema.boardMeeting).values({
      id,
      congregationId,
      date: parsed.data.date,
      agenda: parsed.data.agenda ? JSON.stringify(parsed.data.agenda) : null,
      status: "draft",
      createdAt: now,
    });

    const [created] = await db.select().from(schema.boardMeeting).where(eq(schema.boardMeeting.id, id));

    const doStub = getCongregationDO(c, congregationId);
    if (doStub) await doStub.meetingUpdated({ id, status: "draft", date: parsed.data.date });

    return c.json({ ...created, agenda: created.agenda ? JSON.parse(created.agenda) : null }, 201);
  });

  app.get("/board/meetings", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const meetings = await db
      .select()
      .from(schema.boardMeeting)
      .where(eq(schema.boardMeeting.congregationId, congregationId))
      .orderBy(asc(schema.boardMeeting.date))
      .limit(limit)
      .offset(offset);

    return c.json(meetings.map((m: any) => ({ ...m, agenda: m.agenda ? JSON.parse(m.agenda) : null })));
  });

  app.get("/board/meetings/:id", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const [meeting] = await db
      .select()
      .from(schema.boardMeeting)
      .where(eq(schema.boardMeeting.id, c.req.param("id")));

    if (!meeting) return c.json({ error: "Not found" }, 404);

    const decisions = await db
      .select()
      .from(schema.boardDecision)
      .where(eq(schema.boardDecision.meetingId, meeting.id))
      .orderBy(asc(schema.boardDecision.number));

    return c.json({ ...meeting, agenda: meeting.agenda ? JSON.parse(meeting.agenda) : null, decisions });
  });

  app.post("/board/meetings/:id/decisions", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createDecisionSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const meetingId = c.req.param("id");
    const userId = c.get("userId");
    const congregationId = c.get("congregationId");

    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    if (!user?.personId) return c.json({ error: "No profile" }, 400);

    const decisions = await db
      .select({ number: schema.boardDecision.number })
      .from(schema.boardDecision)
      .where(eq(schema.boardDecision.meetingId, meetingId));

    const nextNumber = decisions.length > 0 ? Math.max(...decisions.map((d: any) => d.number)) + 1 : 1;

    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(schema.boardDecision).values({
      id,
      meetingId,
      number: nextNumber,
      title: parsed.data.title,
      description: parsed.data.description || null,
      moverId: parsed.data.moverId || null,
      seconderId: parsed.data.seconderId || null,
      voteOutcome: parsed.data.voteOutcome as any || null,
      createdAt: now,
    });

    const [created] = await db.select().from(schema.boardDecision).where(eq(schema.boardDecision.id, id));

    await recordAudit(db, userId, congregationId || "", {
      action: "board.decision.create",
      resourceType: "board_decision",
      resourceId: id,
      details: JSON.stringify({ meetingId, title: parsed.data.title }),
    });

    if (congregationId) {
      const doStub = getCongregationDO(c, congregationId);
      if (doStub) await doStub.decisionRecorded(meetingId, { id, title: parsed.data.title, voteOutcome: parsed.data.voteOutcome || "pending" });
    }

    return c.json(created, 201);
  });

  app.get("/board/meetings/:id/minutes", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const rows = await db.select().from(schema.boardMinute).where(eq(schema.boardMinute.meetingId, c.req.param("id"))).orderBy(asc(schema.boardMinute.createdAt));
    return c.json(rows);
  });

  const minuteSchema = z.object({ content: z.string().min(1) });
  app.post("/board/meetings/:id/minutes", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = minuteSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    if (!user?.personId) return c.json({ error: "No profile" }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.boardMinute).values({ id, meetingId: c.req.param("id"), content: parsed.data.content, authorId: user.personId, createdAt: now, updatedAt: now });
    const [r] = await db.select().from(schema.boardMinute).where(eq(schema.boardMinute.id, id));
    await recordAudit(db, userId, c.get("congregationId") || "", { action: "minutes.create", resourceType: "board_minute", resourceId: id });
    return c.json(r, 201);
  });

  app.patch("/board/minutes/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const parsed = minuteSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const minuteId = c.req.param("id");
    const [current] = await db.select().from(schema.boardMinute).where(eq(schema.boardMinute.id, minuteId));
    if (!current) return c.json({ error: "Not found" }, 404);

    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const nodeId = user?.personId || userId;

    const base = { version: current.revisionNumber - 1 || 0, content: current.content };
    const local = { version: current.revisionNumber + 1, content: parsed.data.content, nodeId };
    const remote = { version: current.revisionNumber, content: current.content, nodeId: "server" };

    const fork = detectRevisionFork(base, local, remote);
    const now = new Date().toISOString();

    if (fork) {
      await db.insert(schema.boardMinute).values({
        id: generateId(),
        meetingId: current.meetingId,
        content: `[CONFLICT]\n--- Our version ---\n${parsed.data.content}\n--- Server version ---\n${current.content}`,
        revisionNumber: current.revisionNumber + 1,
        authorId: user?.personId || userId,
        createdAt: now,
        updatedAt: now,
      });
      const conflict = await db.select().from(schema.boardMinute).where(eq(schema.boardMinute.meetingId, current.meetingId));
      return c.json({ fork: true, conflict: true, message: "Revision conflict detected. A conflict version has been saved for manual resolution.", versions: conflict }, 409);
    }

    await db.update(schema.boardMinute).set({ content: parsed.data.content, revisionNumber: current.revisionNumber + 1, updatedAt: now }).where(eq(schema.boardMinute.id, minuteId));
    const [r] = await db.select().from(schema.boardMinute).where(eq(schema.boardMinute.id, minuteId));
    return c.json(r);
  });

  app.delete("/board/minutes/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.boardMinute).where(eq(schema.boardMinute.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId") || "", { action: "minutes.delete", resourceType: "board_minute", resourceId: id });
    return c.json({ ok: true });
  });
}
