import { DurableObject } from "cloudflare:workers";
import { MIGRATION_SQL } from "./migration-sql";

interface ProvisioningState {
  status: "pending" | "running" | "done" | "failed";
  conferenceId: number;
  conferenceCode: string;
  dbId?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

export class ConferenceDO extends DurableObject {
  private sql = this.ctx.storage.sql;
  private appEnv: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.appEnv = env;
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

  async provision(conferenceId: number, conferenceCode: string): Promise<{ status: string }> {
    const state: ProvisioningState = {
      status: "pending",
      conferenceId,
      conferenceCode,
      startedAt: new Date().toISOString(),
    };
    await this.ctx.storage.put<ProvisioningState>("provisioning", state);
    await this.ctx.storage.setAlarm(Date.now() + 1000);
    return { status: "pending" };
  }

  async getProvisioningStatus(): Promise<ProvisioningState | null> {
    return (await this.ctx.storage.get<ProvisioningState>("provisioning")) ?? null;
  }

  override async alarm(): Promise<void> {
    const state = await this.ctx.storage.get<ProvisioningState>("provisioning");
    if (!state || state.status !== "pending") return;

    state.status = "running";
    await this.ctx.storage.put("provisioning", state);

    const token = this.appEnv.CF_API_TOKEN;
    const accountId = this.appEnv.CF_ACCOUNT_ID;
    if (!token || !accountId) {
      state.status = "failed";
      state.error = "CF_API_TOKEN or CF_ACCOUNT_ID not configured";
      state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("provisioning", state);
      return;
    }

    try {
      const db = await this.createD1Database(token, accountId, state.conferenceCode);
      state.dbId = db.id;
      await this.ctx.storage.put("provisioning", state);
      await this.runMigrations(token, accountId, db.id);
      state.status = "done";
      state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("provisioning", state);
    } catch (e) {
      state.status = "failed";
      state.error = String(e);
      state.completedAt = new Date().toISOString();
      await this.ctx.storage.put("provisioning", state);
    }
  }

  private async createD1Database(
    token: string,
    accountId: string,
    code: string
  ): Promise<{ id: string; name: string }> {
    const res = await fetch(`${CF_API_BASE}/accounts/${accountId}/d1/database`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `theobase-${code}` }),
    });
    const json = (await res.json()) as {
      success: boolean;
      result: { uuid: string; name: string };
      errors: Array<{ message: string }>;
    };
    if (!json.success || !json.result) {
      throw new Error(`D1 create failed: ${json.errors?.[0]?.message ?? "unknown"}`);
    }
    return { id: json.result.uuid, name: json.result.name };
  }

  private async runMigrations(token: string, accountId: string, dbId: string): Promise<void> {
    const res = await fetch(`${CF_API_BASE}/accounts/${accountId}/d1/database/${dbId}/raw`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql: MIGRATION_SQL }),
    });
    const json = (await res.json()) as {
      success: boolean;
      errors: Array<{ message: string }>;
    };
    if (!json.success) {
      throw new Error(`Migration failed: ${json.errors?.[0]?.message ?? "unknown"}`);
    }
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
