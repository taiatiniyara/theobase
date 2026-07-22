import { DurableObject } from "cloudflare:workers";

export class ChurchSyncDO extends DurableObject {
  private sql = this.ctx.storage.sql;

  async getActiveSyncSessions(): Promise<{ churchId: string; lastSync: string }[]> {
    const result = this.sql.exec(
      "SELECT church_id, last_sync_at FROM sync_sessions WHERE status = 'active'"
    );
    return result.toArray().map((row) => ({
      churchId: String(row.church_id),
      lastSync: String(row.last_sync_at),
    }));
  }

  async registerSync(churchId: string, userId: string): Promise<void> {
    this.sql.exec(
      `INSERT INTO sync_sessions (church_id, user_id, status, last_sync_at, started_at)
       VALUES (?, ?, 'active', datetime('now'), datetime('now'))
       ON CONFLICT(church_id, user_id) DO UPDATE SET last_sync_at = datetime('now')`,
      churchId,
      userId
    );
  }

  async applyOfflineOperation(
    churchId: string,
    userId: string,
    operation: { type: string; payload: string; clientUuid: string }
  ): Promise<{ success: boolean; error?: string }> {
    const existing = this.sql.exec(
      "SELECT id FROM applied_operations WHERE client_uuid = ?",
      operation.clientUuid
    );
    if (existing.rowsRead > 0) {
      return { success: true };
    }

    this.sql.exec(
      `INSERT INTO applied_operations (church_id, user_id, op_type, payload, client_uuid)
       VALUES (?, ?, ?, ?, ?)`,
      churchId,
      userId,
      operation.type,
      operation.payload,
      operation.clientUuid
    );

    return { success: true };
  }

  async getUnsyncedOperations(
    churchId: string
  ): Promise<{ id: number; type: string; payload: string }[]> {
    const result = this.sql.exec(
      "SELECT id, op_type, payload FROM applied_operations WHERE church_id = ? ORDER BY id",
      churchId
    );
    return result.toArray().map((row) => ({
      id: Number(row.id),
      type: String(row.op_type),
      payload: String(row.payload),
    }));
  }

  async getSyncState(churchId: string): Promise<{ lastSync: string; pendingOps: number }> {
    const session = this.sql.exec(
      "SELECT last_sync_at FROM sync_sessions WHERE church_id = ? ORDER BY last_sync_at DESC LIMIT 1",
      churchId
    );
    const lastSync =
      session.rowsRead > 0 ? String(session.one().last_sync_at) : new Date(0).toISOString();

    const pending = this.sql.exec(
      "SELECT COUNT(*) as count FROM applied_operations WHERE church_id = ?",
      churchId
    );

    return {
      lastSync,
      pendingOps: Number(pending.one().count),
    };
  }
}
