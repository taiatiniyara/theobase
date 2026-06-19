import type { AppType } from "../types";
import { eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerReceiptRoutes(app: AppType) {
  const createReceiptSchema = z.object({
    amount: z.number().int().positive(),
    fundSplit: z.record(z.string(), z.number().int().nonnegative()),
  });

  app.post("/receipts", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "member"), async (c) => {
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

  app.get("/receipts", requireAuth(), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const receipts = await db
      .select()
      .from(schema.receipt)
      .where(eq(schema.receipt.congregationId, congregationId))
      .orderBy(asc(schema.receipt.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json(receipts);
  });

  app.post("/receipts/:id/verify", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
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

  app.post("/receipts/:id/upload", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const recId = c.req.param("id");

    const [rec] = await db.select().from(schema.receipt).where(eq(schema.receipt.id, recId));
    if (!rec) return c.json({ error: "Not found" }, 404);

    const formData = await c.req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    const key = `receipts/${recId}/${Date.now()}-${(file as File).name || "receipt.png"}`;
    await c.env.STORAGE.put(key, (file as File).stream());

    await db.update(schema.receipt).set({ imageKey: key }).where(eq(schema.receipt.id, recId));

    const [updated] = await db.select().from(schema.receipt).where(eq(schema.receipt.id, recId));
    return c.json(updated, 200);
  });
}
