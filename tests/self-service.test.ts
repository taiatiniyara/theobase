import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

let memberToken: string;
let memberId: string;
let treasurerToken: string;

beforeAll(async () => {
  const exec = (sql: string, ...params: unknown[]) =>
    env.DB.prepare(sql)
      .bind(...params)
      .run();
  await exec(
    `CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, parentId TEXT, name TEXT NOT NULL, level TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, orgId TEXT NOT NULL, email TEXT UNIQUE NOT NULL, passwordHash TEXT NOT NULL, role TEXT NOT NULL, memberId TEXT, active INTEGER NOT NULL DEFAULT 1, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (id TEXT PRIMARY KEY, userId TEXT NOT NULL, tokenHash TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, orgId TEXT NOT NULL, firstName TEXT NOT NULL, lastName TEXT NOT NULL, email TEXT, phone TEXT, address TEXT, status TEXT NOT NULL DEFAULT 'active', baptismDate TEXT, transferRequestId TEXT, householdId TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );
  await exec(
    `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, orgId TEXT NOT NULL, fund TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, description TEXT, donorId TEXT, verified INTEGER NOT NULL DEFAULT 0, verifiedBy TEXT, createdBy TEXT NOT NULL, proxyFor TEXT, createdAt TEXT NOT NULL DEFAULT (datetime('now')), updatedAt TEXT NOT NULL DEFAULT (datetime('now')))`,
  );

  await env.DB.prepare(
    "INSERT OR IGNORE INTO orgs (id, name, level) VALUES (?, ?, ?)",
  )
    .bind("church-1", "Test Church", "church")
    .run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO orgs (id, name, level) VALUES (?, ?, ?)",
  )
    .bind("church-2", "Other Church", "church")
    .run();

  memberId = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT OR REPLACE INTO members (id, orgId, firstName, lastName, email) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(memberId, "church-1", "Alice", "Smith", "alice@test.example")
    .run();

  const register = (
    email: string,
    password: string,
    role: string,
    _mid: string | null,
  ) =>
    SELF.fetch("https://theobase.test/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, orgId: "church-1" }),
    });
  const login = (email: string, password: string) =>
    SELF.fetch("https://theobase.test/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

  await register("member@test.example", "pass123", "member", memberId);
  await register("treasurer@test.example", "pass123", "treasurer", null);
  await env.DB.prepare("UPDATE users SET memberId = ? WHERE email = ?")
    .bind(memberId, "member@test.example")
    .run();

  memberToken = (await (await login("member@test.example", "pass123")).json())
    .accessToken;
  treasurerToken = (
    await (await login("treasurer@test.example", "pass123")).json()
  ).accessToken;
});

function auth(token?: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? memberToken}`,
  };
}

describe("Member Self-Service", () => {
  it("GET /members/me returns own profile", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members/me",
      { headers: auth() },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.firstName).toBe("Alice");
  });

  it("PATCH /members/me updates own profile", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/members/me",
      {
        method: "PATCH",
        headers: auth(),
        body: JSON.stringify({ phone: "555-1234" }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.phone).toBe("555-1234");
  });

  it("POST /giving submits giving declaration", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/giving",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ fund: "tithe", amount: 50 }),
      },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.transaction.verified).toBe(0);
    expect(body.transaction.donorId).toBe(memberId);
  });

  it("POST /giving with proxy creates transaction for other member", async () => {
    const otherId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO members (id, orgId, firstName, lastName) VALUES (?, ?, ?, ?)",
    )
      .bind(otherId, "church-1", "Bob", "Jones")
      .run();

    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/giving",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          fund: "local-church-budget",
          amount: 25,
          proxyFor: otherId,
        }),
      },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.transaction.proxyFor).toBe(otherId);
  });

  it("POST /giving proxy for member in other church returns 404", async () => {
    const otherChId = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO members (id, orgId, firstName, lastName) VALUES (?, ?, ?, ?)",
    )
      .bind(otherChId, "church-2", "Other", "Member")
      .run();

    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/giving",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({
          fund: "tithe",
          amount: 10,
          proxyFor: otherChId,
        }),
      },
    );
    expect(res.status).toBe(404);
  });

  it("POST /transfer-request changes status to transferred-out", async () => {
    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/members/${memberId}/transfer-request`,
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ targetChurchId: "church-2" }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.status).toBe("transferred-out");
  });

  it("POST /roll-confirm confirms multiple members", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/roll-confirm",
      {
        method: "POST",
        headers: auth(),
        body: JSON.stringify({ memberIds: [memberId] }),
      },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.confirmed).toBe(1);
  });
});

describe("Treasurer Verification", () => {
  it("GET /transactions?verified=false shows unverified", async () => {
    const res = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions?verified=false",
      { headers: auth(treasurerToken) },
    );
    expect(res.status).toBe(200);
  });

  it("non-treasurer cannot verify", async () => {
    const listRes = await SELF.fetch(
      "https://theobase.test/api/v1/churches/church-1/transactions",
      { headers: auth(treasurerToken) },
    );
    const txs = (await listRes.json()).transactions;
    const txId = txs.find((t: { verified: number }) => t.verified === 0)?.id;

    const res = await SELF.fetch(
      `https://theobase.test/api/v1/churches/church-1/transactions/${txId}/verify`,
      {
        method: "POST",
        headers: auth(),
      },
    );
    expect(res.status).toBe(403);
  });
});
