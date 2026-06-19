import { Hono } from "hono";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@theobase/db";
import { eq, and, isNull, asc } from "drizzle-orm";
import { generateToken, createJwt, getTokenTtlSeconds, requireAuth as createRequireAuth } from "@theobase/auth";
import { createEmailSender } from "@theobase/email";
import { generateId, z } from "@theobase/shared";

const requireAuth = createRequireAuth();
async function loadUserRoles(db: DrizzleD1Database<typeof schema>, userId: string, congregationId?: string): Promise<string[]> {
  if (!congregationId) return [];

  const [user] = await db
    .select({ personId: schema.user.personId })
    .from(schema.user)
    .where(eq(schema.user.id, userId));

  if (!user?.personId) return [];

  const roleRows = await db
    .select({ roleType: schema.role.roleType })
    .from(schema.role)
    .where(and(eq(schema.role.personId, user.personId), eq(schema.role.congregationId, congregationId)));

  return roleRows.map((r) => r.roleType);
}

function getEmailSender(c: any) {
  const env = c.env as Bindings;
  return createEmailSender({
    relayUrl: env.SMTP_RELAY_URL,
    relayToken: env.SMTP_RELAY_TOKEN,
  });
}

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  SMTP_RELAY_URL: string;
  SMTP_RELAY_TOKEN: string;
};

type Variables = {
  userId: string;
  congregationId?: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
});

function getDb(c: any): DrizzleD1Database<typeof schema> {
  return drizzle(c.env.DB, { schema });
}

app.post("/auth/request", async (c) => {
  const { email } = await c.req.json<{ email: string }>();
  if (!email || !email.includes("@")) {
    return c.json({ error: "Valid email required" }, 400);
  }

  const db = getDb(c);
  const token = generateToken();
  const now = new Date().toISOString();
  const ttl = getTokenTtlSeconds();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await db.insert(schema.authToken).values({
    id: generateId(),
    email: email.toLowerCase(),
    token,
    expiresAt,
    createdAt: now,
  });

  const appUrl = (globalThis as any).APP_URL || "https://theobase.app";
  const magicLink = `${appUrl}/auth/verify?token=${token}`;

  const sendEmail = getEmailSender(c); await sendEmail({
    to: email,
    subject: "Sign in to Theobase",
    html: `<p>Click the link below to sign in:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link expires in 10 minutes.</p>`,
  });

  return c.json({ ok: true });
});

app.post("/auth/verify", async (c) => {
  const { token } = await c.req.json<{ token: string }>();
  if (!token) {
    return c.json({ error: "Token required" }, 400);
  }

  const db = getDb(c);
  const now = new Date().toISOString();

  const [found] = await db
    .select()
    .from(schema.authToken)
    .where(and(eq(schema.authToken.token, token), isNull(schema.authToken.usedAt)));

  if (!found || found.expiresAt < now) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  await db
    .update(schema.authToken)
    .set({ usedAt: now })
    .where(eq(schema.authToken.id, found.id));

  let user: typeof schema.user.$inferSelect | undefined;
  [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, found.email));

  if (!user) {
    const id = generateId();
    await db.insert(schema.user).values({
      id,
      email: found.email,
      createdAt: now,
    });
    user = { id, email: found.email, personId: null, congregationId: null, createdAt: now };
  }

  // Auto-assign pending roles: if user has no congregation, check invite tokens
  if (!user.congregationId) {
    // Try to link user to a person record with matching email
    let personId = user.personId;
    if (!personId) {
      const [person] = await db
        .select({ id: schema.person.id, congregationId: schema.person.congregationId })
        .from(schema.person)
        .where(eq(schema.person.email, found.email));
      if (person) {
        personId = person.id;
        await db
          .update(schema.user)
          .set({ personId: person.id, congregationId: person.congregationId })
          .where(eq(schema.user.id, user.id));
        user.personId = person.id;
        user.congregationId = person.congregationId;
      }
    }

    if (personId) {
      const [person] = await db
        .select({ congregationId: schema.person.congregationId })
        .from(schema.person)
        .where(eq(schema.person.id, personId));

      if (person?.congregationId) {
        const pendingRoles = await db
          .select()
          .from(schema.role)
          .where(and(
            eq(schema.role.congregationId, person.congregationId),
            isNull(schema.role.personId)
          ));

        for (const role of pendingRoles) {
          await db
            .update(schema.role)
            .set({ personId })
            .where(eq(schema.role.id, role.id));
        }

        if (!user.congregationId) {
          await db
            .update(schema.user)
            .set({ congregationId: person.congregationId })
            .where(eq(schema.user.id, user.id));
          user.congregationId = person.congregationId;
        }
      }
    }
  }

  const jwt = await createJwt({ userId: user.id, congregationId: user.congregationId ?? undefined }, c.env.JWT_SECRET || "theobase-dev-secret-change-in-production");
  c.header("Set-Cookie", `token=${jwt}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=86400`);
  return c.json({ ok: true, userId: user.id, token: jwt });
});

