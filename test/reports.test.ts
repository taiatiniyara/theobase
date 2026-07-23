import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER REFERENCES households(id), full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')), join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')), status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, module TEXT NOT NULL DEFAULT 'core');` +
  `CREATE TABLE IF NOT EXISTS member_positions (member_id INTEGER NOT NULL REFERENCES members(id), position_id INTEGER NOT NULL REFERENCES positions(id), start_date TEXT NOT NULL DEFAULT (datetime('now')), end_date TEXT, PRIMARY KEY (member_id, position_id));` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), reset_token TEXT, reset_token_expires TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transfer_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL REFERENCES members(id), from_church_id INTEGER NOT NULL REFERENCES churches(id), to_church_id INTEGER NOT NULL REFERENCES churches(id), initiated_by INTEGER NOT NULL REFERENCES users(id), initiated_at TEXT NOT NULL DEFAULT (datetime('now')), conference_approved_by INTEGER REFERENCES users(id), conference_approved_at TEXT, accepted_by INTEGER REFERENCES users(id), accepted_at TEXT, rejection_note TEXT, expires_at TEXT, override_by INTEGER REFERENCES users(id), override_at TEXT, override_action TEXT, override_note TEXT, status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected', 'expired')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS expense_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS offering_batches (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), sabbath_date TEXT NOT NULL, confirmed_by_1 INTEGER REFERENCES users(id), confirmed_at_1 TEXT, confirmed_by_2 INTEGER REFERENCES users(id), confirmed_at_2 TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'synced')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, category_id INTEGER REFERENCES expense_categories(id), budget_ref INTEGER, batch_id INTEGER REFERENCES offering_batches(id), created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), confirmed_by INTEGER REFERENCES users(id), confirmed_at TEXT, uuid TEXT NOT NULL UNIQUE);` +
  `CREATE TABLE IF NOT EXISTS budgets (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), category_id INTEGER NOT NULL REFERENCES expense_categories(id), planned_amount REAL NOT NULL, fiscal_year INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

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

    const sr = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "qr@t.com",
        password: "password123",
        fullName: "QR Admin",
        conferenceName: "Central",
      }),
    });
    const sb = (await sr.json()) as { accessToken: string };
    accessToken = sb.accessToken;

    const mr = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const mb = (await mr.json()) as { id: number; conference: { id: number } };
    userId = mb.id;
    conferenceId = mb.conference.id;

    const cr = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Test Church",
        code: "TC",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const cb = (await cr.json()) as { id: number };
    churchId = cb.id;

    const fr = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Tithe",
        type: "tithe",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    titheFundId = ((await fr.json()) as { id: number }).id;

    const bfr = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Local Budget",
        type: "local_budget",
        forwardingRule: "local",
        conferenceId,
      }),
    });
    budgetFundId = ((await bfr.json()) as { id: number }).id;

    const sfr = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Sabbath School",
        type: "sabbath_school",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    ssFundId = ((await sfr.json()) as { id: number }).id;

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

    const mr2 = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: hh,
      body: JSON.stringify({
        churchId,
        fullName: "Member One",
        baptismDate: "2026-07-10",
        baptismType: "immersion",
      }),
    });
    memberId = ((await mr2.json()) as { id: number }).id;

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
