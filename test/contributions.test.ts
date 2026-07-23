import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER, address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER REFERENCES households(id), full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT, join_date TEXT, prev_church_id INTEGER, phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active', status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER, conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, category_id INTEGER, budget_ref INTEGER, batch_id INTEGER, created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), confirmed_by INTEGER REFERENCES users(id), confirmed_at TEXT, uuid TEXT NOT NULL UNIQUE, envelope_number INTEGER, member_id INTEGER REFERENCES members(id));`;

describe("contribution statements API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;
  let userId: number;
  let fundTithe: number;
  let fundLocal: number;
  let fundSS: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");

    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "contreas@test.com",
        password: "password123",
        fullName: "Treasurer",
        conferenceName: "Cont Conf",
      }),
    });
    const signupBody = (await signupRes.json()) as {
      accessToken: string;
      userId: string;
      role: string;
    };
    accessToken = signupBody.accessToken;
    userId = Number(signupBody.userId);

    const meRes = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = (await meRes.json()) as { conference: { id: number } };
    conferenceId = me.conference.id;

    const c1 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Central Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const c1Body = (await c1.json()) as { id: number };
    churchId = c1Body.id;

    // Create funds
    const f1 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Tithe",
        type: "tithe",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    fundTithe = ((await f1.json()) as { id: number }).id;

    const f2 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Local Budget",
        type: "local_budget",
        forwardingRule: "local",
        conferenceId,
      }),
    });
    fundLocal = ((await f2.json()) as { id: number }).id;

    const f3 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Sabbath School",
        type: "sabbath_school",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    fundSS = ((await f3.json()) as { id: number }).id;

    // Create members
    const m1 = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        churchId,
        fullName: "Jane Doe",
        status: "active",
      }),
    });
    const member1Id = ((await m1.json()) as { id: number }).id;

    const m2 = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        churchId,
        fullName: "John Smith",
        status: "active",
      }),
    });
    const member2Id = ((await m2.json()) as { id: number }).id;

    // Create transactions linked to members (bypassing the batch requirement via direct DB insert)
    const uuid = () => crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, created_at, confirmed_by, confirmed_at, uuid, member_id, envelope_number)
       VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        churchId,
        fundTithe,
        500.0,
        "Tithe Jan 4",
        userId,
        "2026-01-04T10:00:00Z",
        userId,
        "2026-01-04T10:05:00Z",
        uuid(),
        member1Id,
        101
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, created_at, confirmed_by, confirmed_at, uuid, member_id, envelope_number)
       VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        churchId,
        fundLocal,
        200.0,
        "Budget Jan 4",
        userId,
        "2026-01-04T10:01:00Z",
        userId,
        "2026-01-04T10:05:00Z",
        uuid(),
        member1Id,
        102
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, created_at, confirmed_by, confirmed_at, uuid, member_id, envelope_number)
       VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        churchId,
        fundTithe,
        300.0,
        "Tithe Jan 11",
        userId,
        "2026-01-11T10:00:00Z",
        userId,
        "2026-01-11T10:05:00Z",
        uuid(),
        member1Id,
        103
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, created_at, confirmed_by, confirmed_at, uuid, member_id, envelope_number)
       VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        churchId,
        fundTithe,
        750.0,
        "Tithe Jan 11",
        userId,
        "2026-01-11T10:02:00Z",
        userId,
        "2026-01-11T10:05:00Z",
        uuid(),
        member2Id,
        201
      )
      .run();

    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, description, created_by, created_at, confirmed_by, confirmed_at, uuid, member_id, envelope_number)
       VALUES (?, ?, 'income', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        churchId,
        fundSS,
        150.0,
        "Sabbath School Jan 11",
        userId,
        "2026-01-11T10:03:00Z",
        userId,
        "2026-01-11T10:05:00Z",
        uuid(),
        member2Id,
        202
      )
      .run();
  });

  function authHeaders() {
    return { Authorization: `Bearer ${accessToken}` };
  }

  it("GET /api/contributions returns donor summaries with totals", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/contributions?church_id=${churchId}&year=2026`,
      { headers: authHeaders() }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      contributions: {
        donorId: number;
        donorName: string;
        totals: Record<string, number>;
        grandTotal: number;
        transactionCount: number;
      }[];
    };
    expect(body.contributions.length).toBe(2);

    const jane = body.contributions.find((c) => c.donorName === "Jane Doe");
    expect(jane).toBeDefined();
    if (jane) {
      expect(jane.totals.tithe).toBeCloseTo(800, 0);
      expect(jane.totals.local_budget).toBeCloseTo(200, 0);
      expect(jane.grandTotal).toBeCloseTo(1000, 0);
      expect(jane.transactionCount).toBe(3);
    }

    const john = body.contributions.find((c) => c.donorName === "John Smith");
    expect(john).toBeDefined();
    if (john) {
      expect(john.totals.tithe).toBeCloseTo(750, 0);
      expect(john.totals.sabbath_school).toBeCloseTo(150, 0);
      expect(john.grandTotal).toBeCloseTo(900, 0);
      expect(john.transactionCount).toBe(2);
    }
  });

  it("GET /api/contributions/:donorId returns individual statement", async () => {
    const listRes = await SELF.fetch(
      `http://localhost/api/contributions?church_id=${churchId}&year=2026`,
      { headers: authHeaders() }
    );
    const listBody = (await listRes.json()) as {
      contributions: { donorId: number }[];
    };
    const janeId = listBody.contributions.find((c) => c.donorId)!.donorId;

    const res = await SELF.fetch(
      `http://localhost/api/contributions/${janeId}?church_id=${churchId}&year=2026`,
      { headers: authHeaders() }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      donorId: number;
      donorName: string;
      churchName: string;
      transactions: { date: string; amount: number; fund: string; fundName: string }[];
      totals: Record<string, number>;
      grandTotal: number;
    };

    expect(body.donorId).toBe(janeId);
    expect(body.donorName).toBe("Jane Doe");
    expect(body.churchName).toBe("Central Church");
    expect(body.transactions.length).toBe(3);
    expect(body.totals.tithe).toBeCloseTo(800, 0);
    expect(body.totals.local_budget).toBeCloseTo(200, 0);
    expect(body.grandTotal).toBeCloseTo(1000, 0);
  });

  it("GET /api/contributions filters by year correctly", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/contributions?church_id=${churchId}&year=2025`,
      { headers: authHeaders() }
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { contributions: unknown[] };
    expect(body.contributions.length).toBe(0);
  });

  it("GET /api/contributions requires authentication", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/contributions?church_id=${churchId}&year=2026`
    );
    expect(res.status).toBe(401);
  });

  it("GET /api/contributions/:donorId requires authentication", async () => {
    const res = await SELF.fetch(
      `http://localhost/api/contributions/1?church_id=${churchId}&year=2026`
    );
    expect(res.status).toBe(401);
  });
});
