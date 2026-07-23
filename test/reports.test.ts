import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";
import { FULL_SCHEMA } from "./helpers/schema";
import { setupTestContext } from "./helpers/auth";
import { createFund, createMember } from "./helpers/factories";

describe("quarterly business meeting report", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;
  let userId: number;
  let memberId: number;
  let titheFundId: number;
  let budgetFundId: number;
  let ssFundId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);

    const ctx = await setupTestContext();
    accessToken = ctx.accessToken;
    conferenceId = ctx.conferenceId;
    churchId = ctx.churchId;
    userId = ctx.userId;

    titheFundId = (await createFund(accessToken, conferenceId, "Tithe", "tithe")).id;
    budgetFundId = (await createFund(accessToken, conferenceId, "Local Budget", "local_budget")).id;
    ssFundId = (await createFund(accessToken, conferenceId, "Sabbath School", "sabbath_school")).id;

    const ecr = await SELF.fetch("http://localhost/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ name: "Utilities", conferenceId }),
    });
    const ecb = (await ecr.json()) as { id: number };

    const hh = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    memberId = (
      await createMember(accessToken, {
        churchId,
        fullName: "Member One",
        baptismDate: "2026-07-10",
        baptismType: "immersion",
      })
    ).id;

    await SELF.fetch("http://localhost/api/positions", {
      method: "POST",
      headers: hh,
      body: JSON.stringify({ name: "Elder" }),
    });

    await SELF.fetch(`http://localhost/api/members/${memberId}/positions`, {
      method: "POST",
      headers: hh,
      body: JSON.stringify({ positionId: 1 }),
    });

    await env.DB.exec(
      `INSERT INTO offering_batches (id, church_id, sabbath_date, status, confirmed_by_1, confirmed_at_1, confirmed_by_2, confirmed_at_2) VALUES (1, ${churchId}, '2026-07-04', 'confirmed', ${userId}, '2026-07-04', ${userId}, '2026-07-04')`
    );
    await env.DB.exec(
      `INSERT INTO offering_batches (id, church_id, sabbath_date, status, confirmed_by_1, confirmed_at_1, confirmed_by_2, confirmed_at_2) VALUES (2, ${churchId}, '2026-07-11', 'confirmed', ${userId}, '2026-07-11', ${userId}, '2026-07-11')`
    );
    await env.DB.exec(
      `INSERT INTO offering_batches (id, church_id, sabbath_date, status, confirmed_by_1, confirmed_at_1, confirmed_by_2, confirmed_at_2) VALUES (3, ${churchId}, '2026-07-18', 'confirmed', ${userId}, '2026-07-18', ${userId}, '2026-07-18')`
    );

    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId}, ${titheFundId}, 'income', 500, 'Tithe', 1, ${userId}, '2026-07-04', ${userId}, '2026-07-04', 'a1')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId}, ${budgetFundId}, 'income', 300, 'Budget offering', 2, ${userId}, '2026-07-11', ${userId}, '2026-07-11', 'a2')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId}, ${ssFundId}, 'income', 200, 'SS', 3, ${userId}, '2026-07-18', ${userId}, '2026-07-18', 'a3')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, category_id, budget_ref, created_by, created_at, uuid) VALUES (${churchId}, ${budgetFundId}, 'expense', 150, 'Electricity', ${ecb.id}, NULL, ${userId}, '2026-07-20', 'a4')`
    );
  });

  it("returns quarterly report with membership, finance, and officers", async () => {
    const hh = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const r = await SELF.fetch(
      `http://localhost/api/report/quarterly?church_id=${churchId}&year=2026&quarter=3`,
      { headers: hh }
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      report: {
        churchId: number;
        period: { year: number; quarter: number };
        membership: {
          opening: number;
          baptisms: number;
          professions: number;
          transfersIn: number;
          transfersOut: number;
          deaths: number;
          removals: number;
          closing: number;
        };
        finance: {
          titheForwarded: number;
          localBudgetIncome: number;
          localBudgetExpenses: number;
          localBudgetBalance: number;
          sabbathSchoolForwarded: number;
        };
        officers: { memberName: string; positionName: string }[];
      };
    };

    expect(b.report.churchId).toBe(churchId);
    expect(b.report.period.year).toBe(2026);
    expect(b.report.period.quarter).toBe(3);
    expect(b.report.membership.baptisms).toBeGreaterThanOrEqual(1);
    expect(b.report.membership.closing).toBeGreaterThanOrEqual(1);
    expect(b.report.finance.titheForwarded).toBeGreaterThanOrEqual(500);
    expect(b.report.finance.localBudgetIncome).toBeGreaterThanOrEqual(300);
    expect(b.report.finance.sabbathSchoolForwarded).toBeGreaterThanOrEqual(200);
    expect(b.report.finance.localBudgetExpenses).toBeGreaterThanOrEqual(150);
    expect(b.report.officers.length).toBeGreaterThanOrEqual(1);
  });

  it("requires church_id, year, and quarter params", async () => {
    const hh = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const r1 = await SELF.fetch(`http://localhost/api/report/quarterly`, { headers: hh });
    expect(r1.status).toBe(400);

    const r2 = await SELF.fetch(`http://localhost/api/report/quarterly?church_id=${churchId}`, {
      headers: hh,
    });
    expect(r2.status).toBe(400);
  });

  it("rejects unauthenticated access", async () => {
    const r = await SELF.fetch(
      `http://localhost/api/report/quarterly?church_id=1&year=2026&quarter=1`
    );
    expect(r.status).toBe(401);
  });
});
