import { DurableObject } from "cloudflare:workers";

export class ConferenceDO extends DurableObject {
  private sql = this.ctx.storage.sql;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql.exec(
      `CREATE TABLE IF NOT EXISTS conference_aggregates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        period TEXT NOT NULL,
        total_tithe REAL NOT NULL DEFAULT 0,
        total_offerings REAL NOT NULL DEFAULT 0,
        total_expenses REAL NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );
  }

  async getInfo(): Promise<{
    name: string;
    code: string;
    churchCount: number;
    memberCount: number;
  } | null> {
    const result = this.sql.exec("SELECT * FROM conference_aggregates ORDER BY id LIMIT 1");
    if (result.rowsRead === 0) return null;

    return {
      name: "default",
      code: "default",
      churchCount: 0,
      memberCount: 0,
    };
  }

  async recordAggregate(
    period: string,
    tithe: number,
    offerings: number,
    expenses: number
  ): Promise<void> {
    this.sql.exec(
      `INSERT INTO conference_aggregates (period, total_tithe, total_offerings, total_expenses)
       VALUES (?, ?, ?, ?)`,
      period,
      tithe,
      offerings,
      expenses
    );
  }

  async getAggregate(period: string): Promise<{
    totalTithe: number;
    totalOfferings: number;
    totalExpenses: number;
  } | null> {
    const result = this.sql.exec("SELECT * FROM conference_aggregates WHERE period = ?", period);
    if (result.rowsRead === 0) return null;

    const row = result.one();
    return {
      totalTithe: Number(row.total_tithe),
      totalOfferings: Number(row.total_offerings),
      totalExpenses: Number(row.total_expenses),
    };
  }
}
