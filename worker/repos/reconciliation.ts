import { eq, and, sql } from "drizzle-orm";
import type { Db } from "../lib/db";
import { reconciliations } from "../schema/reconciliation";

export interface ReceiveTitheData {
  churchId: number;
  year: number;
  month: number;
  receivedAmount?: number;
  note?: string;
  reconciledBy: number;
}

export interface SetBalanceData {
  churchId: number;
  year: number;
  month: number;
  bankBalance: number;
  note?: string;
}

export interface ConferenceTitheRow {
  churchId: number;
  churchName: string;
  forwardedTithe: number;
  receivedTithe: number | null;
  titheStatus: string;
  note: string | null;
  titheDiscrepancy: number | null;
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

  async getConferenceTithe(
    conferenceId: number,
    year: number,
    month: number
  ): Promise<ConferenceTitheRow[]> {
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    return this.db.all<ConferenceTitheRow>(
      sql`SELECT
            c.id as "churchId",
            c.name as "churchName",
            COALESCE(SUM(t.amount), 0) as "forwardedTithe",
            r.received_tithe as "receivedTithe",
            MAX(COALESCE(r.tithe_status, 'pending')) as "titheStatus",
            MAX(r.tithe_note) as "note"
          FROM churches c
          JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
            AND t.confirmed_by IS NOT NULL
            AND t.created_at >= ${periodStart} AND t.created_at < ${nextMonth}
          JOIN funds f ON t.fund_id = f.id AND f.type = 'tithe'
          LEFT JOIN reconciliations r ON r.church_id = c.id
            AND r.year = ${year} AND r.month = ${month}
          WHERE c.parent_id = ${conferenceId} AND c.parent_type = 'conference'
          GROUP BY c.id
          ORDER BY c.name ASC`
    );
  }

  async receiveTithe(data: ReceiveTitheData): Promise<ReconciliationRow> {
    const forwardedRow = await this.db.get<{ total: number }>(
      sql`SELECT COALESCE(SUM(t.amount), 0) as total
          FROM transactions t
          JOIN funds f ON t.fund_id = f.id
          WHERE t.church_id = ${data.churchId} AND t.type = 'income'
            AND f.type = 'tithe' AND t.confirmed_by IS NOT NULL`
    );

    const forwarded = forwardedRow?.total ?? 0;
    const received = data.receivedAmount ?? forwarded;
    const discrepancy = forwarded - received;
    const status = discrepancy === 0 ? "received" : "discrepancy";

    return this.db.get<ReconciliationRow>(
      sql`INSERT INTO reconciliations (church_id, year, month, forwarded_tithe, received_tithe, tithe_discrepancy, tithe_status, tithe_note, reconciled_by, reconciled_at)
          VALUES (${data.churchId}, ${data.year}, ${data.month}, ${forwarded}, ${received}, ${discrepancy}, ${status}, ${data.note ?? null}, ${data.reconciledBy}, datetime('now'))
          ON CONFLICT(church_id, year, month) DO UPDATE SET
            forwarded_tithe = excluded.forwarded_tithe,
            received_tithe = excluded.received_tithe,
            tithe_discrepancy = excluded.tithe_discrepancy,
            tithe_status = excluded.tithe_status,
            tithe_note = excluded.tithe_note,
            reconciled_by = excluded.reconciled_by,
            reconciled_at = datetime('now')
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

  async getSystemBalance(churchId: number): Promise<number> {
    const row = await this.db.get<{ balance: number }>(
      sql`SELECT COALESCE(SUM(CASE WHEN t.type = 'income' AND f.forwarding_rule = 'local' THEN t.amount ELSE 0 END), 0) -
                 COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as balance
          FROM transactions t
          JOIN funds f ON t.fund_id = f.id
          WHERE t.church_id = ${churchId} AND (t.confirmed_by IS NOT NULL OR t.type = 'expense')`
    );
    return row?.balance ?? 0;
  }

  async setChurchBalance(data: SetBalanceData): Promise<ReconciliationRow> {
    const systemBalance = await this.getSystemBalance(data.churchId);
    const bankDiscrepancy = systemBalance - data.bankBalance;

    const existing = await this.db.get<{ id: number }>(
      sql`SELECT id FROM reconciliations WHERE church_id = ${data.churchId} AND year = ${data.year} AND month = ${data.month}`
    );

    if (existing) {
      return this.db.get<ReconciliationRow>(
        sql`UPDATE reconciliations
            SET bank_balance = ${data.bankBalance},
                system_balance = ${systemBalance},
                bank_discrepancy = ${bankDiscrepancy},
                bank_note = ${data.note ?? null}
            WHERE id = ${existing.id}
            RETURNING *`
      );
    }

    return this.db.get<ReconciliationRow>(
      sql`INSERT INTO reconciliations (church_id, year, month, bank_balance, system_balance, bank_discrepancy, bank_note)
          VALUES (${data.churchId}, ${data.year}, ${data.month}, ${data.bankBalance}, ${systemBalance}, ${bankDiscrepancy}, ${data.note ?? null})
          RETURNING *`
    );
  }

  async getTitheReport(
    conferenceId: number,
    year: number,
    month: number
  ): Promise<TitheReportRow[]> {
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    return this.db.all<TitheReportRow>(
      sql`SELECT
            c.id as "churchId",
            c.name as "churchName",
            COALESCE(SUM(t.amount), 0) as "forwardedTithe",
            MAX(COALESCE(r.received_tithe, 0)) as "receivedTithe",
            COALESCE(SUM(t.amount), 0) - MAX(COALESCE(r.received_tithe, 0)) as "titheDiscrepancy",
            MAX(COALESCE(r.tithe_status, 'pending')) as "titheStatus",
            r.bank_balance as "bankBalance",
            r.system_balance as "systemBalance"
          FROM churches c
          JOIN transactions t ON t.church_id = c.id AND t.type = 'income'
            AND t.confirmed_by IS NOT NULL
            AND t.created_at >= ${periodStart} AND t.created_at < ${nextMonth}
          JOIN funds f ON t.fund_id = f.id AND f.type = 'tithe'
          LEFT JOIN reconciliations r ON r.church_id = c.id
            AND r.year = ${year} AND r.month = ${month}
          WHERE c.parent_id = ${conferenceId} AND c.parent_type = 'conference'
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
