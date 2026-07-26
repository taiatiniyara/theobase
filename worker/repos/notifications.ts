import { eq, and, desc } from "drizzle-orm";
import type { Db } from "../lib/db";
import { notifications } from "../schema/notifications";

export type NotificationRow = typeof notifications.$inferSelect;

export class NotificationRepo {
  constructor(private db: Db) {}

  async findAll(recipientId: number, unreadOnly = false): Promise<NotificationRow[]> {
    const conditions = [eq(notifications.recipientUserId, recipientId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.read, 0));
    }
    return this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .all();
  }

  async markRead(id: number, recipientId: number): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.recipientUserId, recipientId)))
      .get();
    if (!existing) return false;
    await this.db.update(notifications).set({ read: 1 }).where(eq(notifications.id, id)).run();
    return true;
  }

  async markAllRead(recipientId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ read: 1 })
      .where(and(eq(notifications.recipientUserId, recipientId), eq(notifications.read, 0)))
      .run();
  }

  async create(data: {
    recipientUserId: number;
    type: string;
    entityType: string;
    entityId: number;
    message: string;
  }): Promise<NotificationRow> {
    return this.db
      .insert(notifications)
      .values({
        recipientUserId: data.recipientUserId,
        type: data.type,
        entityType: data.entityType,
        entityId: data.entityId,
        message: data.message,
      })
      .returning()
      .get() as Promise<NotificationRow>;
  }
}
