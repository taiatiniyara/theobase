import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER, full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')), join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')), status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), reset_token TEXT, reset_token_expires TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, category_id INTEGER, budget_ref INTEGER, batch_id INTEGER, created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), confirmed_by INTEGER REFERENCES users(id), confirmed_at TEXT, uuid TEXT NOT NULL UNIQUE);`;

describe("conference dashboard", () => {
  let accessToken: string;
  let tokenPastor: string;
  let confId: number;
  let churchId: number;
  let districtId: number;
  let titheFundId: number;
  let userId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);

    const sr = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "cd@t.com",
        password: "password123",
        fullName: "Conf Admin",
        conferenceName: "South",
      }),
    });
    const sb = (await sr.json()) as { accessToken: string };
    accessToken = sb.accessToken;

    const mr = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const mb = (await mr.json()) as { id: number; conference: { id: number } };
    userId = mb.id;
    confId = mb.conference.id;

    await env.DB.prepare(
      `INSERT INTO districts (id, name, conference_id) VALUES (1, 'South District', ?)`
    )
      .bind(confId)
      .run();
    districtId = 1;

    await env.DB.prepare(
      `INSERT INTO churches (id, name, code, type, parent_id, parent_type, district_id) VALUES (1, 'Bethel', 'BH', 'organized', ?, 'conference', ?)`
    )
      .bind(confId, districtId)
      .run();
    churchId = 1;

    await env.DB.prepare(
      `INSERT INTO churches (id, name, code, type, parent_id, parent_type, district_id) VALUES (2, 'Carmel', 'CR', 'company', ?, 'conference', ?)`
    )
      .bind(confId, districtId)
      .run();

    const hh = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

    const fr = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: hh,
      body: JSON.stringify({
        name: "Tithe",
        type: "tithe",
        forwardingRule: "conference",
        conferenceId: confId,
      }),
    });
    titheFundId = ((await fr.json()) as { id: number }).id;

    const now = new Date().toISOString().slice(0, 10);
    await env.DB.prepare(
      `INSERT INTO transactions (church_id, fund_id, type, amount, created_by, created_at, confirmed_by, confirmed_at, uuid) VALUES (?, ?, 'income', 1200, ?, ?, ?, ?, 't1')`
    )
      .bind(churchId, titheFundId, userId, now, userId, now)
      .run();

    await env.DB.prepare(
      `INSERT INTO members (id, church_id, full_name, status, baptism_date, baptism_type, created_at, updated_at) VALUES (1, ?, 'Anna', 'active', ?, 'immersion', ?, ?)`
    )
      .bind(churchId, `${new Date().getFullYear()}-02-15`, now, now)
      .run();

    await env.DB.prepare(
      `INSERT INTO members (id, church_id, full_name, status, created_at, updated_at) VALUES (2, ?, 'Ben', 'active', ?, ?)`
    )
      .bind(churchId, now, now)
      .run();

    const pr = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "pastor@t.com",
        password: "password123",
        fullName: "Pastor John",
      }),
    });
    const pb = (await pr.json()) as { accessToken: string };
    tokenPastor = pb.accessToken;

    const my = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${tokenPastor}` },
    });
    const md = (await my.json()) as { id: number };
    await env.DB.prepare(`UPDATE users SET role = 'pastor', conference_id = ? WHERE id = ?`)
      .bind(confId, md.id)
      .run();
    await env.DB.prepare(`UPDATE districts SET pastor_user_id = ? WHERE id = ?`)
      .bind(md.id, districtId)
      .run();
  });

  it("returns conference dashboard with summary and churches", async () => {
    const hh = { Authorization: `Bearer ${accessToken}` };
    const r = await SELF.fetch("http://localhost/api/conference/dashboard", { headers: hh });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      summary: {
        titheForwardedThisMonth: number;
        totalMembership: number;
        baptismsThisYear: number;
        churchCount: number;
      };
      churches: {
        id: number;
        name: string;
        titheMtd: number;
        memberCount: number;
        baptismsYtd: number;
      }[];
      districts: { id: number; name: string }[];
    };

    expect(b.summary.titheForwardedThisMonth).toBeGreaterThanOrEqual(1200);
    expect(b.summary.totalMembership).toBeGreaterThanOrEqual(2);
    expect(b.summary.churchCount).toBeGreaterThanOrEqual(2);
    expect(b.summary.baptismsThisYear).toBeGreaterThanOrEqual(1);
    expect(b.churches.length).toBeGreaterThanOrEqual(1);
    expect(b.districts.length).toBeGreaterThanOrEqual(1);
  });

  it("filters conference dashboard by district", async () => {
    const hh = { Authorization: `Bearer ${accessToken}` };
    const r = await SELF.fetch(
      `http://localhost/api/conference/dashboard?district_id=${districtId}`,
      { headers: hh }
    );
    expect(r.status).toBe(200);
    const b = (await r.json()) as { churches: { id: number }[] };
    expect(b.churches.length).toBeGreaterThanOrEqual(1);
  });

  it("returns district dashboard for pastor", async () => {
    const hh = { Authorization: `Bearer ${tokenPastor}` };
    const r = await SELF.fetch("http://localhost/api/conference/district-dashboard", {
      headers: hh,
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      district: { id: number; name: string };
      summary: { churchCount: number };
    };
    expect(b.district.name).toBe("South District");
    expect(b.summary.churchCount).toBeGreaterThanOrEqual(1);
  });

  it("returns global dashboard", async () => {
    const hh = { Authorization: `Bearer ${accessToken}` };
    const r = await SELF.fetch("http://localhost/api/conference/global-dashboard", {
      headers: hh,
    });
    expect(r.status).toBe(200);
    const b = (await r.json()) as {
      summary: { titheForwardedThisMonth: number; conferenceCount: number };
    };
    expect(b.summary.titheForwardedThisMonth).toBeGreaterThanOrEqual(1200);
    expect(b.summary.conferenceCount).toBeGreaterThanOrEqual(1);
  });

  it("rejects unauthenticated access", async () => {
    const r = await SELF.fetch("http://localhost/api/conference/dashboard");
    expect(r.status).toBe(401);
  });
});
