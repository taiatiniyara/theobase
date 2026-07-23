import { eq, and, gte, lte, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { attendance, memberAttendance } from "../schema/attendance";

export interface UpsertAttendanceData {
  churchId: number;
  date: string;
  count: number;
  category: string;
  createdBy: number;
}

export interface AttendanceFilters {
  churchId?: number;
  from?: string;
  to?: string;
  category?: string;
}

export interface CategoryStats {
  category: string;
  average: number;
  weeks: number;
  min: number;
  max: number;
}

export interface TrendPoint {
  date: string;
  count: number;
  category: string;
}

export type AttendanceRow = typeof attendance.$inferSelect;

export class AttendanceRepo {
  constructor(private db: Db) {}

  async upsert(data: UpsertAttendanceData): Promise<AttendanceRow> {
    return this.db.get<AttendanceRow>(
      sql`INSERT INTO attendance (church_id, date, count, category, created_by)
            VALUES (${data.churchId}, ${data.date}, ${data.count}, ${data.category}, ${data.createdBy})
            ON CONFLICT(church_id, date, category)
            DO UPDATE SET count = excluded.count, updated_at = datetime('now')
            RETURNING *`
    );
  }

  async findAll(filters: AttendanceFilters = {}): Promise<AttendanceRow[]> {
    const conditions = [];

    if (filters.churchId !== undefined) {
      conditions.push(eq(attendance.churchId, filters.churchId));
    }
    if (filters.from) {
      conditions.push(gte(attendance.date, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(attendance.date, filters.to));
    }
    if (filters.category) {
      conditions.push(eq(attendance.category, filters.category));
    }

    const query = this.db.select().from(attendance);

    if (conditions.length > 0) {
      return query
        .where(and(...conditions))
        .orderBy(sql`date DESC`)
        .all();
    }

    return query.orderBy(sql`date DESC`).all();
  }

  async findById(id: number): Promise<AttendanceRow | undefined> {
    return this.db.select().from(attendance).where(eq(attendance.id, id)).get();
  }

  async getStats(churchId: number, from?: string, to?: string): Promise<CategoryStats[]> {
    const conditions = [eq(attendance.churchId, churchId)];
    if (from) conditions.push(gte(attendance.date, from));
    if (to) conditions.push(lte(attendance.date, to));

    return this.db
      .select({
        category: attendance.category,
        average: sql<number>`ROUND(AVG(count), 1)`,
        weeks: sql<number>`COUNT(*)`,
        min: sql<number>`MIN(count)`,
        max: sql<number>`MAX(count)`,
      })
      .from(attendance)
      .where(and(...conditions))
      .groupBy(attendance.category)
      .orderBy(attendance.category)
      .all();
  }

  async getTrend(churchId: number, from?: string, to?: string): Promise<TrendPoint[]> {
    const conditions = [eq(attendance.churchId, churchId)];
    if (from) conditions.push(gte(attendance.date, from));
    if (to) conditions.push(lte(attendance.date, to));

    return this.db
      .select({
        date: attendance.date,
        count: attendance.count,
        category: attendance.category,
      })
      .from(attendance)
      .where(and(...conditions))
      .orderBy(sql`date ASC`)
      .all();
  }

  async addMembers(attendanceId: number, memberIds: number[]): Promise<void> {
    if (memberIds.length === 0) return;

    const values = memberIds.map((memberId) => ({
      attendanceId,
      memberId,
    }));

    await this.db.insert(memberAttendance).values(values).onConflictDoNothing().run();
  }

  async getMemberIds(attendanceId: number): Promise<number[]> {
    const rows = await this.db
      .select({ memberId: memberAttendance.memberId })
      .from(memberAttendance)
      .where(eq(memberAttendance.attendanceId, attendanceId))
      .all();

    return rows.map((r) => r.memberId);
  }

  async removeMembers(attendanceId: number, memberIds: number[]): Promise<void> {
    if (memberIds.length === 0) return;

    for (const memberId of memberIds) {
      await this.db
        .delete(memberAttendance)
        .where(
          and(
            eq(memberAttendance.attendanceId, attendanceId),
            eq(memberAttendance.memberId, memberId)
          )
        )
        .run();
    }
  }
}
