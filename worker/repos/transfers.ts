import { eq, and, or, isNotNull, sql, inArray } from "drizzle-orm";
import type { Db } from "../lib/db";
import { transferRequests } from "../schema";

export type TransferRow = typeof transferRequests.$inferSelect;

export interface TransferFilters {
  churchId?: number;
  status?: string;
}

export class TransferRepo {
  constructor(private db: Db) {}

  async findById(id: number): Promise<TransferRow | undefined> {
    return this.db.select().from(transferRequests).where(eq(transferRequests.id, id)).get();
  }

  async findAll(filters: TransferFilters = {}): Promise<TransferRow[]> {
    const conditions = [];
    if (filters.churchId) {
      conditions.push(
        or(
          eq(transferRequests.fromChurchId, filters.churchId),
          eq(transferRequests.toChurchId, filters.churchId)
        )
      );
    }
    if (filters.status) {
      conditions.push(eq(transferRequests.status, filters.status));
    }

    const query = this.db.select().from(transferRequests);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(transferRequests.initiatedAt)
        .all();
    }
    return query.orderBy(transferRequests.initiatedAt).all();
  }

  async hasPendingForMember(memberId: number): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(transferRequests)
      .where(
        and(
          eq(transferRequests.memberId, memberId),
          inArray(transferRequests.status, ["pending_conference", "pending_destination"])
        )
      )
      .get();
    return !!existing;
  }

  async create(data: {
    memberId: number;
    fromChurchId: number;
    toChurchId: number;
    initiatedBy: number;
  }): Promise<TransferRow> {
    return this.db
      .insert(transferRequests)
      .values({
        memberId: data.memberId,
        fromChurchId: data.fromChurchId,
        toChurchId: data.toChurchId,
        initiatedBy: data.initiatedBy,
        status: "pending_conference",
        expiresAt: sql`datetime('now', '+6 months')`,
      } as never)
      .returning()
      .get();
  }

  async approve(transferId: number, approvedBy: number): Promise<void> {
    await this.db
      .update(transferRequests)
      .set({
        status: "pending_destination",
        conferenceApprovedBy: approvedBy,
        conferenceApprovedAt: sql`datetime('now')`,
      } as never)
      .where(eq(transferRequests.id, transferId))
      .run();
  }

  async accept(transferId: number, acceptedBy: number): Promise<void> {
    await this.db
      .update(transferRequests)
      .set({
        status: "completed",
        acceptedBy,
        acceptedAt: sql`datetime('now')`,
      } as never)
      .where(eq(transferRequests.id, transferId))
      .run();
  }

  async reject(transferId: number, note?: string): Promise<void> {
    await this.db
      .update(transferRequests)
      .set({ status: "rejected", rejectionNote: note ?? null } as never)
      .where(eq(transferRequests.id, transferId))
      .run();
  }

  async override(
    transferId: number,
    action: "force_approve" | "force_reject",
    userId: number,
    note?: string
  ): Promise<void> {
    if (action === "force_approve") {
      await this.db
        .update(transferRequests)
        .set({
          status: "completed",
          overrideBy: userId,
          overrideAt: sql`datetime('now')`,
          overrideAction: "force_approve",
          overrideNote: note ?? null,
          acceptedBy: userId,
          acceptedAt: sql`datetime('now')`,
        } as never)
        .where(eq(transferRequests.id, transferId))
        .run();
    } else {
      await this.db
        .update(transferRequests)
        .set({
          status: "rejected",
          overrideBy: userId,
          overrideAt: sql`datetime('now')`,
          overrideAction: "force_reject",
          overrideNote: note ?? null,
        } as never)
        .where(eq(transferRequests.id, transferId))
        .run();
    }
  }

  async overrideToDestination(transferId: number, userId: number, note?: string): Promise<void> {
    await this.db
      .update(transferRequests)
      .set({
        status: "pending_destination",
        overrideBy: userId,
        overrideAt: sql`datetime('now')`,
        overrideAction: "force_approve",
        overrideNote: note ?? null,
        conferenceApprovedBy: userId,
        conferenceApprovedAt: sql`datetime('now')`,
      } as never)
      .where(eq(transferRequests.id, transferId))
      .run();
  }

  async expireStale(): Promise<number[]> {
    const stale = await this.db
      .select({ id: transferRequests.id, memberId: transferRequests.memberId })
      .from(transferRequests)
      .where(
        and(
          inArray(transferRequests.status, ["pending_conference", "pending_destination"]),
          isNotNull(transferRequests.expiresAt)
        )
      )
      .all();

    const expiredMemberIds: number[] = [];
    const now = new Date();

    for (const t of stale) {
      const tr = await this.db
        .select({ expiresAt: transferRequests.expiresAt })
        .from(transferRequests)
        .where(eq(transferRequests.id, t.id))
        .get();
      if (tr?.expiresAt && new Date(tr.expiresAt) < now) {
        expiredMemberIds.push(t.memberId);
        await this.db
          .update(transferRequests)
          .set({ status: "expired" } as never)
          .where(eq(transferRequests.id, t.id))
          .run();
      }
    }

    return expiredMemberIds;
  }
}
