import type { AppType } from "../types";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import * as schema from "@theobase/db";
import { requireAuth, requireRole } from "@theobase/auth";
import { loadRoles } from "../middleware/load-roles";
import { getDb } from "../middleware/get-db";

export function registerConferenceRoutes(app: AppType) {
  app.get("/conference/stats", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const quarterStart = c.req.query("quarterStart") || "";
    const quarterEnd = c.req.query("quarterEnd") || "";

    const dateFilter = (start: string, end: string) => {
      if (start && end) {
        return and(gte(schema.receipt.createdAt, start), lte(schema.receipt.createdAt, end));
      }
      return undefined;
    };

    const receiptFilter = dateFilter(quarterStart, quarterEnd);
    const expenseFilter = quarterStart && quarterEnd
      ? and(gte(schema.expense.createdAt, quarterStart), lte(schema.expense.createdAt, quarterEnd))
      : undefined;

    const [receipts, expenses, transfers, meetings, members] = await Promise.all([
      receiptFilter
        ? db.select().from(schema.receipt).where(and(eq(schema.receipt.congregationId, congregationId), receiptFilter))
        : db.select().from(schema.receipt).where(eq(schema.receipt.congregationId, congregationId)),
      expenseFilter
        ? db.select().from(schema.expense).where(and(eq(schema.expense.congregationId, congregationId), expenseFilter))
        : db.select().from(schema.expense).where(eq(schema.expense.congregationId, congregationId)),
      db.select().from(schema.transferRequest).where(eq(schema.transferRequest.fromCongregationId, congregationId)),
      db.select().from(schema.boardMeeting).where(eq(schema.boardMeeting.congregationId, congregationId)),
      db.select({ count: sql<number>`count(*)` }).from(schema.person).where(eq(schema.person.congregationId, congregationId)),
    ]);

    const totalIncome = receipts.reduce((sum: number, r: typeof schema.receipt.$inferSelect) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum: number, e: typeof schema.expense.$inferSelect) => sum + e.amount, 0);
    const approvedReceipts = receipts.filter((r: typeof schema.receipt.$inferSelect) => r.status === "approved").length;

    return c.json({
      congregationId,
      receipts: receipts.length,
      approvedReceipts,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transfers: transfers.length,
      meetings: meetings.length,
      members: members[0]?.count || 0,
      quarterStart,
      quarterEnd,
      generatedAt: new Date().toISOString(),
    });
  });

  app.get("/conference/export", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const quarterStart = c.req.query("quarterStart") || "";
    const quarterEnd = c.req.query("quarterEnd") || "";
    const format = c.req.query("format") || "csv";

    const receipts = await db.select().from(schema.receipt).where(
      quarterStart && quarterEnd
        ? and(eq(schema.receipt.congregationId, congregationId), gte(schema.receipt.createdAt, quarterStart), lte(schema.receipt.createdAt, quarterEnd))
        : eq(schema.receipt.congregationId, congregationId)
    );

    const expenses = await db.select().from(schema.expense).where(
      quarterStart && quarterEnd
        ? and(eq(schema.expense.congregationId, congregationId), gte(schema.expense.createdAt, quarterStart), lte(schema.expense.createdAt, quarterEnd))
        : eq(schema.expense.congregationId, congregationId)
    );

      const persons = await db.select().from(schema.person).where(eq(schema.person.congregationId, congregationId));
      const boardMeetings = await db.select().from(schema.boardMeeting).where(eq(schema.boardMeeting.congregationId, congregationId));

      const incomeTotal = receipts.reduce((s: number, r: typeof schema.receipt.$inferSelect) => s + r.amount, 0);
      const expenseTotal = expenses.reduce((s: number, e: typeof schema.expense.$inferSelect) => s + e.amount, 0);
      const netTotal = incomeTotal - expenseTotal;

    if (format === "csv") {
      const header = quarterStart ? `Q${Math.floor((parseInt(quarterStart.slice(5, 7)) - 1) / 3) + 1} ${quarterStart.slice(0, 4)}` : "All Time";
      const rows: string[] = [
        `Theobase Quarterly Report — ${header}`,
        `Congregation ID: ${congregationId}`,
        `Period: ${quarterStart || "All Time"} to ${quarterEnd || "All Time"}`,
        `Generated: ${new Date().toISOString()}`,
        "",
        "--- MEMBERSHIP ---",
        "Total Members," + persons.filter((p: typeof schema.person.$inferSelect) => p.isMember).length,
        "Total Persons," + persons.length,
        "",
        "--- FINANCE ---",
        "Metric,Value (cents)",
        `Total Income,${incomeTotal}`,
        `Total Expenses,${expenseTotal}`,
        `Net Balance,${netTotal}`,
        `Receipts Submitted,${receipts.length}`,
        `Receipts Approved,${receipts.filter((r: typeof schema.receipt.$inferSelect) => r.status === "approved").length}`,
        `Receipts Pending,${receipts.filter((r: typeof schema.receipt.$inferSelect) => r.status === "pending").length}`,
        `Receipts Rejected,${receipts.filter((r: typeof schema.receipt.$inferSelect) => r.status === "rejected").length}`,
        `Expenses Recorded,${expenses.length}`,
        "",
        "--- GOVERNANCE ---",
        `Board Meetings,${boardMeetings.length}`,
        "",
        "--- RECEIPT DETAILS ---",
        "ID,Amount,Status,Fund Split,Created",
      ];

      for (const r of receipts) {
        const split = typeof r.fundSplit === "string" ? r.fundSplit : JSON.stringify(r.fundSplit || {});
        rows.push(`${r.id},${r.amount},${r.status},"${split.replace(/"/g, '""')}",${r.createdAt}`);
      }

      rows.push("", "--- EXPENSE DETAILS ---", "ID,Amount,Category,Description,Created");
      for (const e of expenses) {
        rows.push(`${e.id},${e.amount},${e.category},"${e.description.replace(/"/g, '""')}",${e.createdAt}`);
      }

      return new Response(rows.join("\n"), {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="theobase-report-${quarterStart || "all"}.csv"`,
        },
      });
    }

    return c.json({
      congregationId,
      receipts,
      expenses,
      persons,
      boardMeetings,
      quarterStart,
      quarterEnd,
      generatedAt: new Date().toISOString(),
    });
  });

  app.get("/conference/export/minutes", requireAuth(), loadRoles(), requireRole("clerk", "treasurer", "elder"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const meetings = await db
      .select()
      .from(schema.boardMeeting)
      .where(eq(schema.boardMeeting.congregationId, congregationId));

    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Board Minutes — Theobase</title>
      <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1e293b}
      h1{color:#1e3a5f}h2{color:#334155;border-bottom:1px solid #e2e8f0;padding-bottom:8px}
      .meeting{margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:8px}
      .decision{margin:8px 0;padding:8px;background:#f8fafc;border-radius:4px}
      .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600}
      .approved{background:#dcfce7;color:#166534}.rejected{background:#fef2f2;color:#991b1b}
      .tabled{background:#fef9c3;color:#854d0e}.footer{text-align:center;color:#94a3b8;font-size:12px;margin-top:40px}
      </style></head><body>
      <h1>Board Minutes</h1><p>Congregation: ${congregationId}</p><p>Generated: ${new Date().toISOString()}</p>`;

    for (const meeting of meetings) {
      html += `<div class="meeting"><h2>Meeting — ${meeting.date}</h2><p>Status: <strong>${meeting.status}</strong></p>`;

      const minutes = await db
        .select()
        .from(schema.boardMinute)
        .where(eq(schema.boardMinute.meetingId, meeting.id));

      if (minutes.length > 0) {
        html += '<div class="decision"><h3>Minutes</h3>';
        for (const m of minutes) {
          html += `<p>${m.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        }
        html += '</div>';
      }

      const decisions = await db
        .select()
        .from(schema.boardDecision)
        .where(eq(schema.boardDecision.meetingId, meeting.id));

      for (const d of decisions) {
        html += `<div class="decision">
          <strong>Decision #${d.number}: ${d.title}</strong>
          ${d.description ? `<p>${d.description.replace(/</g, "&lt;")}</p>` : ""}
          <span class="badge ${d.voteOutcome || "tabled"}">${d.voteOutcome || "pending"}</span>
        </div>`;
      }

      html += '</div>';
    }

    html += '<div class="footer">Generated by Theobase — Digital Filing Cabinet for SDA Congregations</div></body></html>';

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="board-minutes.html"',
      },
    });
  });

  app.get("/conference/export/receipt-images", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const receipts = await db
      .select({ id: schema.receipt.id, imageKey: schema.receipt.imageKey, amount: schema.receipt.amount, status: schema.receipt.status, createdAt: schema.receipt.createdAt })
      .from(schema.receipt)
      .where(eq(schema.receipt.congregationId, congregationId));

    const manifest = receipts
      .filter((r: { imageKey: string | null }) => r.imageKey)
      .map((r: { id: string; imageKey: string | null; amount: number; status: string; createdAt: string }) => ({
        id: r.id,
        imageUrl: r.imageKey ? `/receipts/${r.id}/image` : null,
        amount: r.amount,
        status: r.status,
        createdAt: r.createdAt,
      }));

    return c.json({
      congregationId,
      totalReceipts: receipts.length,
      receiptsWithImages: manifest.length,
      images: manifest,
      generatedAt: new Date().toISOString(),
    });
  });

  app.get("/conference/export/full", requireAuth(), loadRoles(), requireRole("clerk", "treasurer"), async (c) => {
    const db = getDb(c);
    const congregationId = c.get("congregationId");
    if (!congregationId) return c.json({ error: "No congregation" }, 400);

    const [receipts, expenses, persons, boardMeetings, transfers, candidacies, households] = await Promise.all([
      db.select().from(schema.receipt).where(eq(schema.receipt.congregationId, congregationId)),
      db.select().from(schema.expense).where(eq(schema.expense.congregationId, congregationId)),
      db.select().from(schema.person).where(eq(schema.person.congregationId, congregationId)),
      db.select().from(schema.boardMeeting).where(eq(schema.boardMeeting.congregationId, congregationId)),
      db.select().from(schema.transferRequest).where(eq(schema.transferRequest.fromCongregationId, congregationId)),
      db.select().from(schema.candidacy).where(eq(schema.candidacy.congregationId, congregationId)),
      db.select().from(schema.household).where(eq(schema.household.congregationId, congregationId)),
    ]);

    return c.json({
      congregationId,
      generatedAt: new Date().toISOString(),
      membership: { totalPersons: persons.length, members: persons.filter((p: typeof schema.person.$inferSelect) => p.isMember).length, persons },
      finance: { receipts, expenses, totalIncome: receipts.reduce((s: number, r: typeof schema.receipt.$inferSelect) => s + r.amount, 0), totalExpenses: expenses.reduce((s: number, e: typeof schema.expense.$inferSelect) => s + e.amount, 0) },
      governance: { boardMeetings, transfers },
      evangelism: { candidacies },
      households,
    });
  });
}
