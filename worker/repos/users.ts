import { eq, and, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { users, members } from "../schema";

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
  status: string;
  email_verified: number;
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

  async count(): Promise<number> {
    const rows = await (this.db.select().from(users).all() as unknown as Promise<UserRow[]>);
    return rows.length;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: string;
    conferenceId?: number | null;
    memberId?: number | null;
    emailVerified?: number;
  }): Promise<UserRow> {
    return this.db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        conferenceId: data.conferenceId ?? null,
        memberId: data.memberId ?? null,
        emailVerified: data.emailVerified ?? 0,
      })
      .returning()
      .get();
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
      status?: string;
      emailVerified?: number;
      resetToken?: string | null;
      resetTokenExpires?: string | null;
      conferenceId?: number | null;
    }
  ): Promise<boolean> {
    const setData: Record<string, unknown> = {};
    if (data.role !== undefined) setData.role = data.role;
    if (data.passwordHash !== undefined) setData.passwordHash = data.passwordHash;
    if (data.active !== undefined) setData.active = data.active;
    if (data.status !== undefined) setData.status = data.status;
    if (data.emailVerified !== undefined) setData.emailVerified = data.emailVerified;
    if (data.conferenceId !== undefined) setData.conferenceId = data.conferenceId;
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
      const member = await this.db
        .select({ churchId: members.churchId })
        .from(members)
        .where(eq(members.id, user.memberId))
        .get();
      churchId = member?.churchId ?? null;
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
      email_verified: user.emailVerified ?? 1,
      status: user.status ?? "active",
      created_at: user.createdAt ?? "",
      church_id: churchId,
    };
  }

  async verifyEmail(userId: number): Promise<boolean> {
    await this.db
      .update(users)
      .set({ emailVerified: 1 } as never)
      .where(eq(users.id, userId))
      .run();
    return true;
  }
}
