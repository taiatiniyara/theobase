import { eq, and, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { users } from "../schema";

export type UserRow = typeof users.$inferSelect;

export interface UserWithChurch {
  id: number;
  email: string;
  password_hash: string;
  member_id: number | null;
  conference_id: number | null;
  role: string;
  reset_token: string | null;
  reset_token_expires: string | null;
  active: number;
  created_at: string;
  church_id: number | null;
}

export class UserRepo {
  constructor(private db: Db) {}

  async findAll(conferenceId?: number): Promise<UserRow[]> {
    const query = this.db.select().from(users);
    if (!conferenceId) return query.all();
    return query.where(eq(users.conferenceId, conferenceId)).all();
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
    conferenceId?: number | null;
    memberId?: number | null;
  }): Promise<UserRow> {
    const result = await this.db.get<UserRow>(
      sql`INSERT INTO users (email, password_hash, role, conference_id, member_id)
        VALUES (${data.email}, ${data.passwordHash}, ${data.role},
          ${data.conferenceId ?? null}, ${data.memberId ?? null})
        RETURNING *`
    );
    return result!;
  }

  async findById(id: number): Promise<UserRow | undefined> {
    return this.db.select().from(users).where(eq(users.id, id)).get();
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    return this.db.select().from(users).where(eq(users.email, email)).get();
  }

  async findByResetToken(token: string): Promise<UserRow | undefined> {
    return this.db
      .select()
      .from(users)
      .where(and(eq(users.resetToken, token), sql`${users.resetTokenExpires} > datetime('now')`))
      .get();
  }

  async update(
    id: number,
    data: {
      role?: string;
      passwordHash?: string;
      active?: number;
      resetToken?: string | null;
      resetTokenExpires?: string | null;
    }
  ): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.role !== undefined) setData.role = data.role;
    if (data.passwordHash !== undefined) setData.passwordHash = data.passwordHash;
    if (data.active !== undefined) setData.active = data.active;
    if (data.resetToken !== undefined) setData.resetToken = data.resetToken ?? null;
    if (data.resetTokenExpires !== undefined)
      setData.resetTokenExpires = data.resetTokenExpires ?? null;

    if (Object.keys(setData).length === 0) return false;

    const user = await this.findById(id);
    if (!user) return false;

    await this.db
      .update(users)
      .set(setData as never)
      .where(eq(users.id, id))
      .run();

    return true;
  }

  async findUserWithChurch(id: number): Promise<UserWithChurch | undefined> {
    const user = await this.findById(id);
    if (!user) return undefined;

    let churchId: number | null = null;
    if (user.memberId) {
      const member = await this.db.get<{ church_id: number | null }>(
        sql`SELECT church_id FROM members WHERE id = ${user.memberId}`
      );
      churchId = member?.church_id ?? null;
    }

    return {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      member_id: user.memberId,
      conference_id: user.conferenceId,
      role: user.role,
      reset_token: user.resetToken,
      reset_token_expires: user.resetTokenExpires,
      active: user.active ?? 1,
      created_at: user.createdAt ?? "",
      church_id: churchId,
    };
  }
}
