import type { AppType } from "../types";
import { eq, desc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerNominatingRoutes(app: AppType) {
  const createSessionSchema = z.object({ year: z.number().int().positive() });
  const createRoleSchema = z.object({ sessionId: z.string().min(1), roleType: z.string().min(1) });
  const candidateSchema = z.object({ roleId: z.string().min(1), personId: z.string().min(1) });

  app.post("/nominating/sessions", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = createSessionSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const id = generateId();
    const congregationId = c.get("congregationId")!;
    await db.insert(schema.nominatingSession).values({ id, congregationId, year: parsed.data.year, openedById: user?.personId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.nominatingSession).where(eq(schema.nominatingSession.id, id));
    await recordAudit(db, userId, congregationId, { action: "nominating.session.create", resourceType: "nominating_session", resourceId: id, details: JSON.stringify({ year: parsed.data.year }) });
    return c.json(r, 201);
  });

  app.get("/nominating/sessions", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const rows = await getDb(c).select().from(schema.nominatingSession).where(eq(schema.nominatingSession.congregationId, c.get("congregationId")!)).orderBy(desc(schema.nominatingSession.year));
    return c.json(rows);
  });

  app.delete("/nominating/sessions/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    await db.delete(schema.nominatingSession).where(eq(schema.nominatingSession.id, c.req.param("id")));
    return c.json({ ok: true });
  });

  app.post("/nominating/roles", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = createRoleSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const congregationId = c.get("congregationId")!;
    const [session] = await db.select().from(schema.nominatingSession).where(eq(schema.nominatingSession.id, parsed.data.sessionId));
    if (!session || session.congregationId !== congregationId) return c.json({ error: "Session not found" }, 404);
    const id = generateId();
    await db.insert(schema.nominatingRole).values({ id, sessionId: parsed.data.sessionId, roleType: parsed.data.roleType, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.nominatingRole).where(eq(schema.nominatingRole.id, id));
    return c.json(r, 201);
  });

  app.get("/nominating/roles", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const sessionId = c.req.query("sessionId");
    if (!sessionId) return c.json({ error: "sessionId query parameter required" }, 400);
    const rows = await getDb(c).select().from(schema.nominatingRole).where(eq(schema.nominatingRole.sessionId, sessionId));
    return c.json(rows);
  });

  app.delete("/nominating/roles/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    await db.delete(schema.nominatingRole).where(eq(schema.nominatingRole.id, c.req.param("id")));
    return c.json({ ok: true });
  });

  app.post("/nominating/candidates", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = candidateSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const [role] = await db.select().from(schema.nominatingRole).where(eq(schema.nominatingRole.id, parsed.data.roleId));
    if (!role) return c.json({ error: "Role not found" }, 404);
    const [session] = await db.select().from(schema.nominatingSession).where(eq(schema.nominatingSession.id, role.sessionId));
    if (!session || session.congregationId !== c.get("congregationId")) return c.json({ error: "Access denied" }, 403);
    const userId = c.get("userId");
    const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
    const id = generateId();
    await db.insert(schema.nominatingCandidate).values({ id, roleId: parsed.data.roleId, personId: parsed.data.personId, nominatedById: user?.personId, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.nominatingCandidate).where(eq(schema.nominatingCandidate.id, id));
    await recordAudit(db, userId, c.get("congregationId")!, { action: "nominating.candidate_add", resourceType: "nominating_candidate", resourceId: id });
    return c.json(r, 201);
  });

  app.get("/nominating/candidates", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const roleId = c.req.query("roleId");
    if (!roleId) return c.json({ error: "roleId query parameter required" }, 400);
    const rows = await getDb(c).select().from(schema.nominatingCandidate).where(eq(schema.nominatingCandidate.roleId, roleId));
    return c.json(rows);
  });

  app.patch("/nominating/candidates/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const { status } = await c.req.json<{ status: string }>();
    if (!["nominated", "invited", "accepted", "declined"].includes(status)) return c.json({ error: "Invalid status" }, 400);
    await db.update(schema.nominatingCandidate).set({ status: status as any }).where(eq(schema.nominatingCandidate.id, c.req.param("id")));
    const [r] = await db.select().from(schema.nominatingCandidate).where(eq(schema.nominatingCandidate.id, c.req.param("id")));
    return c.json(r);
  });

  app.delete("/nominating/candidates/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    await db.delete(schema.nominatingCandidate).where(eq(schema.nominatingCandidate.id, c.req.param("id")));
    return c.json({ ok: true });
  });

  function getNominatingDO(c: any, sessionId: string) {
    const ns = c.env?.NOMINATING_DO as DurableObjectNamespace | undefined;
    if (!ns) return null;
    const stub = ns.get(ns.idFromName(sessionId));
    return stub as unknown as {
      castBallot(sessionId: string, roleId: string, candidateId: string, voterId: string): Promise<{ ok: boolean; error?: string }>;
      getTally(sessionId: string): Promise<{ tally: Record<string, number>; totalVotes: number }>;
      closeVoting(sessionId: string): Promise<{ ok: boolean }>;
    };
  }

  app.post("/nominating/ballots", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const { sessionId, roleId, candidateId } = await c.req.json();
    if (!sessionId || !roleId || !candidateId) return c.json({ error: "sessionId, roleId, candidateId required" }, 400);

    const doStub = getNominatingDO(c, sessionId);
    if (!doStub) return c.json({ error: "Voting service unavailable" }, 500);

    const userId = c.get("userId");
    const personResult = await getDb(c)
      .select({ personId: schema.user.personId })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);

    const voterId = personResult[0]?.personId;
    if (!voterId) return c.json({ error: "No profile" }, 400);

    const result = await doStub.castBallot(sessionId, roleId, candidateId, voterId);

    const db = getDb(c);
    const id = generateId();
    await db.insert(schema.nominatingBallot).values({
      id,
      sessionId,
      roleId,
      candidateId,
      voterId,
      encryptedVote: JSON.stringify({ roleId, candidateId }),
      createdAt: new Date().toISOString(),
    });

    await recordAudit(db, userId, c.get("congregationId")!, {
      action: "nominating.ballot_cast",
      resourceType: "nominating_ballot",
      resourceId: id,
    });

    return c.json(result);
  });

  app.get("/nominating/tally/:sessionId", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const sessionId = c.req.param("sessionId");
    const doStub = getNominatingDO(c, sessionId);
    if (!doStub) return c.json({ error: "Voting service unavailable" }, 500);

    const tally = await doStub.getTally(sessionId);
    return c.json(tally);
  });

  app.post("/nominating/sessions/:id/close", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const sessionId = c.req.param("id");
    const doStub = getNominatingDO(c, sessionId);
    if (!doStub) return c.json({ error: "Voting service unavailable" }, 500);

    await doStub.closeVoting(sessionId);

    const db = getDb(c);
    await db.update(schema.nominatingSession)
      .set({ status: "closed" })
      .where(eq(schema.nominatingSession.id, sessionId));

    await recordAudit(db, c.get("userId"), c.get("congregationId")!, {
      action: "nominating.session_close",
      resourceType: "nominating_session",
      resourceId: sessionId,
    });

    return c.json({ ok: true });
  });
}
