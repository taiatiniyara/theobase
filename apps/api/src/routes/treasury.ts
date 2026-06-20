import type { AppType } from "../types";
import { and, eq, asc } from "drizzle-orm";
import * as schema from "@theobase/db";
import { generateId, z } from "@theobase/shared";
import { requireAuth, requireRole, requireWriteAccess } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";
import { recordAudit } from "../middleware/audit";

export function registerTreasuryRoutes(app: AppType) {
  const createExpenseSchema = z.object({
    amount: z.number().int().positive(),
    description: z.string().min(1).max(500),
    category: z.enum(["church_budget", "pathfinders", "sabbath_school", "adra", "local_church", "dorcas", "health", "other"]),
    receiptId: z.string().optional(),
    boardDecisionId: z.string().optional(),
  });

  app.post("/treasury/expenses", requireAuth(), loadRoles(), requireWriteAccess("clerk", "treasurer"), async (c) => {
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

    await recordAudit(db, c.get("userId"), congregationId, {
      action: "expense.create",
      resourceType: "expense",
      resourceId: id,
      details: JSON.stringify({ amount: parsed.data.amount, category: parsed.data.category }),
    });

    return c.json(created, 201);
  });

  app.get("/treasury/expenses", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json([]);

    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const expenses = await db
      .select()
      .from(schema.expense)
      .where(eq(schema.expense.congregationId, congregationId))
      .orderBy(asc(schema.expense.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json(expenses);
  });

  app.get("/treasury/balance", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

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
}
