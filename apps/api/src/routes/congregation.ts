import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getEmailSender } from "../middleware/get-email";
import { generateToken } from "@theobase/auth";

export function registerCongregationRoutes(app: AppType) {
  const createCongregationSchema = z.object({
    name: z.string().min(2).max(200),
    type: z.enum(["church", "company", "branch"]),
    timezone: z.string().default("UTC"),
    parentId: z.string().optional(),
    parentType: z.enum(["congregation", "organization"]).optional(),
    organizationId: z.string().optional(),
  });

  const updateCongregationSchema = z.object({
    name: z.string().min(2).max(200).optional(),
    timezone: z.string().optional(),
    organizationId: z.string().optional(),
  });

  const importMemberSchema = z.object({
    csv: z.string().min(1),
  });

  app.post("/congregations", requireAuth(), async (c) => {
    const body = await c.req.json();
    const parsed = createCongregationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const db = getDb(c);
    const id = generateId();
    const now = new Date().toISOString();

    await db.insert(schema.congregation).values({
      id,
      name: parsed.data.name,
      type: parsed.data.type,
      timezone: parsed.data.timezone,
      parentId: parsed.data.parentId ?? null,
      parentType: parsed.data.parentType ?? null,
      organizationId: parsed.data.organizationId ?? null,
      createdAt: now,
    });

    const [created] = await db
      .select()
      .from(schema.congregation)
      .where(eq(schema.congregation.id, id));

    return c.json(created, 201);
  });

  app.get("/congregations/:id", requireAuth(), async (c) => {
    const db = getDb(c);
    const [cong] = await db
      .select()
      .from(schema.congregation)
      .where(eq(schema.congregation.id, c.req.param("id")));

    if (!cong) return c.json({ error: "Not found" }, 404);
    return c.json(cong);
  });

  app.patch("/congregations/:id", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = updateCongregationSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const congId = c.req.param("id");
    const updates: Record<string, any> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.timezone !== undefined) updates.timezone = parsed.data.timezone;
    if (parsed.data.organizationId !== undefined) updates.organizationId = parsed.data.organizationId;

    if (Object.keys(updates).length > 0) {
      await db.update(schema.congregation).set(updates).where(eq(schema.congregation.id, congId));
    }

    const [updated] = await db
      .select()
      .from(schema.congregation)
      .where(eq(schema.congregation.id, congId));

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  });

  app.post("/congregations/:id/invite", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const { email, role } = await c.req.json<{ email: string; role: string }>();
    if (!email || !role) {
      return c.json({ error: "Email and role required" }, 400);
    }

    const db = getDb(c);
    const congId = c.req.param("id");

    const existingRoles = await db
      .select()
      .from(schema.role)
      .where(eq(schema.role.congregationId, congId));

    const roleExists = existingRoles.some((r: any) => r.roleType === role && r.personId === null);
    if (!roleExists) {
      await db.insert(schema.role).values({
        id: generateId(),
        personId: null,
        congregationId: congId,
        roleType: role as any,
        createdAt: new Date().toISOString(),
      });
    }

    const token = generateToken();
    const now = new Date().toISOString();
    await db.insert(schema.authToken).values({
      id: generateId(),
      email: email.toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
    });

    const sendEmail = getEmailSender(c);
    await sendEmail({
      to: email,
      subject: "You've been invited to Theobase",
      html: `<p>You have been invited to join a congregation on Theobase as <strong>${role}</strong>.</p><p>Click the link below to sign up:</p><p><a href="https://theobase.app/join?congregation=${congId}&role=${role}&token=${token}">Join Theobase</a></p>`,
    });

    return c.json({ ok: true });
  });

  app.post("/congregations/:id/members/import", requireAuth(), loadRoles(), requireRole("clerk"), async (c) => {
    const db = getDb(c);
    const body = await c.req.json();
    const parsed = importMemberSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues }, 400);
    }

    const congId = c.req.param("id");
    const lines = parsed.data.csv.trim().split("\n");
    if (lines.length < 2) {
      return c.json({ error: "CSV must have header and at least one row" }, 400);
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));

    const now = new Date().toISOString();
    const personIds: string[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const record: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = row[j] || "";
      }

      const firstName = record["firstName"] || "";
      const lastName = record["lastName"] || "";
      const email = record["email"] || "";

      if (!firstName || !lastName) {
        errors.push({ row: i + 2, message: "Missing firstName or lastName" });
        continue;
      }

      const id = generateId();
      try {
        await db.insert(schema.person).values({
          id,
          congregationId: congId,
          firstName,
          lastName,
          email: email || null,
          phone: record["phone"] || null,
          isMember: record["isMember"]?.toLowerCase() === "true",
          createdAt: now,
          updatedAt: now,
        });
        personIds.push(id);
      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message || "Failed to insert" });
      }
    }

    return c.json({ imported: personIds.length, errors, personIds }, personIds.length > 0 ? 201 : 200);
  });
}
