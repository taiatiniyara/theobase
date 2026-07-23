import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER, conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), date TEXT NOT NULL, count INTEGER NOT NULL, category TEXT NOT NULL CHECK (category IN ('sabbath-school', 'church-service', 'youth')), created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(church_id, date, category));`;

describe("attendance API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;");

    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attadmin@test.com",
        password: "password123",
        fullName: "Att Admin",
        conferenceName: "Att Conference",
      }),
    });
    const signupBody = (await signupRes.json()) as { accessToken: string };
    accessToken = signupBody.accessToken;

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
  });

  function authHeaders() {
    return { Authorization: `Bearer ${accessToken}` };
  }
  function jsonAuthHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
  }

  it("CRUD: record, upsert, list, filter, stats", async () => {
    // Record attendance
    const r1 = await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-01-04",
        count: 85,
        category: "sabbath-school",
      }),
    });
    expect(r1.status).toBe(201);
    const b1 = (await r1.json()) as { id: number; updated: boolean };
    expect(b1.id).toBeGreaterThan(0);
    expect(b1.updated).toBe(false);

    // Upsert same date + category
    const r2 = await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-01-04",
        count: 95,
        category: "sabbath-school",
      }),
    });
    expect(r2.status).toBe(200);
    const b2 = (await r2.json()) as { id: number; updated: boolean };
    expect(b2.updated).toBe(true);

    // Add more records
    await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-01-11",
        count: 120,
        category: "church-service",
      }),
    });
    await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-01-18",
        count: 45,
        category: "youth",
      }),
    });

    // List all
    const listRes = await SELF.fetch(`http://localhost/api/attendance?church_id=${churchId}`, {
      headers: authHeaders(),
    });
    const listBody = (await listRes.json()) as { attendance: unknown[] };
    expect(listBody.attendance.length).toBe(3);

    // Filter by date range
    const rangeRes = await SELF.fetch(
      `http://localhost/api/attendance?church_id=${churchId}&from=2026-01-11&to=2026-01-18`,
      { headers: authHeaders() }
    );
    const rangeBody = (await rangeRes.json()) as { attendance: unknown[] };
    expect(rangeBody.attendance.length).toBe(2);

    // Filter by category
    const catRes = await SELF.fetch(
      `http://localhost/api/attendance?church_id=${churchId}&category=sabbath-school`,
      { headers: authHeaders() }
    );
    const catBody = (await catRes.json()) as { attendance: unknown[] };
    expect(catBody.attendance.length).toBe(1);

    // Stats
    const statsRes = await SELF.fetch(
      `http://localhost/api/attendance/stats?church_id=${churchId}`,
      { headers: authHeaders() }
    );
    expect(statsRes.status).toBe(200);
    const statsBody = (await statsRes.json()) as {
      stats: {
        category: string;
        average: number | null;
        weeks: number;
        min: number | null;
        max: number | null;
      }[];
      trend: { date: string; count: number; category: string }[];
    };
    expect(statsBody.stats.length).toBe(3);
    const ss = statsBody.stats.find((s) => s.category === "sabbath-school");
    expect(ss).toBeDefined();
    if (ss) {
      expect(ss.average).toBeCloseTo(95, 0);
      expect(ss.weeks).toBe(1);
    }
    expect(statsBody.trend.length).toBe(3);
  });

  it("rejects invalid category", async () => {
    const res = await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-02-01",
        count: 50,
        category: "invalid-category",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects negative count", async () => {
    const res = await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        churchId,
        date: "2026-02-01",
        count: -5,
        category: "sabbath-school",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated access", async () => {
    const res = await SELF.fetch(`http://localhost/api/attendance?church_id=${churchId}`);
    expect(res.status).toBe(401);
  });

  it("rejects missing required fields", async () => {
    const res = await SELF.fetch("http://localhost/api/attendance", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ churchId }),
    });
    expect(res.status).toBe(400);
  });
});
