import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";
import { createJwt, verifyJwt } from "@theobase/auth";
import { applyMigrations, MIGRATION_STATEMENTS } from "@theobase/db";

const TEST_SECRET = "theobase-dev-secret-change-in-production";

function jwt(payload: { userId: string; congregationId?: string }, ttlSeconds?: number): Promise<string> {
  return createJwt(payload, TEST_SECRET, ttlSeconds);
}
function vjwt(token: string): Promise<{ userId: string; congregationId?: string } | null> {
  return verifyJwt(token, TEST_SECRET);
}

async function authenticate(email: string): Promise<{ cookie: string; userId: string }> {
  const ctx = createExecutionContext();

  const reqRes = await worker.fetch(
    new Request("http://localhost/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
    env,
    ctx
  );
  await waitOnExecutionContext(ctx);
  if (reqRes.status !== 200) throw new Error("Auth request failed");

  const emails = (globalThis as any).__testEmails;
  const tokenMatch = emails[emails.length - 1].html.match(/token=([a-f0-9]+)/);
  const token = tokenMatch![1];

  const verifyRes = await worker.fetch(
    new Request("http://localhost/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
    env,
    ctx
  );
  await waitOnExecutionContext(ctx);
  if (verifyRes.status !== 200) throw new Error("Auth verify failed");

  const cookieField = verifyRes.headers.get("Set-Cookie")!.split(";")[0];
  const body = await verifyRes.json();
  return { cookie: cookieField, userId: body.userId };
}

async function runMigrations() {
  await applyMigrations(env.DB, MIGRATION_STATEMENTS);
}

describe("auth", () => {
  beforeAll(async () => {
    (globalThis as any).__testEmails = [];
    await runMigrations();
  });

  it("POST /auth/request returns 400 for invalid email", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "notanemail" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(400);
  });

  it("POST /auth/request sends magic link for valid email", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "elder@example.com" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const emails = (globalThis as any).__testEmails;
    expect(emails).toBeDefined();
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails[emails.length - 1].to).toBe("elder@example.com");
    expect(emails[emails.length - 1].html).toContain("auth/verify?token=");
  });

  it("POST /auth/verify returns 401 for invalid token", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid-token" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(401);
  });

  it("POST /auth/verify returns JWT for valid token", async () => {
    const ctx = createExecutionContext();
    const email = "clerk@example.com";

    const reqRes = await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(reqRes.status).toBe(200);

    const emails = (globalThis as any).__testEmails;
    const lastEmail = emails[emails.length - 1];
    const tokenMatch = lastEmail.html.match(/token=([a-f0-9]+)/);
    expect(tokenMatch).not.toBeNull();
    const token = tokenMatch![1];

    const verifyRes = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(verifyRes.status).toBe(200);
    const cookies = verifyRes.headers.get("Set-Cookie");
    expect(cookies).toContain("token=");
    expect(cookies).toContain("HttpOnly");

    const body = await verifyRes.json();
    expect(body.ok).toBe(true);
    expect(body.userId).toBeDefined();
  });

  it("reusing a token returns 401", async () => {
    const ctx = createExecutionContext();
    const email = "deacon@example.com";

    const reqRes = await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(reqRes.status).toBe(200);

    const emails = (globalThis as any).__testEmails;
    const tokenMatch = emails[emails.length - 1].html.match(/token=([a-f0-9]+)/);
    const token = tokenMatch![1];

    const first = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(first.status).toBe(200);

    const second = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(second.status).toBe(401);
  });

  it("GET /me returns 401 without auth", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", { method: "GET" }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(401);
  });

  it("GET /me returns user info with valid JWT", async () => {
    const ctx = createExecutionContext();
    const email = "pastor@example.com";

    const reqRes = await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    const emails = (globalThis as any).__testEmails;
    const tokenMatch = emails[emails.length - 1].html.match(/token=([a-f0-9]+)/);
    const token = tokenMatch![1];

    const verifyRes = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    const cookie = verifyRes.headers.get("Set-Cookie")!;

    const meRes = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: cookie.split(";")[0] },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(meRes.status).toBe(200);
    const body = await meRes.json();
    expect(body.email).toBe(email.toLowerCase());
  });

  it("GET /me returns 401 with expired JWT", async () => {
    const expiredJwt = await jwt({ userId: "test-user" }, -1);
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${expiredJwt}` },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(401);
  });

  it("verifyJwt rejects expired tokens", async () => {
    const expiredJwt = await createJwt({ userId: "test-user" }, -1);
    const result = await verifyJwt(expiredJwt);
    expect(result).toBeNull();
  });
});

describe("member portal", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('church-1', 'Test Church', 'church', 'Pacific/Fiji', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, phone, address, is_member, created_at, updated_at) VALUES ('person-1', 'church-1', 'John', 'Elder', 'john@example.com', '+679 1234567', '123 Church St', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-1', 'john@example.com', 'person-1', 'church-1', '2025-01-01T00:00:00Z')`);
    (globalThis as any).__testEmails = [];
  });

  it("GET /me returns enriched profile when person record is linked", async () => {
    const jwt = await createJwt({ userId: "user-1", congregationId: "church-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("john@example.com");
    expect(body.firstName).toBe("John");
    expect(body.lastName).toBe("Elder");
    expect(body.phone).toBe("+679 1234567");
    expect(body.address).toBe("123 Church St");
    expect(body.isMember).toBe(true);
    expect(body.congregationId).toBe("church-1");
  });

  it("PATCH /me updates contact details", async () => {
    const jwt = await createJwt({ userId: "user-1", congregationId: "church-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({ phone: "+679 9876543", address: "456 New Rd" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.phone).toBe("+679 9876543");
    expect(body.address).toBe("456 New Rd");
  });

  it("PATCH /me rejects invalid phone format", async () => {
    const jwt = await createJwt({ userId: "user-1", congregationId: "church-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({ phone: "not-a-phone" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(400);
  });

  it("GET /me rejects access to a different congregation's data", async () => {
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('church-2', 'Other Church', 'church', 'Pacific/Auckland', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, created_at, updated_at) VALUES ('person-2', 'church-2', 'Jane', 'Stranger', 'jane@other.com', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);

    const jwt = await createJwt({ userId: "user-1", congregationId: "church-1" });
    const ctx = createExecutionContext();

    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.congregationId).toBe("church-1");
    expect(body.firstName).toBe("John");
  });
});

describe("congregation management", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Suva SDA Church', 'church', 'Pacific/Fiji', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-con1', 'con-1', 'Clerk', 'C1', 'clerk1@test.com', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk1-user', 'clerk1@test.com', 'clerk-con1', 'con-1', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk-1', 'clerk-con1', 'con-1', 'clerk', '2025-01-01T00:00:00Z')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /congregations creates a new congregation", async () => {
    const jwt = await createJwt({ userId: "clerk-1", congregationId: undefined } as any);
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({
          name: "Nadi SDA Church",
          type: "church",
          timezone: "Pacific/Fiji",
        }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe("Nadi SDA Church");
    expect(body.type).toBe("church");
    expect(body.timezone).toBe("Pacific/Fiji");
  });

  it("GET /congregations/:id returns details", async () => {
    const jwt = await createJwt({ userId: "clerk-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Suva SDA Church");
    expect(body.type).toBe("church");
  });

  it("PATCH /congregations/:id updates details", async () => {
    const jwt = await createJwt({ userId: "clerk1-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({ timezone: "Pacific/Auckland" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.timezone).toBe("Pacific/Auckland");
  });

  it("POST /congregations/:id/invite sends officer invitation with role", async () => {
    const jwt = await createJwt({ userId: "clerk1-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({ email: "treasurer@nadi.org", role: "treasurer" }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);

    const emails = (globalThis as any).__testEmails;
    const inviteEmail = emails[emails.length - 1];
    expect(inviteEmail.to).toBe("treasurer@nadi.org");
    expect(inviteEmail.html).toContain("treasurer");
    expect(inviteEmail.html).toContain("con-1");
  });
});

describe("receipt registry", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01T00:00:00Z')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-1', 'con-1', 'John', 'Member', 'john@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treasurer-1', 'con-1', 'Treas', 'Urer', 'treasurer@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('member-user-1', 'john@test.com', 'member-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('treasurer-user-1', 'treasurer@test.com', 'treasurer-1', 'con-1', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /receipts creates a receipt with valid fund split", async () => {
    const jwt = await createJwt({ userId: "member-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({
          amount: 10000,
          fundSplit: { tithe: 7000, church_budget: 2000, pathfinders: 1000 },
        }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.amount).toBe(10000);
    expect(body.fundSplit).toEqual({ tithe: 7000, church_budget: 2000, pathfinders: 1000 });
    expect(body.status).toBe("pending");
  });

  it("POST /receipts rejects fund split that doesn't match total", async () => {
    const jwt = await createJwt({ userId: "member-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({
          amount: 10000,
          fundSplit: { tithe: 5000, church_budget: 3000 },
        }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(400);
  });

  it("GET /receipts returns member's own receipts", async () => {
    const jwt = await createJwt({ userId: "member-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /receipts/:id/verify approves a receipt", async () => {
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'member-1', 5000, '{"tithe":3000,"church_budget":2000}', 'pending', '2025-01-01')`);

    const jwt = await createJwt({ userId: "treasurer-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts/rec-1/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${jwt}`,
        },
        body: JSON.stringify({ approved: true }),
      }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("approved");
    expect(body.verifiedById).toBe("treasurer-1");
  });
});

describe("boardroom", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user-1', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-1', 'con-1', '2025-06-21', 'in_progress', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_decision (id, meeting_id, number, title, description, vote_outcome, created_at) VALUES ('dec-1', 'meet-1', 1, 'Approve budget', 'Q3 budget', 'approved', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /board/meetings creates a meeting", async () => {
    const jwt = await createJwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/board/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ date: "2025-06-21", agenda: [{ title: "Treasurer Report" }, { title: "Baptismal Candidates" }] }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("draft");
    expect(body.agenda).toHaveLength(2);
  });

  it("GET /board/meetings lists meetings", async () => {
    const jwt = await createJwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/board/meetings", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /board/meetings/:id/decisions records a decision", async () => {
    const jwt = await createJwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/board/meetings/meet-1/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ title: "Approve budget", description: "Q3 budget approved", voteOutcome: "approved" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("Approve budget");
    expect(body.number).toBe(2);
    expect(body.voteOutcome).toBe("approved");
  });

  it("GET /board/meetings/:id returns meeting with decisions", async () => {
    const jwt = await createJwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/board/meetings/meet-1", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("meet-1");
    expect(body.decisions).toBeDefined();
    expect(body.decisions.length).toBeGreaterThanOrEqual(1);
    expect(body.decisions[0].title).toBe("Approve budget");
  });
});

describe("duty rota", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('elder-1', 'con-1', 'Elder', 'One', 'elder@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('elder-user-1', 'elder@test.com', 'elder-1', 'con-1', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /rota/slots creates a duty slot", async () => {
    const jwt = await createJwt({ userId: "elder-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/rota/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ date: "2025-06-21", role: "elder", volunteerId: "elder-1" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe("elder");
    expect(body.status).toBe("assigned");
  });

  it("GET /rota/:date returns slots for that date", async () => {
    const jwt = await createJwt({ userId: "elder-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/rota/2025-06-21", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("Safety shield blocks youth duty without clearance", async () => {
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('youth-vol-1', 'con-1', 'Youth', 'Volunteer', 'youth@test.com', 1, '2025-01-01', '2025-01-01')`);

    const jwt = await createJwt({ userId: "elder-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/rota/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ date: "2025-06-21", role: "youth_leader", volunteerId: "youth-vol-1" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(400);
  });
});

describe("treasury", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treas-1', 'con-1', 'Treas', 'Urer', 'treas@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('treas-user-1', 'treas@test.com', 'treas-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'treas-1', 10000, '{"tithe":7000,"church_budget":3000}', 'approved', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-1', 'con-1', '2025-06-21', 'completed', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_decision (id, meeting_id, number, title, description, vote_outcome, created_at) VALUES ('dec-1', 'meet-1', 1, 'Approve budget', 'Q3 budget', 'approved', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /treasury/expenses creates an expense linked to receipt and board decision", async () => {
    const jwt = await createJwt({ userId: "treas-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/treasury/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({
          amount: 3000,
          description: "Electricity bill",
          category: "church_budget",
          receiptId: "rec-1",
          boardDecisionId: "dec-1",
        }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.description).toBe("Electricity bill");
    expect(body.receiptId).toBe("rec-1");
    expect(body.boardDecisionId).toBe("dec-1");
  });

  it("GET /treasury/expenses lists expenses", async () => {
    const jwt = await createJwt({ userId: "treas-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/treasury/expenses", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /treasury/balance returns fund balances computed from verified receipts minus expenses", async () => {
    const jwt = await createJwt({ userId: "treas-user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/treasury/balance", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("church_budget");
    expect(body.church_budget).toBe(3000);
  });
});

describe("departments", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('pf-1', 'con-1', 'Path', 'Finder', 'pf@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('pf-user', 'pf@test.com', 'pf-1', 'con-1', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  async function jwt() { return createJwt({ userId: "pf-user", congregationId: "con-1" }); }

  it("POST /pathfinder/progress records class progress", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/pathfinder/progress", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ memberId: "pf-1", className: "friend", clubType: "pathfinders", status: "in_progress" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /pathfinder/honors records an honor", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/pathfinder/honors", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ memberId: "pf-1", name: "First Aid", category: "Health", earnedAt: "2025-06-01" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /sabbath-school/classes and GET them", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/sabbath-school/classes", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ division: "adult", name: "Adult Class A" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /welfare/cases creates a welfare case", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/welfare/cases", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ personId: "pf-1", assistanceType: "food", description: "Emergency food parcel", value: 50 }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /pantry/items adds a pantry item", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/pantry/items", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ name: "Rice", quantity: 100, unit: "kg" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Rice");
  });

  it("POST /health/events + contacts", async () => {
    const ctx = createExecutionContext();
    const ev = await worker.fetch(new Request("http://localhost/health/events", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ name: "Spring Health Expo", date: "2025-07-01", type: "health_expo" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(ev.status).toBe(201);
    const evBody = await ev.json();

    const res = await worker.fetch(new Request("http://localhost/health/contacts", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ eventId: evBody.id, name: "Jane Visitor", phone: "123", email: "jane@test.com", interests: ["diabetes"] }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /households creates a household", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/households", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ name: "The Pathfinder Family" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /candidacies starts a baptismal candidacy", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/candidacies", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ personId: "pf-1", stage: "interest", startDate: "2025-06-01" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.stage).toBe("interest");
  });
});

describe("communion + AV", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('deacon-1', 'con-1', 'Deacon', 'One', 'deacon@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('deacon-user', 'deacon@test.com', 'deacon-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO av_order_of_service (id, congregation_id, date, items, updated_at, created_at) VALUES ('av-1', 'con-1', '2025-06-21', '[{"type":"hymn","title":"Amazing Grace"},{"type":"scripture","title":"Psalm 23"}]', '2025-01-01', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  async function jwt() { return createJwt({ userId: "deacon-user", congregationId: "con-1" }); }

  it("POST /communion plans a communion service", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/communion", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ date: "2025-07-05", rooms: [{ name: "Men's Room", gender: "male", volunteerIds: ["deacon-1"] }], inventory: [{ item: "towel", quantity: 20, unit: "pieces" }] }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.rooms).toHaveLength(1);
    expect(body.inventory).toHaveLength(1);
  });

  it("POST /av/order-of-service updates the order", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/av/order-of-service", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ date: "2025-06-21", items: [{ type: "hymn", title: "Amazing Grace" }, { type: "scripture", title: "Psalm 23" }, { type: "prayer", title: "Opening Prayer" }] }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("GET /av/order-of-service/:date returns current order", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/av/order-of-service/2025-06-21", {
      method: "GET", headers: { Cookie: `token=${await jwt()}` },
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
  });
});

describe("coordination", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-2', 'Other Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('pastor-1', 'con-1', 'Pastor', 'One', 'pastor@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('pastor-user', 'pastor@test.com', 'pastor-1', 'con-1', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  async function jwt() { return createJwt({ userId: "pastor-user", congregationId: "con-1" }); }

  it("POST /district/rotations schedules preaching", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/district/rotations", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ congregationId: "con-1", date: "2025-07-12", preacherId: "pastor-1", topic: "Faith" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /facilities/bookings creates a booking", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/facilities/bookings", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ date: "2025-08-01", timeStart: "10:00", timeEnd: "14:00", purpose: "Wedding reception" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /crisis/assets registers an asset", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/crisis/assets", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ type: "generator", description: "Honda 5kW" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });

  it("POST /transfers initiates a transfer", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/transfers", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ memberId: "pastor-1", toCongregationId: "con-2" }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("requested");
  });

  it("POST /nominating/sessions opens a nominating session", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(new Request("http://localhost/nominating/sessions", {
      method: "POST", headers: { "Content-Type": "application/json", Cookie: `token=${await jwt()}` },
      body: JSON.stringify({ year: 2025 }),
    }), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.year).toBe(2025);
  });
});

describe("rls isolation", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-a', 'Church A', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-b', 'Church B', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-a', 'con-a', 'Alice', 'A', 'alice@a.org', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-b', 'con-b', 'Bob', 'B', 'bob@b.org', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-a', 'alice@a.org', 'member-a', 'con-a', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-b', 'bob@b.org', 'member-b', 'con-b', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-a', 'con-a', 'member-a', 5000, '{"tithe":5000}', 'approved', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-b', 'con-b', 'member-b', 9000, '{"church_budget":9000}', 'approved', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-a', 'con-a', '2025-06-01', 'completed', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-b', 'con-b', '2025-06-01', 'completed', '2025-01-01')`);
  });

  it("user from Church A cannot see Church B receipts", async () => {
    const jwtA = await createJwt({ userId: "user-a", congregationId: "con-a" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts", {
        method: "GET",
        headers: { Cookie: `token=${jwtA}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    const ids = body.map((r: any) => r.id);
    expect(ids).toContain("rec-a");
    expect(ids).not.toContain("rec-b");
  });

  it("user from Church A cannot see Church B board meetings", async () => {
    const jwtA = await createJwt({ userId: "user-a", congregationId: "con-a" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/board/meetings", {
        method: "GET",
        headers: { Cookie: `token=${jwtA}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    const ids = body.map((m: any) => m.id);
    expect(ids).toContain("meet-a");
    expect(ids).not.toContain("meet-b");
  });

  it("user without congregation gets empty results", async () => {
    const jwtNoCong = await createJwt({ userId: "user-a", congregationId: undefined });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/receipts", {
        method: "GET",
        headers: { Cookie: `token=${jwtNoCong}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("enhanced /me endpoint", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Grace SDA', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, phone, is_member, created_at, updated_at) VALUES ('person-1', 'con-1', 'Mary', 'Member', 'mary@grace.org', '+679 111222', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-1', 'mary@grace.org', 'person-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-1', 'person-1', 'con-1', 'elder', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-2', 'person-1', 'con-1', 'deaconess', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'person-1', 7000, '{"tithe":5000,"church_budget":2000}', 'approved', '2025-06-01')`);
    await env.DB.exec(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-2', 'con-1', 'person-1', 3000, '{"tithe":3000}', 'pending', '2025-06-15')`);
  });

  it("GET /me returns giving summary", async () => {
    const jwt = await createJwt({ userId: "user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("mary@grace.org");
    expect(body.giving).toBeDefined();
    expect(body.giving.totalReceipts).toBe(2);
    expect(body.giving.approvedCount).toBe(1);
    expect(body.giving.pendingCount).toBe(1);
    expect(body.giving.totalAmount).toBe(10000);
  });

  it("GET /me returns ministry roles", async () => {
    const jwt = await createJwt({ userId: "user-1", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${jwt}` },
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.roles).toBeDefined();
    expect(body.roles).toHaveLength(2);
    expect(body.roles).toContain("elder");
    expect(body.roles).toContain("deaconess");
  });
});

describe("csv member import", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
  });

  it("POST /congregations/:id/members/import creates persons from CSV", async () => {
    const jwt = await createJwt({ userId: "clerk-user", congregationId: "con-1" });
    const csv = "firstName,lastName,email,phone,isMember\nAlice,Smith,alice@test.com,+679 111,true\nBob,Jones,bob@test.com,+679 222,false";
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ csv }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.imported).toBe(2);
    expect(body.errors).toHaveLength(0);
    expect(body.personIds).toHaveLength(2);
  });

  it("POST /congregations/:id/members/import returns validation errors", async () => {
    const jwt = await createJwt({ userId: "clerk-user", congregationId: "con-1" });
    const csv = "firstName,lastName,email,phone,isMember\n,Smith,bademail,+679 111,true";
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1/members/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ csv }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});

describe("officer invitation flow", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
    (globalThis as any).__testEmails = [];
  });

  it("POST /congregations/:id/invite creates pending role and sends email", async () => {
    const jwt = await createJwt({ userId: "clerk-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ email: "treasurer@test.com", role: "treasurer" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verify role was created as pending
    const roles = await env.DB.prepare("SELECT * FROM role WHERE congregation_id = 'con-1'").all();
    const pendingRole = roles.results.find((r: any) => r.role_type === "treasurer");
    expect(pendingRole).toBeDefined();

    // Verify email was sent with invite token
    const emails = (globalThis as any).__testEmails;
    const inviteEmail = emails[emails.length - 1];
    expect(inviteEmail.to).toBe("treasurer@test.com");
    expect(inviteEmail.html).toContain("treasurer");
  });

  it("invited officer logging in gets role assigned to their person record", async () => {
    // First create an invite with a role
    const jwtClerk = await createJwt({ userId: "clerk-user", congregationId: "con-1" });
    const ctx = createExecutionContext();

    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treas-1', 'con-1', 'Treas', 'Urer', 'treasurer@test.com', 1, '2025-01-01', '2025-01-01')`);

    // Clerk invites treasurer
    await worker.fetch(
      new Request("http://localhost/congregations/con-1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwtClerk}` },
        body: JSON.stringify({ email: "treasurer@test.com", role: "treasurer" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    // Treasurer requests magic link and verifies
    await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "treasurer@test.com" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);

    const emails = (globalThis as any).__testEmails;
    const tokenMatch = emails[emails.length - 1].html.match(/token=([a-f0-9]+)/);
    const token = tokenMatch![1];

    const verifyRes = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(verifyRes.status).toBe(200);

    // Verify role is now assigned to the person
    const roles = await env.DB.prepare("SELECT * FROM role WHERE congregation_id = 'con-1' AND role_type = 'treasurer'").all();
    const assignedRole = roles.results.find((r: any) => r.person_id === "treas-1");
    expect(assignedRole).toBeDefined();
  });
});

describe("role-based permissions", () => {
  beforeAll(async () => {
    for (const sql of MIGRATION_STATEMENTS) {
      await env.DB.exec(sql);
    }
    await env.DB.exec(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-1', 'con-1', 'Member', 'One', 'member@test.com', 1, '2025-01-01', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('member-user', 'member@test.com', 'member-1', 'con-1', '2025-01-01')`);
    await env.DB.exec(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
  });

  it("non-clerk cannot modify congregation details", async () => {
    const jwt = await createJwt({ userId: "member-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ name: "Hacked Name" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(403);
  });

  it("clerk can modify congregation details", async () => {
    const jwt = await createJwt({ userId: "clerk-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/congregations/con-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwt}` },
        body: JSON.stringify({ timezone: "Pacific/Auckland" }),
      }),
      env, ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
  });
});
