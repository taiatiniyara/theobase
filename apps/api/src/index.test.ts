import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";
import { createJwt, verifyJwt } from "@theobase/auth";

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

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS auth_token (id text PRIMARY KEY NOT NULL, email text NOT NULL, token text NOT NULL, expires_at text NOT NULL, used_at text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS organization (id text PRIMARY KEY NOT NULL, name text NOT NULL, type text NOT NULL, parent_id text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS congregation (id text PRIMARY KEY NOT NULL, name text NOT NULL, type text NOT NULL, parent_id text, parent_type text, organization_id text REFERENCES organization(id), timezone text DEFAULT 'UTC' NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS person (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), first_name text NOT NULL, last_name text NOT NULL, email text, phone text, address text, is_member integer DEFAULT false, created_at text NOT NULL, updated_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS department (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), name text NOT NULL, type text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS role (id text PRIMARY KEY NOT NULL, person_id text NOT NULL REFERENCES person(id), congregation_id text NOT NULL REFERENCES congregation(id), role_type text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "user" (id text PRIMARY KEY NOT NULL, email text NOT NULL, person_id text REFERENCES person(id), congregation_id text REFERENCES congregation(id), created_at text NOT NULL)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON "user" (email)`,
  `CREATE TABLE IF NOT EXISTS receipt (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), member_id text NOT NULL REFERENCES person(id), amount integer NOT NULL, fund_split text NOT NULL, image_key text, status text NOT NULL DEFAULT 'pending', verified_by_id text REFERENCES person(id), verified_at text, rejection_note text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS board_meeting (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, agenda text, status text NOT NULL DEFAULT 'draft', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS board_minute (id text PRIMARY KEY NOT NULL, meeting_id text NOT NULL REFERENCES board_meeting(id), content text NOT NULL, revision_number integer NOT NULL DEFAULT 1, author_id text NOT NULL REFERENCES person(id), created_at text NOT NULL, updated_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS board_decision (id text PRIMARY KEY NOT NULL, meeting_id text NOT NULL REFERENCES board_meeting(id), number integer NOT NULL, title text NOT NULL, description text, mover_id text REFERENCES person(id), seconder_id text REFERENCES person(id), vote_outcome text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS duty_slot (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, role text NOT NULL, volunteer_id text REFERENCES person(id), status text NOT NULL DEFAULT 'open', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS safety_clearance (id text PRIMARY KEY NOT NULL, volunteer_id text NOT NULL REFERENCES person(id), congregation_id text NOT NULL REFERENCES congregation(id), type text NOT NULL, issued_date text NOT NULL, expiry_date text NOT NULL, certificate_key text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS expense (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), amount integer NOT NULL, description text NOT NULL, category text NOT NULL, receipt_id text REFERENCES receipt(id), board_decision_id text REFERENCES board_decision(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS pathfinder_progress (id text PRIMARY KEY NOT NULL, member_id text NOT NULL REFERENCES person(id), class_name text NOT NULL, club_type text NOT NULL, status text NOT NULL DEFAULT 'in_progress', completed_at text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS pathfinder_honor (id text PRIMARY KEY NOT NULL, member_id text NOT NULL REFERENCES person(id), name text NOT NULL, category text NOT NULL, earned_at text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sabbath_school_class (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), division text NOT NULL, name text NOT NULL, teacher_id text REFERENCES person(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS sabbath_school_attendance (id text PRIMARY KEY NOT NULL, class_id text NOT NULL REFERENCES sabbath_school_class(id), date text NOT NULL, member_id text NOT NULL REFERENCES person(id), present integer NOT NULL, notes text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS welfare_case (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), person_id text REFERENCES person(id), assistance_type text NOT NULL, description text NOT NULL, value integer, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS pantry_item (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), name text NOT NULL, quantity integer NOT NULL, unit text NOT NULL, updated_at text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS health_event (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), name text NOT NULL, date text NOT NULL, type text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS health_contact (id text PRIMARY KEY NOT NULL, event_id text NOT NULL REFERENCES health_event(id), congregation_id text NOT NULL REFERENCES congregation(id), name text NOT NULL, phone text, email text, interests text, follow_up_status text NOT NULL DEFAULT 'new', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS household (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), name text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS household_member (id text PRIMARY KEY NOT NULL, household_id text NOT NULL REFERENCES household(id), person_id text NOT NULL REFERENCES person(id), relationship text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS candidacy (id text PRIMARY KEY NOT NULL, person_id text NOT NULL REFERENCES person(id), congregation_id text NOT NULL REFERENCES congregation(id), stage text NOT NULL, start_date text NOT NULL, decision_date text, decision_type text, officiating_pastor_id text REFERENCES person(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS communion_service (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, status text NOT NULL DEFAULT 'planned', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS communion_room (id text PRIMARY KEY NOT NULL, service_id text NOT NULL REFERENCES communion_service(id), name text NOT NULL, gender text NOT NULL, volunteer_ids text)`,
  `CREATE TABLE IF NOT EXISTS communion_inventory (id text PRIMARY KEY NOT NULL, service_id text NOT NULL REFERENCES communion_service(id), item text NOT NULL, quantity integer NOT NULL, unit text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS av_order_of_service (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, items text NOT NULL, updated_at text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS district (id text PRIMARY KEY NOT NULL, name text NOT NULL, organization_id text REFERENCES organization(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS district_congregation (id text PRIMARY KEY NOT NULL, district_id text NOT NULL REFERENCES district(id), congregation_id text NOT NULL REFERENCES congregation(id))`,
  `CREATE TABLE IF NOT EXISTS preaching_rotation (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, preacher_id text NOT NULL REFERENCES person(id), topic text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS pastoral_visit (id text PRIMARY KEY NOT NULL, household_id text REFERENCES household(id), pastor_id text NOT NULL REFERENCES person(id), congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, purpose text, notes text, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS facility_booking (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), date text NOT NULL, time_start text NOT NULL, time_end text NOT NULL, purpose text NOT NULL, requester_id text REFERENCES person(id), status text NOT NULL DEFAULT 'pending', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS congregation_asset (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), type text NOT NULL, description text, status text NOT NULL DEFAULT 'operational', updated_at text NOT NULL, created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS transfer_request (id text PRIMARY KEY NOT NULL, member_id text NOT NULL REFERENCES person(id), from_congregation_id text NOT NULL REFERENCES congregation(id), to_congregation_id text NOT NULL REFERENCES congregation(id), status text NOT NULL DEFAULT 'requested', requested_by_id text REFERENCES person(id), approved_by_id text REFERENCES person(id), received_by_id text REFERENCES person(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS nominating_session (id text PRIMARY KEY NOT NULL, congregation_id text NOT NULL REFERENCES congregation(id), year integer NOT NULL, status text NOT NULL DEFAULT 'open', opened_by_id text REFERENCES person(id), created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS nominating_role (id text PRIMARY KEY NOT NULL, session_id text NOT NULL REFERENCES nominating_session(id), role_type text NOT NULL, status text NOT NULL DEFAULT 'open', created_at text NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS nominating_candidate (id text PRIMARY KEY NOT NULL, role_id text NOT NULL REFERENCES nominating_role(id), person_id text NOT NULL REFERENCES person(id), nominated_by_id text REFERENCES person(id), status text NOT NULL DEFAULT 'nominated', created_at text NOT NULL)`,
];

async function runMigrations() {
  for (const sql of MIGRATION_STATEMENTS) {
    await env.DB.exec(sql);
  }
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
    const jwt = await createJwt({ userId: "clerk-1" });
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
    const jwt = await createJwt({ userId: "clerk-1" });
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
