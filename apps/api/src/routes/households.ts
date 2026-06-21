import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerHouseholdRoutes(app: AppType) {
  const createHouseholdSchema = z.object({
    name: z.string().min(1).max(200),
  });

  const createCandidacySchema = z.object({
    personId: z.string().min(1),
    stage: z.enum(["interest", "bible_study", "baptismal_class", "decision"]),
    startDate: z.string().min(1),
    decisionDate: z.string().optional(),
    decisionType: z.enum(["baptism", "profession_of_faith", "rebaptism"]).optional(),
    officiatingPastorId: z.string().optional(),
  });

  const candidacyPatchSchema = z.object({
    stage: z.enum(["interest", "bible_study", "baptismal_class", "decision"]).optional(),
    decisionDate: z.string().optional(),
    decisionType: z.enum(["baptism", "profession_of_faith", "rebaptism"]).optional(),
    officiatingPastorId: z.string().optional(),
  });

  const householdMemberSchema = z.object({
    personId: z.string().min(1),
    relationship: z.enum(["head", "spouse", "child", "dependant"]),
  });

  app.post("/households", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createHouseholdSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.household).values({ id, congregationId: c.get("congregationId")!, name: parsed.data.name, createdAt: now });
    const [r] = await db.select().from(schema.household).where(eq(schema.household.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "household.create", resourceType: "household", resourceId: id });
    return c.json(r, 201);
  });

  app.get("/households", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.household).where(eq(schema.household.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.patch("/households/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = createHouseholdSchema.partial().safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    await db.update(schema.household).set(parsed.data).where(eq(schema.household.id, c.req.param("id")));
    const [r] = await db.select().from(schema.household).where(eq(schema.household.id, c.req.param("id")));
    return c.json(r);
  });

  app.delete("/households/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.household).where(eq(schema.household.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "household.delete", resourceType: "household", resourceId: id });
    return c.json({ ok: true });
  });

  app.post("/households/:id/members", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = householdMemberSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const id = generateId();
    await db.insert(schema.householdMember).values({ id, householdId: c.req.param("id"), personId: parsed.data.personId, relationship: parsed.data.relationship, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.householdMember).where(eq(schema.householdMember.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "household.member_add", resourceType: "household_member", resourceId: id });
    return c.json(r, 201);
  });

  app.get("/households/:id/members", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const rows = await getDb(c).select().from(schema.householdMember).where(eq(schema.householdMember.householdId, c.req.param("id")));
    return c.json(rows);
  });

  app.delete("/household-members/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.householdMember).where(eq(schema.householdMember.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "household.member_remove", resourceType: "household_member", resourceId: id });
    return c.json({ ok: true });
  });

  app.post("/candidacies", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = createCandidacySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

    const id = generateId();
    await db.insert(schema.candidacy).values({ id, personId: parsed.data.personId, congregationId: c.get("congregationId")!, stage: parsed.data.stage, startDate: parsed.data.startDate, decisionDate: parsed.data.decisionDate || null, decisionType: parsed.data.decisionType || null, officiatingPastorId: parsed.data.officiatingPastorId || null, createdAt: new Date().toISOString() });
    const [r] = await db.select().from(schema.candidacy).where(eq(schema.candidacy.id, id));
    await recordAudit(db, c.get("userId"), c.get("congregationId")!, { action: "candidacy.create", resourceType: "candidacy", resourceId: id });
    return c.json(r, 201);
  });

  app.get("/candidacies", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const rows = await getDb(c).select().from(schema.candidacy).where(eq(schema.candidacy.congregationId, c.get("congregationId")!)).limit(limit).offset(offset);
    return c.json(rows);
  });

  app.patch("/candidacies/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const parsed = candidacyPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    await db.update(schema.candidacy).set(parsed.data as any).where(eq(schema.candidacy.id, c.req.param("id")));
    const [r] = await db.select().from(schema.candidacy).where(eq(schema.candidacy.id, c.req.param("id")));
    return c.json(r);
  });

  app.delete("/candidacies/:id", requireAuth(), loadRoles(), requireWriteAccess("clerk"), async (c) => {
    const db = getDb(c);
    const id = c.req.param("id");
    await db.delete(schema.candidacy).where(eq(schema.candidacy.id, id));
    return c.json({ ok: true });
  });
}
