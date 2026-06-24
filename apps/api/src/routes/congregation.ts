import type { AppType } from "../types";
import { eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, createJwt } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { getEmailSender } from "../middleware/get-email";
import { renderInviteEmail } from "@theobase/email";
import { generateToken } from "@theobase/auth";
import { recordAudit } from "../middleware/audit";

export function registerCongregationRoutes(app: AppType) {
  const createCongregationSchema = z.object({
    name: z.string().min(2).max(200),
    type: z.enum(["local_church", "company", "branch"]),
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

  const bankAccountSchema = z.object({
    bankName: z.string().min(1).max(200),
    accountName: z.string().min(1).max(200),
    accountNumber: z.string().min(1).max(100),
  });

  const inviteSchema = z.object({
    email: z.string().email(),
    role: z.string().min(1),
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
      inviteCode: String(Math.floor(10000000 + Math.random() * 90000000)),
      createdAt: now,
    });

    const userId = c.get("userId");
    const [creator] = await db
      .select({
        email: schema.user.email,
        personId: schema.user.personId,
        congregationId: schema.user.congregationId,
      })
      .from(schema.user)
      .where(eq(schema.user.id, userId));

    if (creator && !creator.personId) {
      const personId = generateId();
      const emailPrefix = (creator.email || "clerk").split("@")[0];

      await db.insert(schema.person).values({
        id: personId,
        congregationId: id,
        firstName: emailPrefix,
        lastName: "Clerk",
        email: creator.email,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(schema.role).values({
        id: generateId(),
        personId,
        congregationId: id,
        roleType: "clerk",
        createdAt: now,
      });

      await db
        .update(schema.user)
        .set({ personId, congregationId: id })
        .where(eq(schema.user.id, userId));

      const jwt = await createJwt(
        { userId, congregationId: id },
        (c.env as any).JWT_SECRET
      );
      c.header(
        "Set-Cookie",
        `token=${jwt}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=86400`
      );
    }

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

  app.get(
    "/congregations/:id/members",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const congId = c.req.param("id");
      const persons = await db
        .select()
        .from(schema.person)
        .where(eq(schema.person.congregationId, congId));
      const roles = await db
        .select()
        .from(schema.role)
        .where(eq(schema.role.congregationId, congId));
      return c.json({ persons, roles });
    }
  );

  app.patch(
    "/congregations/:id",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const body = await c.req.json();
      const parsed = updateCongregationSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const congId = c.req.param("id");
      const updates: Record<string, any> = {};
      if (parsed.data.name !== undefined) updates.name = parsed.data.name;
      if (parsed.data.timezone !== undefined)
        updates.timezone = parsed.data.timezone;
      if (parsed.data.organizationId !== undefined)
        updates.organizationId = parsed.data.organizationId;

      if (Object.keys(updates).length > 0) {
        await db
          .update(schema.congregation)
          .set(updates)
          .where(eq(schema.congregation.id, congId));
      }

      const [updated] = await db
        .select()
        .from(schema.congregation)
        .where(eq(schema.congregation.id, congId));

      if (!updated) return c.json({ error: "Not found" }, 404);
      return c.json(updated);
    }
  );

  app.post(
    "/congregations/:id/invite",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const body = await c.req.json();
      const parsed = inviteSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const db = getDb(c);
      const congId = c.req.param("id");
      const { email, role } = parsed.data;

      const existingRoles = await db
        .select()
        .from(schema.role)
        .where(eq(schema.role.congregationId, congId));

      const roleExists = existingRoles.some(
        (r: any) => r.roleType === role && r.personId === null
      );
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

      const sendEmail = await getEmailSender(c);
      const appUrl = (c.env as any).APP_URL || "https://theobase.app";
      await sendEmail({
        to: email,
        subject: "You've been invited to Theobase",
        html: renderInviteEmail({
          role,
          joinUrl: `${appUrl}/join?congregation=${congId}&role=${role}&token=${token}`,
        }),
      });

      await recordAudit(db, c.get("userId"), c.get("congregationId") || "", {
        action: "congregation.invite_officer",
        resourceType: "role",
        details: JSON.stringify({ email: email.toLowerCase(), role }),
      });

      return c.json({ ok: true });
    }
  );

  app.post(
    "/congregations/:id/members/import",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const body = await c.req.json();
      const parsed = importMemberSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }

      const congId = c.req.param("id");
      const lines = parsed.data.csv.trim().split("\n");
      if (lines.length < 2) {
        return c.json(
          { error: "CSV must have header and at least one row" },
          400
        );
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
          errors.push({
            row: i + 2,
            message: err.message || "Failed to insert",
          });
        }
      }

      return c.json(
        { imported: personIds.length, errors, personIds },
        personIds.length > 0 ? 201 : 200
      );
    }
  );

  app.post(
    "/congregations/:id/bank-account",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const body = await c.req.json();
      const parsed = bankAccountSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues }, 400);
      }
      const { bankName, accountName, accountNumber } = parsed.data;
      const id = generateId();
      const now = new Date().toISOString();
      await db.insert(schema.bankAccount).values({
        id,
        congregationId: c.req.param("id"),
        bankName,
        accountName,
        accountNumber,
        createdAt: now,
      });
      const [r] = await db
        .select()
        .from(schema.bankAccount)
        .where(eq(schema.bankAccount.id, id));
      await recordAudit(db, c.get("userId"), c.get("congregationId") || "", {
        action: "bank_account.create",
        resourceType: "bank_account",
        resourceId: id,
      });
      return c.json(r, 201);
    }
  );

  app.get(
    "/congregations/:id/bank-account",
    requireAuth(),
    loadRoles(),
    requireRole("clerk", "treasurer"),
    async (c) => {
      const congId = c.req.param("id");
      if (c.get("congregationId") !== congId)
        return c.json({ error: "Access denied" }, 403);
      const [r] = await getDb(c)
        .select()
        .from(schema.bankAccount)
        .where(eq(schema.bankAccount.congregationId, congId));
      return c.json(r || null);
    }
  );

  app.get(
    "/congregations/:id/invite-code",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const congId = c.req.param("id");
      const [cong] = await db
        .select({ inviteCode: schema.congregation.inviteCode })
        .from(schema.congregation)
        .where(eq(schema.congregation.id, congId));
      if (!cong) return c.json({ error: "Not found" }, 404);
      return c.json({ inviteCode: cong.inviteCode });
    }
  );

  app.post(
    "/congregations/:id/regenerate-code",
    requireAuth(),
    loadRoles(),
    requireRole("clerk"),
    async (c) => {
      const db = getDb(c);
      const congId = c.req.param("id");
      const newCode = String(Math.floor(10000000 + Math.random() * 90000000));
      await db
        .update(schema.congregation)
        .set({ inviteCode: newCode })
        .where(eq(schema.congregation.id, congId));
      return c.json({ inviteCode: newCode });
    }
  );

  app.post("/congregations/join", requireAuth(), async (c) => {
    const db = getDb(c);
    const { code } = await c.req.json<{ code: string }>();

    if (!code || code.length !== 8 || !/^\d{8}$/.test(code)) {
      return c.json({ error: "Invalid invite code. Must be 8 digits." }, 400);
    }

    const [cong] = await db
      .select()
      .from(schema.congregation)
      .where(eq(schema.congregation.inviteCode, code));

    if (!cong) {
      return c.json({ error: "Invalid invite code." }, 404);
    }

    const userId = c.get("userId");
    const [user] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (user.congregationId) {
      return c.json({ error: "You already belong to a congregation." }, 409);
    }

    const now = new Date().toISOString();
    const personId = generateId();

    await db.insert(schema.person).values({
      id: personId,
      congregationId: cong.id,
      firstName: user.email.split("@")[0],
      lastName: "Member",
      email: user.email,
      isMember: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.role).values({
      id: generateId(),
      personId,
      congregationId: cong.id,
      roleType: "member",
      createdAt: now,
    });

    await db
      .update(schema.user)
      .set({ personId, congregationId: cong.id })
      .where(eq(schema.user.id, userId));

    const jwt = await createJwt(
      { userId, congregationId: cong.id },
      (c.env as any).JWT_SECRET
    );
    c.header(
      "Set-Cookie",
      `token=${jwt}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=86400`
    );

    return c.json({ ok: true, congregationName: cong.name });
  });
}
