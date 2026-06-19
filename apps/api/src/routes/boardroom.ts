import type { AppType } from "../types";
import { eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getCongregationDO } from "../middleware/get-do";

export function registerBoardroomRoutes(app: AppType) {
  const createMeetingSchema = z.object({
    date: z.string(),
    agenda: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
  });

  app.post("/board/meetings", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
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

  app.post("/board/meetings/:id/decisions", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json<{ title: string; description?: string; moverId?: string; seconderId?: string; voteOutcome?: string }>();
    if (!body.title) return c.json({ error: "Title required" }, 400);

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
      title: body.title,
      description: body.description || null,
      moverId: body.moverId || null,
      seconderId: body.seconderId || null,
      voteOutcome: body.voteOutcome as any || null,
      createdAt: now,
    });

    const [created] = await db.select().from(schema.boardDecision).where(eq(schema.boardDecision.id, id));

    if (congregationId) {
      const doStub = getCongregationDO(c, congregationId);
      if (doStub) await doStub.decisionRecorded(meetingId, { id, title: body.title, voteOutcome: body.voteOutcome || "pending" });
    }

    return c.json(created, 201);
  });
}
