import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), full_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), reset_token TEXT, reset_token_expires TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS offering_batches (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), sabbath_date TEXT NOT NULL, confirmed_by_1 INTEGER REFERENCES users(id), confirmed_at_1 TEXT, confirmed_by_2 INTEGER REFERENCES users(id), confirmed_at_2 TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'synced')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, category_id INTEGER, batch_id INTEGER REFERENCES offering_batches(id), created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), confirmed_by INTEGER REFERENCES users(id), confirmed_at TEXT, uuid TEXT NOT NULL UNIQUE);` +
  `CREATE TABLE IF NOT EXISTS reconciliations (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), year INTEGER NOT NULL, month INTEGER NOT NULL, forwarded_tithe REAL NOT NULL DEFAULT 0, received_tithe REAL, tithe_discrepancy REAL, tithe_status TEXT NOT NULL DEFAULT 'pending' CHECK (tithe_status IN ('pending', 'received', 'discrepancy')), tithe_note TEXT, bank_balance REAL, system_balance REAL, bank_discrepancy REAL, bank_note TEXT, reconciled_by INTEGER REFERENCES users(id), reconciled_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(church_id, year, month));`;

describe("reconciliation API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;
  let churchId2: number;
  let userId: number;
  let titheFundId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);

    const sr = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "rec@t.com",
        password: "password123",
        fullName: "Rec Admin",
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

    const cr1 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Church A",
        code: "CA",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    churchId = ((await cr1.json()) as { id: number }).id;

    const cr2 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: "Church B",
        code: "CB",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    churchId2 = ((await cr2.json()) as { id: number }).id;

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

    await env.DB.exec(
      `INSERT INTO offering_batches (id, church_id, sabbath_date, status, confirmed_by_1, confirmed_at_1, confirmed_by_2, confirmed_at_2) VALUES (1, ${churchId}, '2026-07-04', 'confirmed', ${userId}, '2026-07-04', ${userId}, '2026-07-04')`
    );
    await env.DB.exec(
      `INSERT INTO offering_batches (id, church_id, sabbath_date, status, confirmed_by_1, confirmed_at_1, confirmed_by_2, confirmed_at_2) VALUES (2, ${churchId2}, '2026-07-04', 'confirmed', ${userId}, '2026-07-04', ${userId}, '2026-07-04')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId}, ${titheFundId}, 'income', 500, 'Tithe', 1, ${userId}, '2026-07-04', ${userId}, '2026-07-04', 'r1')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId}, ${titheFundId}, 'income', 300, 'Tithe', 1, ${userId}, '2026-07-04', ${userId}, '2026-07-04', 'r2')`
    );
    await env.DB.exec(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, batch_id, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (${churchId2}, ${titheFundId}, 'income', 1000, 'Tithe', 2, ${userId}, '2026-07-04', ${userId}, '2026-07-04', 'r3')`
    );

    await env.DB.prepare(
      "INSERT INTO reconciliations (church_id, year, month, forwarded_tithe, received_tithe, tithe_discrepancy, tithe_status, tithe_note, reconciled_by, reconciled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
    )
      .bind(churchId, 2026, 7, 800, 750, 50, "discrepancy", "Test note", userId)
      .run();
  });

  it("lists tithe forwarded per church for a month", async () => {
    const r = await SELF.fetch(`http://localhost/api/conference/tithe?year=2026&month=7`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      tithe: { churchId: number; churchName: string; forwardedAmount: number; status: string }[];
    };
    expect(b.tithe.length).toBe(2);
    const churchA = b.tithe.find((t) => t.churchId === churchId);
    const churchB = b.tithe.find((t) => t.churchId === churchId2);
    expect(churchA?.forwardedAmount).toBe(800);
    expect(churchB?.forwardedAmount).toBe(1000);
    expect(churchA?.status).toBe("discrepancy");
  });

  it("marks tithe as received and records discrepancy", async () => {
    const hh = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const r = await SELF.fetch("http://localhost/api/conference/tithe/receive", {
      method: "POST",
      headers: hh,
      body: JSON.stringify({
        churchId: churchId2,
        year: 2026,
        month: 7,
        receivedAmount: 900,
        note: "Bank deposit confirmed",
      }),
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      reconciliation: { titheStatus: string; titheDiscrepancy: number };
    };
    expect(b.reconciliation.titheStatus).toBe("discrepancy");
    expect(b.reconciliation.titheDiscrepancy).toBe(100);

    const r2 = await SELF.fetch(`http://localhost/api/conference/tithe?year=2026&month=7`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const b2 = (await r2.json()) as {
      tithe: { churchId: number; status: string }[];
    };
    const churchB = b2.tithe.find((t) => t.churchId === churchId2);
    expect(churchB?.status).toBe("discrepancy");
  });

  it("records church bank balance and computes system balance", async () => {
    const hh = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    const r = await SELF.fetch("http://localhost/api/church/balance", {
      method: "POST",
      headers: hh,
      body: JSON.stringify({
        churchId,
        year: 2026,
        month: 7,
        bankBalance: 500,
        note: "End of month",
      }),
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      reconciliation: { bankBalance: number; systemBalance: number; bankDiscrepancy: number };
    };
    expect(b.reconciliation.bankBalance).toBe(500);
    expect(b.reconciliation.bankDiscrepancy).toBeDefined();

    const r2 = await SELF.fetch(
      `http://localhost/api/church/balance?church_id=${churchId}&year=2026&month=7`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    expect(r2.status).toBe(200);
  });

  it("conference reconciliation report", async () => {
    const r = await SELF.fetch(`http://localhost/api/conference/tithe/report?year=2026&month=7`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      report: {
        churchId: number;
        churchName: string;
        forwarded: number;
        received: number;
        difference: number;
        status: string;
      }[];
    };
    expect(b.report.length).toBe(2);
    const churchA = b.report.find((t) => t.churchId === churchId);
    expect(churchA?.forwarded).toBe(800);
    expect(churchA?.received).toBe(750);
    expect(churchA?.difference).toBe(50);
    expect(churchA?.status).toBe("discrepancy");
  });

  it("rejects unauthenticated access", async () => {
    const eps = [
      "/api/conference/tithe?year=2026&month=7",
      "/api/conference/tithe/report?year=2026&month=7",
    ];
    for (const ep of eps) {
      expect((await SELF.fetch(`http://localhost${ep}`)).status).toBe(401);
    }
  });
});
