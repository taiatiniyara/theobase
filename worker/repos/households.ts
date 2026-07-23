import { eq } from "drizzle-orm";
import type { Db } from "../lib/db";
import { households } from "../schema";

export interface CreateHouseholdData {
  churchId: number;
  name: string;
  address?: string;
  headMemberId?: number;
}

export interface UpdateHouseholdData {
  name?: string;
  address?: string;
  headMemberId?: number;
}

export type HouseholdRow = typeof households.$inferSelect;

export class HouseholdRepo {
  constructor(private db: Db) {}

  async findById(id: number): Promise<HouseholdRow | undefined> {
    return this.db.select().from(households).where(eq(households.id, id)).get();
  }

  async findByChurch(churchId?: number): Promise<HouseholdRow[]> {
    const query = this.db.select().from(households);
    if (churchId) {
      return query.where(eq(households.churchId, churchId)).orderBy(households.name).all();
    }
    return query.orderBy(households.name).all();
  }

  async create(data: CreateHouseholdData): Promise<HouseholdRow> {
    return this.db
      .insert(households)
      .values({
        churchId: data.churchId,
        name: data.name,
        address: data.address ?? null,
        headMemberId: data.headMemberId ?? null,
      })
      .returning()
      .get();
  }

  async update(id: number, data: UpdateHouseholdData): Promise<HouseholdRow | undefined> {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.address !== undefined) setData.address = data.address;
    if (data.headMemberId !== undefined) setData.headMemberId = data.headMemberId;

    if (Object.keys(setData).length === 0) return undefined;

    return this.db
      .update(households)
      .set(setData as never)
      .where(eq(households.id, id))
      .returning()
      .get();
  }
}
