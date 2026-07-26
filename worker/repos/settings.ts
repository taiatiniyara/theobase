import { sql } from "drizzle-orm";
import type { Db } from "../lib/db";

export class SettingsRepo {
  constructor(private db: Db) {}

  async getChurchSettings(churchId: number): Promise<Record<string, unknown> | null> {
    return (
      this.db.get<Record<string, unknown>>(
        sql`SELECT * FROM church_settings WHERE church_id = ${churchId}`
      ) ?? null
    );
  }

  async upsertChurchSettings(churchId: number, data: Record<string, unknown>): Promise<void> {
    const existing = await this.getChurchSettings(churchId);
    if (existing) {
      const setClauses = Object.keys(data)
        .map((k) => sql`${sql.raw(k)} = ${data[k]}`)
        .reduce((acc, clause) => (acc ? sql`${acc}, ${clause}` : clause));
      if (!setClauses) return;
      await this.db.run(
        sql`UPDATE church_settings SET ${setClauses}, updated_at = datetime('now') WHERE church_id = ${churchId}`
      );
    } else {
      const now = new Date().toISOString();
      await this.db.run(
        sql`INSERT INTO church_settings (church_id, ${sql.raw(Object.keys(data).join(", "))}, created_at, updated_at)
        VALUES (${churchId}, ${sql.join(
          Object.values(data).map((v) => sql`${v}`),
          sql`, `
        )}, ${now}, ${now})`
      );
    }
  }

  async getUserSettings(userId: number): Promise<Record<string, unknown> | null> {
    return (
      this.db.get<Record<string, unknown>>(
        sql`SELECT * FROM user_settings WHERE user_id = ${userId}`
      ) ?? null
    );
  }

  async upsertUserSettings(userId: number, data: Record<string, unknown>): Promise<void> {
    const existing = await this.getUserSettings(userId);
    if (existing) {
      const setClauses = Object.keys(data)
        .map((k) => sql`${sql.raw(k)} = ${data[k]}`)
        .reduce((acc, clause) => (acc ? sql`${acc}, ${clause}` : clause));
      if (!setClauses) return;
      await this.db.run(
        sql`UPDATE user_settings SET ${setClauses}, updated_at = datetime('now') WHERE user_id = ${userId}`
      );
    } else {
      const now = new Date().toISOString();
      await this.db.run(
        sql`INSERT INTO user_settings (user_id, ${sql.raw(Object.keys(data).join(", "))}, created_at, updated_at)
        VALUES (${userId}, ${sql.join(
          Object.values(data).map((v) => sql`${v}`),
          sql`, `
        )}, ${now}, ${now})`
      );
    }
  }

  async getConferenceSettings(conferenceId: number): Promise<Record<string, unknown> | null> {
    return (
      this.db.get<Record<string, unknown>>(
        sql`SELECT * FROM conference_settings WHERE conference_id = ${conferenceId}`
      ) ?? null
    );
  }

  async upsertConferenceSettings(
    conferenceId: number,
    data: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.getConferenceSettings(conferenceId);
    if (existing) {
      const setClauses = Object.keys(data)
        .map((k) => sql`${sql.raw(k)} = ${data[k]}`)
        .reduce((acc, clause) => (acc ? sql`${acc}, ${clause}` : clause));
      if (!setClauses) return;
      await this.db.run(
        sql`UPDATE conference_settings SET ${setClauses}, updated_at = datetime('now') WHERE conference_id = ${conferenceId}`
      );
    } else {
      const now = new Date().toISOString();
      await this.db.run(
        sql`INSERT INTO conference_settings (conference_id, ${sql.raw(Object.keys(data).join(", "))}, created_at, updated_at)
        VALUES (${conferenceId}, ${sql.join(
          Object.values(data).map((v) => sql`${v}`),
          sql`, `
        )}, ${now}, ${now})`
      );
    }
  }
}
