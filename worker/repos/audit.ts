import { sql, SQL } from "drizzle-orm";
import type { Db } from "../lib/db";

export interface AuditFilters {
  entityType?: string;
  entityId?: number;
  actorId?: number;
  action?: string;
  module?: string;
  from?: string;
  to?: string;
}

export interface AuditEntry {
  id: number;
  timestamp: string;
  actorId: number | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: number;
  prevState: string | null;
  newState: string | null;
  module: string;
  deviceInfo: string | null;
}

export interface AuditPage {
  entries: AuditEntry[];
  total: number;
}

export class AuditRepo {
  constructor(private db: Db) {}

  async findAll(
    filters: AuditFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditPage> {
    const whereFragments: SQL[] = [];

    if (filters.entityType) {
      whereFragments.push(sql`a.entity_type = ${filters.entityType}`);
    }
    if (filters.entityId !== undefined) {
      whereFragments.push(sql`a.entity_id = ${filters.entityId}`);
    }
    if (filters.actorId !== undefined) {
      whereFragments.push(sql`a.actor_id = ${filters.actorId}`);
    }
    if (filters.action) {
      whereFragments.push(sql`a.action = ${filters.action}`);
    }
    if (filters.module) {
      whereFragments.push(sql`a.module = ${filters.module}`);
    }
    if (filters.from) {
      whereFragments.push(sql`a.timestamp >= ${filters.from}`);
    }
    if (filters.to) {
      whereFragments.push(sql`a.timestamp <= ${filters.to}`);
    }

    const whereClause =
      whereFragments.length > 0 ? sql` WHERE `.append(sql.join(whereFragments, sql` AND `)) : sql``;

    const offset = (page - 1) * pageSize;

    const countResult = await this.db.get<{ cnt: number }>(
      sql`SELECT COUNT(*) as cnt FROM audit_log a ${whereClause}`
    );
    const total = countResult?.cnt ?? 0;

    const entries = await this.db.all<AuditEntry>(
      sql`SELECT
            a.id,
            a.timestamp,
            a.actor_id as "actorId",
            u.email as "actorEmail",
            a.action,
            a.entity_type as "entityType",
            a.entity_id as "entityId",
            a.prev_state as "prevState",
            a.new_state as "newState",
            a.module,
            a.device_info as "deviceInfo"
          FROM audit_log a
          LEFT JOIN users u ON u.id = a.actor_id
          ${whereClause}
          ORDER BY a.timestamp DESC
          LIMIT ${pageSize} OFFSET ${offset}`
    );

    return { entries, total };
  }

  async findByEntity(
    entityType: string,
    entityId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditPage> {
    const offset = (page - 1) * pageSize;

    const countResult = await this.db.get<{ cnt: number }>(
      sql`SELECT COUNT(*) as cnt FROM audit_log WHERE entity_type = ${entityType} AND entity_id = ${entityId}`
    );
    const total = countResult?.cnt ?? 0;

    const entries = await this.db.all<AuditEntry>(
      sql`SELECT
            a.id,
            a.timestamp,
            a.actor_id as "actorId",
            u.email as "actorEmail",
            a.action,
            a.entity_type as "entityType",
            a.entity_id as "entityId",
            a.prev_state as "prevState",
            a.new_state as "newState",
            a.module,
            a.device_info as "deviceInfo"
          FROM audit_log a
          LEFT JOIN users u ON u.id = a.actor_id
          WHERE a.entity_type = ${entityType} AND a.entity_id = ${entityId}
          ORDER BY a.timestamp DESC
          LIMIT ${pageSize} OFFSET ${offset}`
    );

    return { entries, total };
  }
}
