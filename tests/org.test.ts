import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let adminToken: string;

beforeAll(async () => {
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS orgs (
      id TEXT PRIMARY KEY,
      parentId TEXT REFERENCES orgs(id),
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('division','union','conference','church','company')),
      districtId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      orgId TEXT NOT NULL REFERENCES orgs(id),
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      memberId TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();
  await env.DB.prepare(
    `
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tokenHash TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `,
  ).run();

  await env.DB.prepare(
    "INSERT OR IGNORE INTO orgs (id, name, level) VALUES (?, ?, ?)",
  )
    .bind("admin-org", "Admin Org", "division")
    .run();

  await SELF.fetch("https://theobase.test/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@test.example",
      password: "adminpass123",
      role: "system-admin",
      orgId: "admin-org",
    }),
  });

  const loginRes = await SELF.fetch("https://theobase.test/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@test.example",
      password: "adminpass123",
    }),
  });
  const loginBody = await loginRes.json();
  adminToken = loginBody.accessToken;
});

function authHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
    ...extra,
  };
}

describe("GET /api/v1/orgs", () => {
  it("lists orgs when authenticated", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/orgs", {
      headers: authHeaders(),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.orgs)).toBe(true);
    expect(body.orgs.length).toBeGreaterThan(0);
  });

  it("returns 401 without auth", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/orgs");

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/orgs", () => {
  it("creates a new org", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/orgs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        name: "Test Conference",
        level: "conference",
        parentId: "admin-org",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.org.name).toBe("Test Conference");
    expect(body.org.level).toBe("conference");
    expect(body.org.parentId).toBe("admin-org");
  });

  it("returns 400 for invalid level", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/orgs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ name: "Bad Org", level: "invalid" }),
    });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing name", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/orgs", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ level: "church" }),
    });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/orgs/:id", () => {
  it("returns org by id", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/orgs/admin-org",
      {
        headers: authHeaders(),
      },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.org.id).toBe("admin-org");
    expect(body.org.name).toBe("Admin Org");
  });

  it("returns 404 for non-existent org", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/orgs/nonexistent",
      {
        headers: authHeaders(),
      },
    );

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v1/orgs/:id", () => {
  it("updates an org name", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/orgs/admin-org",
      {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name: "Updated Admin Org" }),
      },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.org.name).toBe("Updated Admin Org");
  });
});
