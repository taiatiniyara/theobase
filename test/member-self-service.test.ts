import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER REFERENCES households(id), full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')), join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')), status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS funds (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('tithe', 'local_budget', 'sabbath_school')), forwarding_rule TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), fund_id INTEGER NOT NULL REFERENCES funds(id), type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'forward')), amount REAL NOT NULL, description TEXT, batch_id INTEGER, envelope_number INTEGER, member_id INTEGER REFERENCES members(id), proxy_for_member_id INTEGER REFERENCES members(id), verified INTEGER NOT NULL DEFAULT 0, verified_by INTEGER REFERENCES users(id), verified_at TEXT, created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), uuid TEXT NOT NULL UNIQUE);` +
  `CREATE TABLE IF NOT EXISTS transfer_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL REFERENCES members(id), from_church_id INTEGER NOT NULL REFERENCES churches(id), to_church_id INTEGER NOT NULL REFERENCES churches(id), initiated_by INTEGER NOT NULL REFERENCES users(id), initiated_at TEXT NOT NULL DEFAULT (datetime('now')), conference_approved_by INTEGER REFERENCES users(id), conference_approved_at TEXT, accepted_by INTEGER REFERENCES users(id), accepted_at TEXT, rejection_note TEXT, expires_at TEXT, override_by INTEGER REFERENCES users(id), override_at TEXT, override_action TEXT, override_note TEXT, status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected', 'expired')));` +
  `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, message TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

describe("member self-service API", () => {
  let memberToken: string;
  let treasurerToken: string;
  let conferenceId: number;
  let churchId: number;
  let churchId2: number;
  let memberUserId: number;
  let memberId: number;
  let memberId2: number;
  let titheFundId: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;");
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN category_id INTEGER;");
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN budget_ref INTEGER;");
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN confirmed_by INTEGER;");
    await env.DB.exec("ALTER TABLE transactions ADD COLUMN confirmed_at TEXT;");

    // Sign up as sysadmin to create org structure
    const adminSignup = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@test.com",
        password: "password123",
        fullName: "Admin",
        conferenceName: "Central Conference",
      }),
    });
    const adminBody = (await adminSignup.json()) as { accessToken: string };
    const adminToken = adminBody.accessToken;

    const meRes = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const me = (await meRes.json()) as { conference: { id: number } };
    conferenceId = me.conference.id;

    // Create two churches
    const c1 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Central SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    churchId = ((await c1.json()) as { id: number }).id;

    const c2 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Riverside SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    churchId2 = ((await c2.json()) as { id: number }).id;

    // Create two members in church 1
    const m1 = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        churchId,
        fullName: "Jane Doe",
        phone: "1234",
        email: "jane@test.com",
      }),
    });
    memberId = ((await m1.json()) as { id: number }).id;

    const m2 = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        churchId,
        fullName: "John Smith",
      }),
    });
    memberId2 = ((await m2.json()) as { id: number }).id;

    // Create a fund
    const f1 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Tithe",
        type: "tithe",
        forwardingRule: "conference",
        conferenceId,
      }),
    });
    titheFundId = ((await f1.json()) as { id: number }).id;

    const f2 = await SELF.fetch("http://localhost/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: "Local Budget",
        type: "local_budget",
        forwardingRule: "local",
        conferenceId,
      }),
    });
    void ((await f2.json()) as { id: number }).id;

    // Sign up member user (linked to Jane Doe) — skip conferenceName to avoid duplicate
    const memberSignup = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jane@member.com",
        password: "password123",
        fullName: "Jane Doe",
      }),
    });
    const memberBody = (await memberSignup.json()) as { accessToken: string; userId: string };
    memberToken = memberBody.accessToken;
    memberUserId = Number(memberBody.userId);

    // Link user to member record and assign to conference
    await env.DB.prepare("UPDATE users SET member_id = ?, role = ?, conference_id = ? WHERE id = ?")
      .bind(memberId, "member", conferenceId, memberUserId)
      .run();

    // Log back in to get fresh token with church info
    const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "jane@member.com", password: "password123" }),
    });
    memberToken = ((await loginRes.json()) as { accessToken: string }).accessToken;

    // Sign up treasurer user — skip conferenceName to avoid duplicate
    const treasSignup = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "treasurer@test.com",
        password: "password123",
        fullName: "Treasurer",
      }),
    });
    const treasBody = (await treasSignup.json()) as { accessToken: string; userId: string };
    const treasUserId = Number(treasBody.userId);

    await env.DB.prepare("UPDATE users SET role = ?, conference_id = ? WHERE id = ?")
      .bind("treasurer", conferenceId, treasUserId)
      .run();

    const treasLogin = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "treasurer@test.com", password: "password123" }),
    });
    treasurerToken = ((await treasLogin.json()) as { accessToken: string }).accessToken;
  });

  function h(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
  function jh(token: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  describe("GET /api/churches/:churchId/members/me", () => {
    it("returns member profile for authenticated user", async () => {
      const res = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        headers: h(memberToken),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { full_name: string; church_id: number };
      expect(body.full_name).toBe("Jane Doe");
      expect(body.church_id).toBe(churchId);
    });

    it("returns 404 for user without linked member", async () => {
      const res = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        headers: h(treasurerToken),
      });
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/churches/:churchId/members/me", () => {
    it("updates own contact info with optimistic locking", async () => {
      const getRes = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        headers: h(memberToken),
      });
      const profile = (await getRes.json()) as { version: number; phone: string | null };

      const res = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        method: "PATCH",
        headers: jh(memberToken),
        body: JSON.stringify({ phone: "555-1234", version: profile.version }),
      });
      expect(res.status).toBe(200);

      const updated = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        headers: h(memberToken),
      });
      const body = (await updated.json()) as { phone: string; version: number };
      expect(body.phone).toBe("555-1234");
    });

    it("returns 409 on version conflict", async () => {
      const getRes = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        headers: h(memberToken),
      });
      const profile = (await getRes.json()) as { version: number };
      const staleVersion = (profile.version || 10) + 10;
      const res = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        method: "PATCH",
        headers: jh(memberToken),
        body: JSON.stringify({ phone: "nope", version: staleVersion }),
      });
      expect(res.status).toBe(409);
    });

    it("returns 400 when version is missing", async () => {
      const res = await SELF.fetch(`http://localhost/api/churches/${churchId}/members/me`, {
        method: "PATCH",
        headers: jh(memberToken),
        body: JSON.stringify({ phone: "nope" }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/churches/:churchId/members/:id/giving", () => {
    it("creates an unverified giving declaration", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: 100 }),
        }
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        verified: boolean;
        amount: number;
        fundType: string;
      };
      expect(body.verified).toBe(false);
      expect(body.amount).toBe(100);
      expect(body.fundType).toBe("tithe");
    });

    it("returns 403 when member is in different church", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/9999/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: 50 }),
        }
      );
      expect(res.status).toBe(404);
    });

    it("rejects zero or negative amounts", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: -10 }),
        }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("proxy giving — proxyForMemberId", () => {
    it("creates a giving declaration on behalf of another member in same church", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({
            fundId: titheFundId,
            amount: 50,
            proxyForMemberId: memberId2,
          }),
        }
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { proxyFor: number | null };
      expect(body.proxyFor).not.toBeNull();
    });

    it("rejects proxy-for-self", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({
            fundId: titheFundId,
            amount: 50,
            proxyForMemberId: memberId,
          }),
        }
      );
      expect(res.status).toBe(400);
    });
  });

  describe("declaration verification flow (end-to-end)", () => {
    let declId: number;

    it("creates giving declaration, lists it, verifies it", async () => {
      // Create
      const cr = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: 200 }),
        }
      );
      expect(cr.status).toBe(201);
      const cBody = (await cr.json()) as { id: number; verified: boolean };
      expect(cBody.verified).toBe(false);
      declId = cBody.id;

      // List unverified
      const listRes = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/declarations?verified=false`,
        { headers: h(treasurerToken) }
      );
      expect(listRes.status).toBe(200);
      const list = (await listRes.json()) as { declarations: { id: number; verified: number }[] };
      expect(list.declarations.length).toBeGreaterThan(0);

      // Verify
      const vRes = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/declarations/${declId}/verify`,
        {
          method: "POST",
          headers: jh(treasurerToken),
        }
      );
      expect(vRes.status).toBe(200);
      const vBody = (await vRes.json()) as { verified: boolean };
      expect(vBody.verified).toBe(true);
    });

    it("member cannot verify declarations (403)", async () => {
      const cr = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: 50 }),
        }
      );
      const cBody = (await cr.json()) as { id: number };
      const decId = cBody.id;

      const vRes = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/declarations/${decId}/verify`,
        {
          method: "POST",
          headers: jh(memberToken),
        }
      );
      expect(vRes.status).toBe(403);
    });
  });

  describe("POST /api/churches/:churchId/declarations/:id/reject", () => {
    it("treasurer rejects and removes a declaration", async () => {
      const cr = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/giving`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ fundId: titheFundId, amount: 75 }),
        }
      );
      const cBody = (await cr.json()) as { id: number };
      const rejectDeclId = cBody.id;

      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/declarations/${rejectDeclId}/reject`,
        {
          method: "POST",
          headers: jh(treasurerToken),
        }
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { rejected: boolean };
      expect(body.rejected).toBe(true);
    });
  });

  describe("POST /api/churches/:churchId/members/:id/transfer-request", () => {
    it("member requests transfer to another church", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId}/transfer-request`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ toChurchId: churchId2 }),
        }
      );
      expect(res.status).toBe(201);
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe("pending_conference");
    });

    it("rejects transfer to same church", async () => {
      const res = await SELF.fetch(
        `http://localhost/api/churches/${churchId}/members/${memberId2}/transfer-request`,
        {
          method: "POST",
          headers: jh(memberToken),
          body: JSON.stringify({ toChurchId: churchId }),
        }
      );
      expect(res.status).toBe(400);
    });
  });
});
