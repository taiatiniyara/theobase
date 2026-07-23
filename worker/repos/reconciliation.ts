import { eq, and, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { reconciliations } from "../schema/reconciliation";

export interface ReceiveTitheData {
  churchId: number;
  year: number;
  month: number;
  receivedAmount: number;
  note?: string;
  reconciledBy: number;
}

export interface SetBalanceData {
  churchId: number;
  year: number;
  month: number;
  bankBalance: number;
  systemBalance: number;
  bankNote?: string;
  reconciledBy: number;
}

export interface ConferenceTitheRow {
  churchId: number;
  churchName: string;
  year: number;
  month: number;
  forwardedTithe: number;
  receivedTithe: number | null;
  titheDiscrepancy: number | null;
  titheStatus: string;
}

export interface ChurchBalanceRow {
  bankBalance: number | null;
  systemBalance: number | null;
  bankDiscrepancy: number | null;
  bankNote: string | null;
}

export interface TitheReportRow {
  churchId: number;
  churchName: string;
  year: number;
  month: number;
  forwardedTithe: number;
  receivedTithe: number | null;
  titheDiscrepancy: number | null;
  titheStatus: string;
  bankBalance: number | null;
  systemBalance: number | null;
}

export type ReconciliationRow = typeof reconciliations.$inferSelect;

export class ReconciliationRepo {
  constructor(private db: Db) {}

  async getConferenceTithe(conferenceId: number): Promise<ConferenceTitheRow[]> {
    return this.db.all<ConferenceTitheRow>(
      sql`SELECT
            c.id as "churchId",
            c.name as "churchName",
            CAST(strftime('%Y', 'now') AS INTEGER) as year,
            CAST(strftime('%m', 'now') AS INTEGER) as month,
            COALESCE(SUM(t.amount), 0) as "forwardedTithe",
            r.received_tithe as "receivedTithe",
            r.tithe_discrepancy as "titheDiscrepancy",
            COALESCE(r.tithe_status, 'pending') as "titheStatus"
          FROM churches c
          JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
          JOIN funds f ON f.id = t.fund_id AND f.type = 'tithe'
          JOIN offering_batches b ON b.id = t.batch_id AND b.status = 'confirmed'
          LEFT JOIN reconciliations r ON r.church_id = c.id
          WHERE c.parent_type = 'conference' AND c.parent_id = ${conferenceId}
          GROUP BY c.id
          ORDER BY c.name ASC`
    );
  }

  async receiveTithe(data: ReceiveTitheData): Promise<ReconciliationRow> {
    const record = await this.db.get<ReconciliationRow>(
      sql`SELECT * FROM reconciliations
            WHERE church_id = ${data.churchId}
              AND year = ${data.year}
              AND month = ${data.month}`
    );

    if (!record) {
      return this.db.get<ReconciliationRow>(
        sql`INSERT INTO reconciliations
                (church_id, year, month, received_tithe, tithe_note, reconciled_by, reconciled_at, tithe_status)
              VALUES
                (${data.churchId}, ${data.year}, ${data.month}, ${data.receivedAmount},
                 ${data.note ?? null}, ${data.reconciledBy}, datetime('now'), 'received')
              RETURNING *`
      );
    }

    const discrepancy = (record.forwardedTithe ?? 0) - data.receivedAmount;

    return this.db.get<ReconciliationRow>(
      sql`UPDATE reconciliations
            SET received_tithe = ${data.receivedAmount},
                tithe_discrepancy = ${discrepancy},
                tithe_note = ${data.note ?? record.titheNote},
                tithe_status = ${discrepancy === 0 ? "matched" : "discrepancy"},
                reconciled_by = ${data.reconciledBy},
                reconciled_at = datetime('now')
            WHERE id = ${record.id}
            RETURNING *`
    );
  }

  async getChurchBalance(
    churchId: number,
    year: number,
    month: number
  ): Promise<ChurchBalanceRow | undefined> {
    return this.db.get<ChurchBalanceRow>(
      sql`SELECT
            bank_balance as "bankBalance",
            system_balance as "systemBalance",
            bank_discrepancy as "bankDiscrepancy",
            bank_note as "bankNote"
          FROM reconciliations
          WHERE church_id = ${churchId}
            AND year = ${year}
            AND month = ${month}`
    );
  }

  async setChurchBalance(data: SetBalanceData): Promise<ReconciliationRow> {
    const discrepancy = data.systemBalance - data.bankBalance;

    const record = await this.db.get<ReconciliationRow>(
      sql`SELECT * FROM reconciliations
            WHERE church_id = ${data.churchId}
              AND year = ${data.year}
              AND month = ${data.month}`
    );

    if (!record) {
      return this.db.get<ReconciliationRow>(
        sql`INSERT INTO reconciliations
                (church_id, year, month, bank_balance, system_balance,
                 bank_discrepancy, bank_note, reconciled_by, reconciled_at)
              VALUES
                (${data.churchId}, ${data.year}, ${data.month},
                 ${data.bankBalance}, ${data.systemBalance},
                 ${discrepancy}, ${data.bankNote ?? null},
                 ${data.reconciledBy}, datetime('now'))
              RETURNING *`
      );
    }

    return this.db.get<ReconciliationRow>(
      sql`UPDATE reconciliations
            SET bank_balance = ${data.bankBalance},
                system_balance = ${data.systemBalance},
                bank_discrepancy = ${discrepancy},
                bank_note = ${data.bankNote ?? record.bankNote},
                reconciled_by = ${data.reconciledBy},
                reconciled_at = datetime('now')
            WHERE id = ${record.id}
            RETURNING *`
    );
  }

  async getTitheReport(conferenceId: number): Promise<TitheReportRow[]> {
    return this.db.all<TitheReportRow>(
      sql`SELECT
            c.id as "churchId",
            c.name as "churchName",
            CAST(strftime('%Y', 'now') AS INTEGER) as year,
            CAST(strftime('%m', 'now') AS INTEGER) as month,
            COALESCE(SUM(t.amount), 0) as "forwardedTithe",
            r.received_tithe as "receivedTithe",
            r.tithe_discrepancy as "titheDiscrepancy",
            COALESCE(r.tithe_status, 'pending') as "titheStatus",
            r.bank_balance as "bankBalance",
            r.system_balance as "systemBalance"
          FROM churches c
          JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
          JOIN funds f ON f.id = t.fund_id AND f.type = 'tithe'
          JOIN offering_batches b ON b.id = t.batch_id AND b.status = 'confirmed'
          LEFT JOIN reconciliations r ON r.church_id = c.id
          WHERE c.parent_type = 'conference' AND c.parent_id = ${conferenceId}
          GROUP BY c.id
          ORDER BY c.name ASC`
    );
  }

  async getByChurchAndMonth(
    churchId: number,
    year: number,
    month: number
  ): Promise<ReconciliationRow | undefined> {
    return this.db
      .select()
      .from(reconciliations)
      .where(
        and(
          eq(reconciliations.churchId, churchId),
          eq(reconciliations.year, year),
          eq(reconciliations.month, month)
        )
      )
      .get();
  }
}
