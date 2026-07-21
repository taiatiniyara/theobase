import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let treasurerToken: string;
let churchToken: string;
let txId: string;

beforeAll(async () => {
  const exec = async (sql: string) => env.DB.prepare(sql).run();
  await exec(
    `CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, parentId TEXT REFERENCES orgs(id), name TEXT NOT NULL, level TEXT NOT NULL CHECK(level IN ('division','union','conference','church','company')), districtId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, role TEXT NOT NULL, memberId TEXT, active INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, tokenHash TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), firstName TEXT NOT NULL, lastName TEXT NOT NULL, email TEXT, phone TEXT, address TEXT, status TEXT NOT NULL DEFAULT 'active', baptismDate TEXT, transferRequestId TEXT, householdId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, orgId TEXT NOT NULL REFERENCES orgs(id), fund TEXT NOT NULL CHECK(fund IN ('tithe','local-church-budget','conference-advance','world-budget','special-projects','building-fund','ingathering','investment-income','rental-income')), amount REAL NOT NULL, type TEXT NOT NULL CHECK(type IN ('receipt','disbursement')), description TEXT, donorId TEXT REFERENCES members(id), verified INTEGER NOT NULL DEFAULT 0, verifiedBy TEXT REFERENCES users(id), createdBy TEXT NOT NULL REFERENCES users(id), proxyFor TEXT REFERENCES members(id), createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );

  await env.DB.prepare(
    "INSERT OR IGNORE INTO orgs (id, name, level) VALUES (?, ?, ?)",
  )
    .bind("church-1", "Test Church", "church")
    .run();

  const register = (email: string, role: string) =>
    SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "pass123",
        role,
        orgId: "church-1",
      }),
    });
  const login = (email: string) =>
    SELF.fetch("https://theobase.test/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "pass123" }),
    });

  await register("treasurer@test.example", "treasurer");
  await register("clerk@test.example", "clerk");
  treasurerToken = (await (await login("treasurer@test.example")).json())
    .accessToken;
  churchToken = (await (await login("clerk@test.example")).json()).accessToken;

  const createRes = await SELF.fetch(
    "https://theobase.test/api/v1/churches/church-1/transactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${treasurerToken}`,
      },
      body: JSON.stringify({ fund: "tithe", amount: 100, type: "receipt" }),
    },
  );
  txId = (await createRes.json()).transaction.id;
});

function auth(token?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? treasurerToken}`,
  };
}

describe("Transactions API", () => {
  it("POST creates a disbursement", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          fund: "local-church-budget",
          amount: 50,
          type: "disbursement",
          description: "Utilities",
        }),
      },
    );
    expect(res.status).toBe(201);
  });

  it("POST rejects invalid fund", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          fund: "invalid-fund",
          amount: 10,
          type: "receipt",
        }),
      },
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects non-treasurer with 403 on verify", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/transactions/${txId}/verify`,
      {
        method: "POST",
        headers: auth(churchToken),
      },
    );
    expect(res.status).toBe(403);
  });

  it("POST verifies a transaction", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/transactions/${txId}/verify`,
      {
        method: "POST",
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transaction.verified).toBe(1);
  });

  it("GET lists transactions", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
  });

  it("GET filters by fund", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions?fund=tithe",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
  });

  it("GET stats returns fund breakdown", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions/stats",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats).toBeDefined();
  });

  it("GET returns 404 for non-existent transaction", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions/nonexistent",
      {
        headers: auth(),
      },
    );
    expect(res.status).toBe(404);
  });
});
