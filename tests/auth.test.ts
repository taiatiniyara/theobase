import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

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
    .bind("church-1", "Test Church", "church")
    .run();

  await SELF.fetch("https://theobase.test/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "login-test@church.example",
      password: "loginpass123",
      role: "clerk",
      orgId: "church-1",
    }),
  });
});

describe("POST /api/v1/auth/register", () => {
  it("registers a new user and returns 201", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "clerk@church.example",
        password: "securepass123",
        role: "clerk",
        orgId: "church-1",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("clerk@church.example");
    expect(body.user.role).toBe("clerk");
    expect(body.user.orgId).toBe("church-1");
    expect(body.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    const body = JSON.stringify({
      email: "clerk@church.example",
      password: "securepass123",
      role: "clerk",
      orgId: "church-1",
    });

    await SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const res = await SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    expect(res.status).toBe(409);
  });

  it("rejects missing required fields with 400", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad@test.example" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns tokens and user on valid credentials", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "login-test@church.example",
        password: "loginpass123",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe("login-test@church.example");
  });

  it("returns 401 for wrong password", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "login-test@church.example",
        password: "wrongpassword",
      }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 401 for non-existent email", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@nowhere.example",
        password: "whatever",
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("returns new tokens with valid refresh token", async () => {
    const loginRes = await SELF.fetch(
      "https://theobase.test/api/v1/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "login-test@church.example",
          password: "loginpass123",
        }),
      },
    );
    const loginBody = await loginRes.json();

    const res = await SELF.fetch("https://theobase.test/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
    });

    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
  });

  it("returns 401 for bogus refresh token", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "bogus:invalid-token" }),
    });

    expect(res.status).toBe(401);
  });
});
