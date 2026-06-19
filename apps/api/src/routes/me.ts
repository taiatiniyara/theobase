import type { AppType } from "../types";
import { and, eq } from "drizzle-orm";
import * as schema from "@theobase/db";
import { z } from "@theobase/shared";
import { requireAuth } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerMeRoutes(app: AppType) {
  const updateProfileSchema = z.object({
    phone: z.string().regex(/^\+?[0-9\s\-()]{6,20}$/, "Invalid phone format").optional(),
    address: z.string().max(200).optional(),
  });

  app.get("/me", requireAuth(), loadRoles(), async (c) => {
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
    const roles: string[] = c.get("userRoles") || [];

    if (personId && congregationId) {
      const receipts = await db
        .select()
        .from(schema.receipt)
        .where(and(eq(schema.receipt.memberId, personId), eq(schema.receipt.congregationId, congregationId)));

      giving.totalReceipts = receipts.length;
      giving.approvedCount = receipts.filter((r: any) => r.status === "approved").length;
      giving.pendingCount = receipts.filter((r: any) => r.status === "pending").length;
      giving.totalAmount = receipts.reduce((sum: number, r: any) => sum + r.amount, 0);
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

  app.patch("/me", requireAuth(), async (c) => {
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
}
