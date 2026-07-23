import { eq, and, isNull } from "drizzle-orm";
import type { Db } from "../lib/db";
import { positions, memberPositions } from "../schema";

export type PositionRow = typeof positions.$inferSelect;
export type MemberPositionRow = typeof memberPositions.$inferSelect;

export class PositionRepo {
  constructor(private db: Db) {}

  async findAll(): Promise<PositionRow[]> {
    return this.db.select().from(positions).orderBy(positions.name).all();
  }

  async findById(id: number): Promise<PositionRow | undefined> {
    return this.db.select().from(positions).where(eq(positions.id, id)).get();
  }

  async findByName(name: string): Promise<PositionRow | undefined> {
    return this.db.select().from(positions).where(eq(positions.name, name)).get();
  }

  async create(name: string, module = "core"): Promise<PositionRow> {
    return this.db.insert(positions).values({ name, module }).returning().get();
  }

  async findByMember(
    memberId: number
  ): Promise<(PositionRow & { startDate: string; endDate: string | null })[]> {
    return this.db
      .select({
        id: positions.id,
        name: positions.name,
        module: positions.module,
        startDate: memberPositions.startDate,
        endDate: memberPositions.endDate,
      })
      .from(memberPositions)
      .innerJoin(positions, eq(memberPositions.positionId, positions.id))
      .where(eq(memberPositions.memberId, memberId))
      .orderBy(positions.name)
      .all();
  }

  async assign(memberId: number, positionId: number, startDate?: string): Promise<void> {
    await this.db
      .insert(memberPositions)
      .values({
        memberId,
        positionId,
        startDate: startDate ?? "datetime('now')",
      })
      .run();
  }

  async hasActivePosition(memberId: number, positionId: number): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(memberPositions)
      .where(
        and(
          eq(memberPositions.memberId, memberId),
          eq(memberPositions.positionId, positionId),
          isNull(memberPositions.endDate)
        )
      )
      .get();
    return !!existing;
  }

  async removeActive(memberId: number, positionId: number): Promise<void> {
    await this.db
      .update(memberPositions)
      .set({ endDate: "datetime('now')" } as never)
      .where(
        and(
          eq(memberPositions.memberId, memberId),
          eq(memberPositions.positionId, positionId),
          isNull(memberPositions.endDate)
        )
      )
      .run();
  }
}
