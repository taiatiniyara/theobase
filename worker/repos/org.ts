import { eq, and, or, inArray, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { conferences, districts, churches } from "../schema";

export type ConferenceRow = typeof conferences.$inferSelect;
export type DistrictRow = typeof districts.$inferSelect;
export type ChurchRow = typeof churches.$inferSelect;

export class ConferenceRepo {
  constructor(private db: Db) {}

  async findAll(): Promise<ConferenceRow[]> {
    return this.db.select().from(conferences).all();
  }

  async create(data: {
    name: string;
    code: string;
    address?: string;
    bankDetails?: string;
  }): Promise<ConferenceRow> {
    return this.db
      .insert(conferences)
      .values({
        name: data.name,
        code: data.code,
        address: data.address ?? null,
        bankDetails: data.bankDetails ?? null,
      })
      .returning()
      .get();
  }

  async findById(id: number): Promise<ConferenceRow | undefined> {
    return this.db.select().from(conferences).where(eq(conferences.id, id)).get();
  }

  async findByCode(code: string): Promise<ConferenceRow | undefined> {
    return this.db.select().from(conferences).where(eq(conferences.code, code)).get();
  }

  async update(
    id: number,
    data: {
      name?: string;
      code?: string;
      address?: string;
      bankDetails?: string;
    }
  ): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.code !== undefined) setData.code = data.code;
    if (data.address !== undefined) setData.address = data.address;
    if (data.bankDetails !== undefined) setData.bankDetails = data.bankDetails;

    if (Object.keys(setData).length === 0) return false;

    const conference = await this.findById(id);
    if (!conference) return false;

    await this.db
      .update(conferences)
      .set(setData as never)
      .where(eq(conferences.id, id))
      .run();

    return true;
  }
}

export class DistrictRepo {
  constructor(private db: Db) {}

  async findAll(conferenceId: number): Promise<DistrictRow[]> {
    return this.db.select().from(districts).where(eq(districts.conferenceId, conferenceId)).all();
  }

  async create(data: {
    name: string;
    conferenceId: number;
    pastorUserId?: number;
  }): Promise<DistrictRow> {
    return this.db
      .insert(districts)
      .values({
        name: data.name,
        conferenceId: data.conferenceId,
        pastorUserId: data.pastorUserId ?? null,
      })
      .returning()
      .get();
  }

  async findById(id: number): Promise<DistrictRow | undefined> {
    return this.db.select().from(districts).where(eq(districts.id, id)).get();
  }

  async update(
    id: number,
    data: { name?: string; pastorUserId?: number | null }
  ): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.pastorUserId !== undefined) setData.pastorUserId = data.pastorUserId ?? null;

    if (Object.keys(setData).length === 0) return false;

    const district = await this.findById(id);
    if (!district) return false;

    await this.db
      .update(districts)
      .set(setData as never)
      .where(eq(districts.id, id))
      .run();

    return true;
  }
}

export class ChurchRepo {
  constructor(private db: Db) {}

  async findAll(conferenceId?: number): Promise<ChurchRow[]> {
    const query = this.db.select().from(churches);
    if (!conferenceId) return query.all();

    return query
      .where(
        or(
          and(eq(churches.parentType, "conference"), eq(churches.parentId, conferenceId)),
          inArray(
            churches.districtId,
            this.db
              .select({ id: districts.id })
              .from(districts)
              .where(eq(districts.conferenceId, conferenceId))
          )
        )
      )
      .all();
  }

  async create(data: {
    name: string;
    code: string;
    type: string;
    parentId: number;
    parentType: string;
    districtId?: number;
    address?: string;
    bankDetails?: string;
  }): Promise<ChurchRow> {
    return this.db
      .insert(churches)
      .values({
        name: data.name,
        code: data.code,
        type: data.type,
        parentId: data.parentId,
        parentType: data.parentType,
        districtId: data.districtId ?? null,
        address: data.address ?? null,
        bankDetails: data.bankDetails ?? null,
      })
      .returning()
      .get();
  }

  async findById(id: number): Promise<ChurchRow | undefined> {
    return this.db.select().from(churches).where(eq(churches.id, id)).get();
  }

  async findByCode(code: string): Promise<ChurchRow | undefined> {
    return this.db.select().from(churches).where(eq(churches.code, code)).get();
  }

  async update(
    id: number,
    data: {
      name?: string;
      code?: string;
      type?: string;
      districtId?: number | null;
      address?: string;
      bankDetails?: string;
    }
  ): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.name !== undefined) setData.name = data.name;
    if (data.code !== undefined) setData.code = data.code;
    if (data.type !== undefined) setData.type = data.type;
    if (data.districtId !== undefined) setData.districtId = data.districtId ?? null;
    if (data.address !== undefined) setData.address = data.address;
    if (data.bankDetails !== undefined) setData.bankDetails = data.bankDetails;

    if (Object.keys(setData).length === 0) return false;

    const church = await this.findById(id);
    if (!church) return false;

    await this.db
      .update(churches)
      .set(setData as never)
      .where(eq(churches.id, id))
      .run();

    return true;
  }

  async bulkCreate(
    rows: Array<{
      name: string;
      code: string;
      type: string;
      parentId: number;
      districtId?: number;
    }>
  ): Promise<void> {
    if (rows.length === 0) return;

    const values = rows.map(
      (row) =>
        sql`(${row.name}, ${row.code}, ${row.type}, ${row.parentId}, ${row.districtId ?? null})`
    );
    await this.db.run(
      sql`INSERT INTO churches (name, code, type, parent_id, district_id) VALUES `.append(
        sql.join(values, sql`, `)
      )
    );
  }
}