app.get("/me", requireAuth, async (c) => {
  const db = getDb(c);
  const userId = c.get("userId");
  const congregationId = c.get("congregationId");

  const [row] = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      congregationId: schema.user.congregationId,
      personId: schema.person.id,
      firstName: schema.person.firstName,
      lastName: schema.person.lastName,
      phone: schema.person.phone,
      address: schema.person.address,
      isMember: schema.person.isMember,
    })
    .from(schema.user)
    .leftJoin(schema.person, eq(schema.user.personId, schema.person.id))
    .where(eq(schema.user.id, userId));

  if (!row) return c.json({ error: "User not found" }, 404);

  const personId = row.personId;

  const giving = { totalReceipts: 0, approvedCount: 0, pendingCount: 0, totalAmount: 0 };
  const roles: string[] = [];

  if (personId && congregationId) {
    const receipts = await db
      .select()
      .from(schema.receipt)
      .where(and(eq(schema.receipt.memberId, personId), eq(schema.receipt.congregationId, congregationId)));

    giving.totalReceipts = receipts.length;
    giving.approvedCount = receipts.filter((r) => r.status === "approved").length;
    giving.pendingCount = receipts.filter((r) => r.status === "pending").length;
    giving.totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

    const roleRows = await db
      .select({ roleType: schema.role.roleType })
      .from(schema.role)
      .where(and(eq(schema.role.personId, personId), eq(schema.role.congregationId, congregationId)));

    roles.push(...roleRows.map((r) => r.roleType));
  }

  return c.json({
    id: row.id,
    email: row.email,
    congregationId: row.congregationId,
    personId: row.personId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    address: row.address,
    isMember: !!row.isMember,
    giving,
    roles,
  });
});

const updateProfileSchema = z.object({
  phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone format").optional(),
  address: z.string().max(200).optional(),
});

app.patch("/me", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const userId = c.get("userId");
  const db = getDb(c);

  const [user] = await db
    .select({ personId: schema.user.personId })
    .from(schema.user)
    .where(eq(schema.user.id, userId));

  if (!user?.personId) {
    return c.json({ error: "No profile linked" }, 400);
  }

  const updates: Record<string, string> = {};
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;
  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date().toISOString();
  }

  await db
    .update(schema.person)
    .set(updates)
    .where(eq(schema.person.id, user.personId));

  const [row] = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      congregationId: schema.user.congregationId,
      personId: schema.person.id,
      firstName: schema.person.firstName,
      lastName: schema.person.lastName,
      phone: schema.person.phone,
      address: schema.person.address,
      isMember: schema.person.isMember,
    })
    .from(schema.user)
    .leftJoin(schema.person, eq(schema.user.personId, schema.person.id))
    .where(eq(schema.user.id, userId));

  if (!row) return c.json({ error: "User not found" }, 404);

  return c.json({
    id: row.id,
    email: row.email,
    congregationId: row.congregationId,
    personId: row.personId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    address: row.address,
    isMember: !!row.isMember,
  });
});

const createCongregationSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["church", "company", "branch"]),
  timezone: z.string().default("UTC"),
  parentId: z.string().optional(),
  parentType: z.enum(["congregation", "organization"]).optional(),
  organizationId: z.string().optional(),
});

app.post("/congregations", requireAuth, async (c) => {
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

app.get("/congregations/:id", requireAuth, async (c) => {
  const db = getDb(c);
  const [cong] = await db
    .select()
    .from(schema.congregation)
    .where(eq(schema.congregation.id, c.req.param("id")));

  if (!cong) return c.json({ error: "Not found" }, 404);
  return c.json(cong);
});

const updateCongregationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  timezone: z.string().optional(),
  organizationId: z.string().optional(),
});

app.patch("/congregations/:id", requireAuth, async (c) => {
  const db = getDb(c);
  const userId = c.get("userId");
  const congregationId = c.get("congregationId");
  const roles = await loadUserRoles(db, userId, congregationId);
  if (!roles.includes("clerk")) {
    return c.json({ error: "Insufficient permissions" }, 403);
  }

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

app.post("/congregations/:id/invite", requireAuth, async (c) => {
  const { email, role } = await c.req.json<{ email: string; role: string }>();
  if (!email || !role) {
    return c.json({ error: "Email and role required" }, 400);
  }

  const db = getDb(c);
  const congId = c.req.param("id");
  const userId = c.get("userId");
  const congregationId = c.get("congregationId");

  // Only clerk can invite
  const roles = await loadUserRoles(db, userId, congregationId);
  if (!roles.includes("clerk")) {
    return c.json({ error: "Insufficient permissions" }, 403);
  }

  // Create a pending role without a person (personId will be set when invitee logs in)
  const existingRoles = await db
    .select()
    .from(schema.role)
    .where(and(eq(schema.role.congregationId, congId), eq(schema.role.roleType, role as any)));

  // Only create if no existing role of this type for this congregation
  if (existingRoles.length === 0) {
    await db.insert(schema.role).values({
      id: generateId(),
      personId: null,
      congregationId: congId,
      roleType: role as any,
      createdAt: new Date().toISOString(),
    });
  }

  // Generate invite token
  const token = generateToken();
  const now = new Date().toISOString();
  await db.insert(schema.authToken).values({
    id: generateId(),
    email: email.toLowerCase(),
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    createdAt: now,
  });

  const sendEmail = getEmailSender(c); await sendEmail({
    to: email,
    subject: "You've been invited to Theobase",
    html: `<p>You have been invited to join a congregation on Theobase as <strong>${role}</strong>.</p><p>Click the link below to sign up:</p><p><a href="https://theobase.app/join?congregation=${congId}&role=${role}&token=${token}">Join Theobase</a></p>`,
  });

  return c.json({ ok: true });
});

const importMemberSchema = z.object({
  csv: z.string().min(1),
});

app.post("/congregations/:id/members/import", requireAuth, async (c) => {
  const db = getDb(c);
  const userId = c.get("userId");
  const congregationId = c.get("congregationId");
  const roles = await loadUserRoles(db, userId, congregationId);
  if (!roles.includes("clerk")) {
    return c.json({ error: "Insufficient permissions" }, 403);
  }

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

const createReceiptSchema = z.object({
  amount: z.number().int().positive(),
  fundSplit: z.record(z.string(), z.number().int().nonnegative()),
});

app.post("/receipts", requireAuth, async (c) => {
  const db = getDb(c);
  const body = await c.req.json();
  const parsed = createReceiptSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues }, 400);
  }

  const splitTotal = Object.values(parsed.data.fundSplit).reduce((sum, v) => sum + v, 0);
  if (splitTotal !== parsed.data.amount) {
    return c.json({ error: "Fund split total does not match receipt amount" }, 400);
  }

  const userId = c.get("userId");
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json({ error: "No congregation" }, 400);

  const [user] = await db
    .select({ personId: schema.user.personId })
    .from(schema.user)
    .where(eq(schema.user.id, userId));

  if (!user?.personId) return c.json({ error: "No profile linked" }, 400);

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(schema.receipt).values({
    id,
    congregationId,
    memberId: user.personId,
    amount: parsed.data.amount,
    fundSplit: parsed.data.fundSplit,
    status: "pending",
    createdAt: now,
  });

  const [created] = await db.select().from(schema.receipt).where(eq(schema.receipt.id, id));
  return c.json(created, 201);
});

app.get("/receipts", requireAuth, async (c) => {
  const db = getDb(c);
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json([]);

  const receipts = await db
    .select()
    .from(schema.receipt)
    .where(eq(schema.receipt.congregationId, congregationId))
    .orderBy(asc(schema.receipt.createdAt));

  return c.json(receipts);
});

app.post("/receipts/:id/verify", requireAuth, async (c) => {
  const db = getDb(c);
  const { approved, note } = await c.req.json<{ approved: boolean; note?: string }>();
  const recId = c.req.param("id");

  const [rec] = await db.select().from(schema.receipt).where(eq(schema.receipt.id, recId));
  if (!rec) return c.json({ error: "Not found" }, 404);

  if (rec.status !== "pending") {
    return c.json({ error: "Receipt already processed" }, 400);
  }

  const userId = c.get("userId");
  const [verifier] = await db
    .select({ personId: schema.user.personId })
    .from(schema.user)
    .where(eq(schema.user.id, userId));

  if (!verifier?.personId) return c.json({ error: "No profile linked" }, 400);

  const now = new Date().toISOString();
  const status = approved ? "approved" : "rejected";

  await db.update(schema.receipt).set({
    status,
    verifiedById: verifier.personId,
    verifiedAt: now,
    rejectionNote: approved ? null : (note || null),
  }).where(eq(schema.receipt.id, recId));

  const [updated] = await db.select().from(schema.receipt).where(eq(schema.receipt.id, recId));
  return c.json(updated);
});

const createMeetingSchema = z.object({
  date: z.string(),
  agenda: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
});

app.post("/board/meetings", requireAuth, async (c) => {
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
  return c.json({ ...created, agenda: created.agenda ? JSON.parse(created.agenda) : null }, 201);
});

app.get("/board/meetings", requireAuth, async (c) => {
  const db = getDb(c);
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json([]);

  const meetings = await db
    .select()
    .from(schema.boardMeeting)
    .where(eq(schema.boardMeeting.congregationId, congregationId))
    .orderBy(asc(schema.boardMeeting.date));

  return c.json(meetings.map((m) => ({ ...m, agenda: m.agenda ? JSON.parse(m.agenda) : null })));
});

app.get("/board/meetings/:id", requireAuth, async (c) => {
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

app.post("/board/meetings/:id/decisions", requireAuth, async (c) => {
  const db = getDb(c);
  const body = await c.req.json<{ title: string; description?: string; moverId?: string; seconderId?: string; voteOutcome?: string }>();
  if (!body.title) return c.json({ error: "Title required" }, 400);

  const meetingId = c.req.param("id");
  const userId = c.get("userId");

  const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
  if (!user?.personId) return c.json({ error: "No profile" }, 400);

  const decisions = await db
    .select({ number: schema.boardDecision.number })
    .from(schema.boardDecision)
    .where(eq(schema.boardDecision.meetingId, meetingId));

  const nextNumber = decisions.length > 0 ? Math.max(...decisions.map((d) => d.number)) + 1 : 1;

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
  return c.json(created, 201);
});

const createSlotSchema = z.object({
  date: z.string(),
  role: z.enum(["elder", "preacher", "deacon", "deaconess", "musician", "av_operator", "youth_leader"]),
  volunteerId: z.string().optional(),
});

app.post("/rota/slots", requireAuth, async (c) => {
  const db = getDb(c);
  const body = await c.req.json();
  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json({ error: "No congregation" }, 400);

  if (parsed.data.volunteerId && ["youth_leader"].includes(parsed.data.role)) {
    const [clearance] = await db
      .select()
      .from(schema.safetyClearance)
      .where(eq(schema.safetyClearance.volunteerId, parsed.data.volunteerId));
    if (!clearance || clearance.expiryDate < new Date().toISOString()) {
      return c.json({ error: "Volunteer lacks valid safety clearance for youth duties" }, 400);
    }
  }

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(schema.dutySlot).values({
    id,
    congregationId,
    date: parsed.data.date,
    role: parsed.data.role,
    volunteerId: parsed.data.volunteerId || null,
    status: parsed.data.volunteerId ? "assigned" : "open",
    createdAt: now,
  });

  if (parsed.data.volunteerId) {
    const [volunteer] = await db
      .select({ email: schema.person.email })
      .from(schema.person)
      .where(eq(schema.person.id, parsed.data.volunteerId));

    if (volunteer?.email) {
      const sendEmail = getEmailSender(c); await sendEmail({
        to: volunteer.email,
        subject: `You've been assigned: ${parsed.data.role} on ${parsed.data.date}`,
        html: `<p>You have been assigned as <strong>${parsed.data.role}</strong> on <strong>${parsed.data.date}</strong>.</p><p>Log in to Theobase to confirm or decline this duty.</p>`,
      });
    }
  }

  const [created] = await db.select().from(schema.dutySlot).where(eq(schema.dutySlot.id, id));
  return c.json(created, 201);
});

app.get("/rota/:date", requireAuth, async (c) => {
  const db = getDb(c);
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json([]);

  const slots = await db
    .select()
    .from(schema.dutySlot)
    .where(and(eq(schema.dutySlot.congregationId, congregationId), eq(schema.dutySlot.date, c.req.param("date"))));

  return c.json(slots);
});

const createExpenseSchema = z.object({
  amount: z.number().int().positive(),
  description: z.string().min(1).max(500),
  category: z.enum(["church_budget", "pathfinders", "sabbath_school", "dorcas", "health", "other"]),
  receiptId: z.string().optional(),
  boardDecisionId: z.string().optional(),
});

app.post("/treasury/expenses", requireAuth, async (c) => {
  const db = getDb(c);
  const body = await c.req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);

  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json({ error: "No congregation" }, 400);

  const id = generateId();
  const now = new Date().toISOString();

  await db.insert(schema.expense).values({
    id,
    congregationId,
    amount: parsed.data.amount,
    description: parsed.data.description,
    category: parsed.data.category,
    receiptId: parsed.data.receiptId || null,
    boardDecisionId: parsed.data.boardDecisionId || null,
    createdAt: now,
  });

  const [created] = await db.select().from(schema.expense).where(eq(schema.expense.id, id));
  return c.json(created, 201);
});

app.get("/treasury/expenses", requireAuth, async (c) => {
  const db = getDb(c);
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json([]);

  const expenses = await db
    .select()
    .from(schema.expense)
    .where(eq(schema.expense.congregationId, congregationId))
    .orderBy(asc(schema.expense.createdAt));

  return c.json(expenses);
});

app.get("/treasury/balance", requireAuth, async (c) => {
  const db = getDb(c);
  const congregationId = c.get("congregationId");
  if (!congregationId) return c.json({});

  const receipts = await db
    .select()
    .from(schema.receipt)
    .where(and(eq(schema.receipt.congregationId, congregationId), eq(schema.receipt.status, "approved")));

  const expenses = await db
    .select()
    .from(schema.expense)
    .where(eq(schema.expense.congregationId, congregationId));

  const income: Record<string, number> = {};
  for (const r of receipts) {
    const split = r.fundSplit as Record<string, number>;
    for (const [fund, amount] of Object.entries(split)) {
      income[fund] = (income[fund] || 0) + amount;
    }
  }

  const spent: Record<string, number> = {};
  for (const e of expenses) {
    spent[e.category] = (spent[e.category] || 0) + e.amount;
  }

  const balance: Record<string, number> = {};
  for (const fund of new Set([...Object.keys(income), ...Object.keys(spent)])) {
    balance[fund] = (income[fund] || 0) - (spent[fund] || 0);
  }

  return c.json(balance);
});

// --- Pathfinders ---
app.post("/pathfinder/progress", requireAuth, async (c) => {
  const db = getDb(c);
  const { memberId, className, clubType, status } = await c.req.json();
  const id = generateId();
  await db.insert(schema.pathfinderProgress).values({ id, memberId, className, clubType, status, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.pathfinderProgress).where(eq(schema.pathfinderProgress.id, id));
  return c.json(r, 201);
});

app.get("/pathfinder/progress/:memberId", requireAuth, async (c) => {
  const db = getDb(c);
  const rows = await db.select().from(schema.pathfinderProgress).where(eq(schema.pathfinderProgress.memberId, c.req.param("memberId")));
  return c.json(rows);
});

app.post("/pathfinder/honors", requireAuth, async (c) => {
  const db = getDb(c);
  const { memberId, name, category, earnedAt } = await c.req.json();
  const id = generateId();
  await db.insert(schema.pathfinderHonor).values({ id, memberId, name, category, earnedAt, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.pathfinderHonor).where(eq(schema.pathfinderHonor.id, id));
  return c.json(r, 201);
});

app.get("/pathfinder/honors/:memberId", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.pathfinderHonor).where(eq(schema.pathfinderHonor.memberId, c.req.param("memberId")));
  return c.json(rows);
});

// --- Sabbath School ---
app.post("/sabbath-school/classes", requireAuth, async (c) => {
  const db = getDb(c);
  const { division, name, teacherId } = await c.req.json();
  const congregationId = c.get("congregationId")!;
  const id = generateId();
  await db.insert(schema.sabbathSchoolClass).values({ id, congregationId, division, name, teacherId, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.id, id));
  return c.json(r, 201);
});

app.get("/sabbath-school/classes", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.sabbathSchoolClass).where(eq(schema.sabbathSchoolClass.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

app.post("/sabbath-school/attendance", requireAuth, async (c) => {
  const db = getDb(c);
  const items: { classId: string; date: string; memberId: string; present: boolean }[] = (await c.req.json()).attendance;
  for (const item of items) {
    await db.insert(schema.sabbathSchoolAttendance).values({ id: generateId(), classId: item.classId, date: item.date, memberId: item.memberId, present: item.present, createdAt: new Date().toISOString() });
  }
  return c.json({ ok: true });
});

// --- Welfare ---
app.post("/welfare/cases", requireAuth, async (c) => {
  const db = getDb(c);
  const { personId, assistanceType, description, value } = await c.req.json();
  const congregationId = c.get("congregationId")!;
  const id = generateId();
  await db.insert(schema.welfareCase).values({ id, congregationId, personId, assistanceType, description, value, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.welfareCase).where(eq(schema.welfareCase.id, id));
  return c.json(r, 201);
});

app.get("/welfare/cases", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.welfareCase).where(eq(schema.welfareCase.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

app.post("/pantry/items", requireAuth, async (c) => {
  const db = getDb(c);
  const { name, quantity, unit } = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await db.insert(schema.pantryItem).values({ id, congregationId: c.get("congregationId")!, name, quantity, unit, updatedAt: now, createdAt: now });
  const [r] = await db.select().from(schema.pantryItem).where(eq(schema.pantryItem.id, id));
  return c.json(r, 201);
});

app.get("/pantry/items", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.pantryItem).where(eq(schema.pantryItem.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

// --- Health ---
app.post("/health/events", requireAuth, async (c) => {
  const db = getDb(c);
  const { name, date, type } = await c.req.json();
  const id = generateId();
  await db.insert(schema.healthEvent).values({ id, congregationId: c.get("congregationId")!, name, date, type, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.healthEvent).where(eq(schema.healthEvent.id, id));
  return c.json(r, 201);
});

app.post("/health/contacts", requireAuth, async (c) => {
  const db = getDb(c);
  const { eventId, name, phone, email, interests } = await c.req.json();
  const id = generateId();
  await db.insert(schema.healthContact).values({ id, eventId, congregationId: c.get("congregationId")!, name, phone, email, interests: JSON.stringify(interests), createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.healthContact).where(eq(schema.healthContact.id, id));
  return c.json(r, 201);
});

app.get("/health/contacts", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.healthContact).where(eq(schema.healthContact.congregationId, c.get("congregationId")!));
  return c.json(rows.map(r => ({ ...r, interests: r.interests ? JSON.parse(r.interests) : null })));
});

// --- Households & Candidacy ---
app.post("/households", requireAuth, async (c) => {
  const db = getDb(c);
  const { name } = await c.req.json();
  const id = generateId();
  await db.insert(schema.household).values({ id, congregationId: c.get("congregationId")!, name, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.household).where(eq(schema.household.id, id));
  return c.json(r, 201);
});

app.get("/households", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.household).where(eq(schema.household.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

app.post("/candidacies", requireAuth, async (c) => {
  const db = getDb(c);
  const { personId, stage, startDate } = await c.req.json();
  const id = generateId();
  await db.insert(schema.candidacy).values({ id, personId, congregationId: c.get("congregationId")!, stage, startDate, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.candidacy).where(eq(schema.candidacy.id, id));
  return c.json(r, 201);
});

app.get("/candidacies", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.candidacy).where(eq(schema.candidacy.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

// --- Communion ---
app.post("/communion", requireAuth, async (c) => {
  const db = getDb(c);
  const { date, rooms, inventory } = await c.req.json<{
    date: string;
    rooms: { name: string; gender: string; volunteerIds: string[] }[];
    inventory: { item: string; quantity: number; unit: string }[];
  }>();
  const serviceId = generateId();
  const now = new Date().toISOString();
  await db.insert(schema.communionService).values({ id: serviceId, congregationId: c.get("congregationId")!, date, createdAt: now });
  for (const room of rooms) {
    await db.insert(schema.communionRoom).values({ id: generateId(), serviceId, name: room.name, gender: room.gender as any, volunteerIds: JSON.stringify(room.volunteerIds) });
  }
  for (const inv of inventory) {
    await db.insert(schema.communionInventory).values({ id: generateId(), serviceId, item: inv.item as any, quantity: inv.quantity, unit: inv.unit });
  }
  const roomsResult = await db.select().from(schema.communionRoom).where(eq(schema.communionRoom.serviceId, serviceId));
  const invResult = await db.select().from(schema.communionInventory).where(eq(schema.communionInventory.serviceId, serviceId));
  return c.json({ id: serviceId, date, rooms: roomsResult, inventory: invResult }, 201);
});

// --- AV ---
app.post("/av/order-of-service", requireAuth, async (c) => {
  const db = getDb(c);
  const { date, items } = await c.req.json<{ date: string; items: any[] }>();
  const congregationId = c.get("congregationId")!;
  const now = new Date().toISOString();
  const [existing] = await db.select().from(schema.avOrderOfService).where(and(eq(schema.avOrderOfService.congregationId, congregationId), eq(schema.avOrderOfService.date, date)));
  const id = existing ? existing.id : generateId();
  if (existing) {
    await db.update(schema.avOrderOfService).set({ items: JSON.stringify(items), updatedAt: now }).where(eq(schema.avOrderOfService.id, id));
  } else {
    await db.insert(schema.avOrderOfService).values({ id, congregationId, date, items: JSON.stringify(items), updatedAt: now, createdAt: now });
  }
  const [r] = await db.select().from(schema.avOrderOfService).where(eq(schema.avOrderOfService.id, id));
  return c.json({ ...r, items: JSON.parse(r.items) }, 201);
});

app.get("/av/order-of-service/:date", requireAuth, async (c) => {
  const db = getDb(c);
  const [r] = await db.select().from(schema.avOrderOfService).where(and(eq(schema.avOrderOfService.congregationId, c.get("congregationId")!), eq(schema.avOrderOfService.date, c.req.param("date"))));
  if (!r) return c.json({ error: "Not found" }, 404);
  return c.json({ ...r, items: JSON.parse(r.items) });
});

// --- District Hub ---
app.post("/district/rotations", requireAuth, async (c) => {
  const db = getDb(c);
  const { congregationId, date, preacherId, topic } = await c.req.json();
  const id = generateId();
  await db.insert(schema.preachingRotation).values({ id, congregationId, date, preacherId, topic, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.preachingRotation).where(eq(schema.preachingRotation.id, id));
  return c.json(r, 201);
});

app.get("/district/rotations", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.preachingRotation).where(eq(schema.preachingRotation.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

app.post("/district/visits", requireAuth, async (c) => {
  const db = getDb(c);
  const { householdId, pastorId, date, purpose, notes } = await c.req.json();
  const id = generateId();
  await db.insert(schema.pastoralVisit).values({ id, householdId, pastorId, congregationId: c.get("congregationId")!, date, purpose, notes, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.pastoralVisit).where(eq(schema.pastoralVisit.id, id));
  return c.json(r, 201);
});

// --- Facilities ---
app.post("/facilities/bookings", requireAuth, async (c) => {
  const db = getDb(c);
  const { date, timeStart, timeEnd, purpose, requesterId } = await c.req.json();
  const id = generateId();
  await db.insert(schema.facilityBooking).values({ id, congregationId: c.get("congregationId")!, date, timeStart, timeEnd, purpose, requesterId, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.facilityBooking).where(eq(schema.facilityBooking.id, id));
  return c.json(r, 201);
});

// --- Crisis Assets ---
app.post("/crisis/assets", requireAuth, async (c) => {
  const db = getDb(c);
  const { type, description, status } = await c.req.json();
  const id = generateId();
  const now = new Date().toISOString();
  await db.insert(schema.congregationAsset).values({ id, congregationId: c.get("congregationId")!, type, description, status: status || "operational", updatedAt: now, createdAt: now });
  const [r] = await db.select().from(schema.congregationAsset).where(eq(schema.congregationAsset.id, id));
  return c.json(r, 201);
});

app.get("/crisis/assets", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.congregationAsset).where(eq(schema.congregationAsset.congregationId, c.get("congregationId")!));
  return c.json(rows);
});

// --- Transfers ---
app.post("/transfers", requireAuth, async (c) => {
  const db = getDb(c);
  const { memberId, toCongregationId } = await c.req.json();
  const userId = c.get("userId");
  const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
  const id = generateId();
  await db.insert(schema.transferRequest).values({ id, memberId, fromCongregationId: c.get("congregationId")!, toCongregationId, requestedById: user?.personId, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.transferRequest).where(eq(schema.transferRequest.id, id));
  return c.json(r, 201);
});

app.get("/transfers", requireAuth, async (c) => {
  const rows = await getDb(c).select().from(schema.transferRequest).where(eq(schema.transferRequest.fromCongregationId, c.get("congregationId")!));
  return c.json(rows);
});

// --- Nominating ---
app.post("/nominating/sessions", requireAuth, async (c) => {
  const db = getDb(c);
  const { year } = await c.req.json();
  const userId = c.get("userId");
  const [user] = await db.select({ personId: schema.user.personId }).from(schema.user).where(eq(schema.user.id, userId));
  const id = generateId();
  await db.insert(schema.nominatingSession).values({ id, congregationId: c.get("congregationId")!, year, openedById: user?.personId, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.nominatingSession).where(eq(schema.nominatingSession.id, id));
  return c.json(r, 201);
});

app.post("/nominating/roles", requireAuth, async (c) => {
  const db = getDb(c);
  const { sessionId, roleType } = await c.req.json();
  const id = generateId();
  await db.insert(schema.nominatingRole).values({ id, sessionId, roleType, createdAt: new Date().toISOString() });
  const [r] = await db.select().from(schema.nominatingRole).where(eq(schema.nominatingRole.id, id));
  return c.json(r, 201);
});

export default app;
