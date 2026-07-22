import { DurableObject } from "cloudflare:workers";

export class ConferenceDO extends DurableObject {
  private sql = this.ctx.storage.sql;

  async getConferenceInfo(): Promise<{
    id: number;
    name: string;
    code: string;
    churchCount: number;
    memberCount: number;
  } | null> {
    const conference = this.sql.exec("SELECT id, name, code FROM conferences ORDER BY id LIMIT 1");
    if (conference.rowsRead === 0) return null;

    const row = conference.one();
    const churchCount = this.sql.exec(
      "SELECT COUNT(*) as count FROM churches WHERE parent_id = ? AND parent_type = 'conference'",
      row.id
    );
    const memberCount = this.sql.exec(
      `SELECT COUNT(*) as count FROM members m
       JOIN churches c ON m.church_id = c.id
       WHERE c.parent_id = ? AND c.parent_type = 'conference'`,
      row.id
    );

    return {
      id: Number(row.id),
      name: String(row.name),
      code: String(row.code),
      churchCount: Number(churchCount.one().count),
      memberCount: Number(memberCount.one().count),
    };
  }

  async aggregateFinance(
    month: string,
    year: string
  ): Promise<{
    totalTithe: number;
    totalOfferings: number;
    totalExpenses: number;
    churchBreakdown: { churchId: number; churchName: string; tithe: number; offerings: number }[];
  }> {
    const period = `${year}-${month.padStart(2, "0")}%`;
    const result = this.sql.exec(
      `SELECT t.type, SUM(t.amount) as total, c.parent_id as conference_id
       FROM transactions t
       JOIN churches ch ON t.church_id = ch.id
       JOIN conferences c ON c.id = ?
       WHERE ch.parent_id = c.id
         AND ch.parent_type = 'conference'
         AND t.created_at LIKE ?
       GROUP BY t.type`,
      1,
      period
    );
    const rows = result.toArray();

    let totalTithe = 0;
    let totalOfferings = 0;
    let totalExpenses = 0;
    for (const row of rows) {
      const amount = Number(row.total);
      if (row.type === "income") totalOfferings += amount;
      else if (row.type === "forward") totalTithe += amount;
      else if (row.type === "expense") totalExpenses += amount;
    }

    return {
      totalTithe,
      totalOfferings,
      totalExpenses,
      churchBreakdown: [],
    };
  }
}
