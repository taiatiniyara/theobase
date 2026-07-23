import { eq, and, like, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { members } from "../schema";

export interface MemberFilters {
  churchId?: number;
  status?: string;
  search?: string;
}

export interface CreateMemberData {
  churchId: number;
  householdId?: number;
  fullName: string;
  preferredName?: string;
  dob?: string;
  gender?: string;
  baptismDate?: string;
  baptismType?: string;
  joinDate?: string;
  prevChurchId?: number;
  phone?: string;
  email?: string;
  address?: string;
  maritalStatus?: string;
}

export interface UpdateMemberData {
  fullName?: string;
  preferredName?: string;
  dob?: string;
  gender?: string;
  baptismDate?: string;
  baptismType?: string;
  joinDate?: string;
  phone?: string;
  email?: string;
  address?: string;
  maritalStatus?: string;
  householdId?: number | null;
  churchId?: number;
  status?: string;
  statusDate?: string;
}

export type MemberRow = typeof members.$inferSelect;

export class MemberRepo {
  constructor(private db: Db) {}

  async findById(id: number): Promise<MemberRow | undefined> {
    return this.db.select().from(members).where(eq(members.id, id)).get();
  }

  async findByIdAndChurch(id: number, churchId: number): Promise<MemberRow | undefined> {
    return this.db
      .select()
      .from(members)
      .where(and(eq(members.id, id), eq(members.churchId, churchId)))
      .get();
  }

  async findByUserId(userId: number): Promise<MemberRow | undefined> {
    const user = await this.db.get<{ member_id: number | null }>(
      sql`SELECT member_id FROM users WHERE id = ${userId}`
    );
    if (!user || !user.member_id) return undefined;
    return this.findById(user.member_id);
  }

  async findAll(filters: MemberFilters = {}): Promise<MemberRow[]> {
    const conditions = [];
    if (filters.churchId) conditions.push(eq(members.churchId, filters.churchId));
    if (filters.status) conditions.push(eq(members.status, filters.status));
    if (filters.search) {
      conditions.push(like(members.fullName, `%${filters.search}%`));
    }

    const query = this.db.select().from(members);
    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(members.fullName)
        .all();
    }
    return query.orderBy(members.fullName).all();
  }

  async create(data: CreateMemberData): Promise<MemberRow> {
    return this.db
      .insert(members)
      .values({
        churchId: data.churchId,
        householdId: data.householdId ?? null,
        fullName: data.fullName,
        preferredName: data.preferredName ?? null,
        dob: data.dob ?? null,
        gender: data.gender ?? null,
        baptismDate: data.baptismDate ?? null,
        baptismType: data.baptismType ?? null,
        joinDate: data.joinDate ?? null,
        prevChurchId: data.prevChurchId ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        maritalStatus: data.maritalStatus ?? null,
      })
      .returning()
      .get();
  }

  async update(id: number, data: UpdateMemberData): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.fullName !== undefined) setData.fullName = data.fullName;
    if (data.preferredName !== undefined) setData.preferredName = data.preferredName;
    if (data.dob !== undefined) setData.dob = data.dob;
    if (data.gender !== undefined) setData.gender = data.gender;
    if (data.baptismDate !== undefined) setData.baptismDate = data.baptismDate;
    if (data.baptismType !== undefined) setData.baptismType = data.baptismType;
    if (data.joinDate !== undefined) setData.joinDate = data.joinDate;
    if (data.phone !== undefined) setData.phone = data.phone;
    if (data.email !== undefined) setData.email = data.email;
    if (data.address !== undefined) setData.address = data.address;
    if (data.maritalStatus !== undefined) setData.maritalStatus = data.maritalStatus;
    if (data.householdId !== undefined) setData.householdId = data.householdId ?? null;
    if (data.churchId !== undefined) setData.churchId = data.churchId;
    if (data.status !== undefined) setData.status = data.status;
    if (data.statusDate !== undefined) setData.statusDate = data.statusDate;

    if (Object.keys(setData).length === 0) return false;

    const member = await this.findById(id);
    if (!member) return false;

    await this.db
      .update(members)
      .set({
        ...setData,
        version: member.version + 1,
        updatedAt: sql`datetime('now')`,
      } as never)
      .where(eq(members.id, id))
      .run();

    return true;
  }

  async setStatus(id: number, status: string, statusDate?: string): Promise<void> {
    await this.db.run(
      sql`UPDATE members SET status = ${status}, status_date = ${statusDate ?? null},
        updated_at = datetime('now'), version = version + 1 WHERE id = ${id}`
    );
  }

  async transferTo(id: number, toChurchId: number, fromChurchId: number): Promise<void> {
    await this.db.run(
      sql`UPDATE members SET church_id = ${toChurchId},
        prev_church_id = ${fromChurchId}, status = 'active',
        status_date = NULL, updated_at = datetime('now'),
        version = version + 1 WHERE id = ${id}`
    );
  }

  async reactivate(id: number): Promise<void> {
    await this.db.run(
      sql`UPDATE members SET status = 'active', status_date = NULL,
        updated_at = datetime('now'), version = version + 1 WHERE id = ${id}`
    );
  }
}
