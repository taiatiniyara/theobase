import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let clerkToken: string;
let memberId: string;

beforeAll(async () => {
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY, parentId TEXT REFERENCES orgs(id), name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('division','union','conference','church','company')),
      districtId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL, role TEXT NOT NULL, memberId TEXT, active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tokenHash TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id),
      firstName TEXT NOT NULL, lastName TEXT NOT NULL, email TEXT, phone TEXT, address TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','under-censure','transferred-out','transferred-in','disfellowshipped','apostasy','missing','renounced','deceased')),
      baptismDate TEXT, transferRequestId TEXT, householdId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();

  await env.DB.prepare(
    "INSERT OR IGNORE INTO orgs (id, name, level) VALUES (?, ?, ?)",
  )
    .bind("church-1", "Test Church", "church")
    .run();

  await SELF.fetch("https://theobase.test/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "clerk@test.example",
      password: "pass123",
      role: "clerk",
      orgId: "church-1",
    }),
  });

  const loginRes = await SELF.fetch("https://theobase.test/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clerk@test.example", password: "pass123" }),
  });
  clerkToken = (await loginRes.json()).accessToken;

  const createRes = await SELF.fetch(
    "https://theobase.test/api/v1/churches/church-1/members",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
      }),
    },
  );
  memberId = (await createRes.json()).member.id;
});

function auth() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${clerkToken}`,
  };
}

describe("Members API", () => {
  it("GET lists members", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.members.length).toBeGreaterThan(0);
  });

  it("GET filters by status", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members?status=active",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
  });

  it("GET searches by name", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members?search=Alice",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members.length).toBeGreaterThan(0);
  });

  it("GET returns member by id", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/members/${memberId}`,
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.id).toBe(memberId);
  });

  it("GET returns 404 for non-existent member", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members/nonexistent",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(404);
  });

  it("PATCH updates member fields", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/members/${memberId}`,
      {
        method: "PATCH",
        headers: auth(),
        body: JSON.stringify({ firstName: "Johnny", phone: "555-0100" }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.firstName).toBe("Johnny");
    expect(body.member.phone).toBe("555-0100");
  });

  it("PATCH rejects invalid status transition", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/members/${memberId}`,
      {
        method: "PATCH",
        headers: auth(),
        body: JSON.stringify({ status: "transferred-in" }),
      },
    );
    expect(res.status).toBe(400);
  });

  it("PATCH allows valid status transition", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/members/${memberId}`,
      {
        method: "PATCH",
        headers: auth(),
        body: JSON.stringify({ status: "under-censure" }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.status).toBe("under-censure");
  });

  it("returns 404 for member in another church", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/other-church/members/${memberId}`,
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(404);
  });

  it("POST creates a new member and returns 400 for missing fields", async () => {
    const good = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ firstName: "Jane", lastName: "Doe" }),
      },
    );
    expect(good.status).toBe(201);

    const bad = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ lastName: "NoFirst" }),
      },
    );
    expect(bad.status).toBe(400);
  });
});
