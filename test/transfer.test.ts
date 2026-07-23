import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER REFERENCES households(id), full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')), join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')), status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, module TEXT NOT NULL DEFAULT 'core');` +
  `CREATE TABLE IF NOT EXISTS member_positions (member_id INTEGER NOT NULL REFERENCES members(id), position_id INTEGER NOT NULL REFERENCES positions(id), start_date TEXT NOT NULL DEFAULT (datetime('now')), end_date TEXT, PRIMARY KEY (member_id, position_id));` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

describe("transfer workflow API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId1: number;
  let churchId2: number;
  let memberId: number;

  beforeAll(async () => {
    // Drop transfer_requests first to ensure fresh schema with new columns
    await env.DB.exec("DROP TABLE IF EXISTS transfer_requests");
    await env.DB.exec(FULL_SCHEMA);

    // Recreate transfer_requests with new columns
    await env.DB.exec(
      `CREATE TABLE IF NOT EXISTS transfer_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL REFERENCES members(id), from_church_id INTEGER NOT NULL REFERENCES churches(id), to_church_id INTEGER NOT NULL REFERENCES churches(id), initiated_by INTEGER NOT NULL REFERENCES users(id), initiated_at TEXT NOT NULL DEFAULT (datetime('now')), conference_approved_by INTEGER REFERENCES users(id), conference_approved_at TEXT, accepted_by INTEGER REFERENCES users(id), accepted_at TEXT, rejection_note TEXT, expires_at TEXT, override_by INTEGER REFERENCES users(id), override_at TEXT, override_action TEXT, override_note TEXT, status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected', 'expired')));`
    );

    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, message TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));"
    );
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT NOT NULL DEFAULT (datetime('now')), actor_id INTEGER REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, prev_state TEXT, new_state TEXT, module TEXT NOT NULL DEFAULT 'core', device_info TEXT);"
    );

    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");
    try {
      await env.DB.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;");
    } catch {
      /* already exists */
    }

    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "tfadmin@test.com",
        password: "password123",
        fullName: "TF Admin",
        conferenceName: "Transfer Conference",
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
        name: "Source SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const c1Body = (await c1.json()) as { id: number };
    churchId1 = c1Body.id;

    const c2 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Destination SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const c2Body = (await c2.json()) as { id: number };
    churchId2 = c2Body.id;

    const m = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ churchId: churchId1, fullName: "Transfer Test Member" }),
    });
    const mBody = (await m.json()) as { id: number };
    memberId = mBody.id;
  });

  function authHeaders() {
    return { Authorization: `Bearer ${accessToken}` };
  }
  function jsonAuthHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
  }

  async function createMember(name: string) {
    const res = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ churchId: churchId1, fullName: name }),
    });
    return ((await res.json()) as { id: number }).id;
  }

  async function setupSecretary(): Promise<string> {
    // Create a secretary user via signup in the same conference
    const email = `sec_${Date.now()}@test.com`;
    // Create via SQL since signup requires new conference
    const { hashPassword } = await import("../worker/lib/auth");
    const hash = await hashPassword("secretary123");
    const result = await env.DB.prepare(
      `INSERT INTO users (email, password_hash, role, conference_id, active)
         VALUES (?, ?, 'secretary', ?, 1) RETURNING id`
    )
      .bind(email, hash, conferenceId)
      .first<{ id: number }>();

    if (!result?.id) throw new Error("Failed to create secretary");

    const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "secretary123" }),
    });
    if (loginRes.status !== 200) {
      const errText = await loginRes.text();
      throw new Error(`Secretary login failed: ${loginRes.status} ${errText}`);
    }
    const loginBody = (await loginRes.json()) as { accessToken: string };
    return loginBody.accessToken;
  }

  it("initiates a transfer and sets expires_at", async () => {
    const res = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId, toChurchId: churchId2 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; status: string };
    expect(body.status).toBe("pending_conference");
    expect(body.id).toBeGreaterThan(0);

    const dbTransfer = await env.DB.prepare(
      "SELECT status, expires_at FROM transfer_requests WHERE id = ?"
    )
      .bind(body.id)
      .first<{ status: string; expires_at: string | null }>();
    expect(dbTransfer?.status).toBe("pending_conference");
    expect(dbTransfer?.expires_at).toBeTruthy();
  });

  it("prevents transfer for a member not in active state", async () => {
    const testMemberId = await createMember("Block Test Member");

    // Initiate first transfer
    const res1 = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: testMemberId, toChurchId: churchId2 }),
    });
    expect(res1.status).toBe(201);

    // Try second transfer - member should be 'transferred' now
    const res2 = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: testMemberId, toChurchId: churchId2 }),
    });
    expect(res2.status).toBe(400);
    const errBody = (await res2.json()) as { error: string };
    expect(errBody.error).toContain("active");
  });

  it("lists transfers", async () => {
    // Create a transfer via API, then verify it appears in the list
    const mId = await createMember("List Test Member");
    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: mId, toChurchId: churchId2 }),
    });
    expect(initRes.status).toBe(201);

    const res = await SELF.fetch("http://localhost/api/transfers", {
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { transfers: unknown[] };
    expect(body.transfers.length).toBeGreaterThan(0);
  });

  it("approves a pending transfer", async () => {
    // Create a fresh transfer to approve
    const mId = await createMember("Approve Test Member");
    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: mId, toChurchId: churchId2 }),
    });
    expect(initRes.status).toBe(201);
    const init = (await initRes.json()) as { id: number; status: string };
    expect(init.status).toBe("pending_conference");

    const res = await SELF.fetch(`http://localhost/api/transfers/${init.id}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; status: string };
    expect(body.success).toBe(true);
    expect(body.status).toBe("pending_destination");
  });

  it("rejects a transfer and reverts member to active", async () => {
    const memberId2 = await createMember("Reject Test Member");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId2, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    await SELF.fetch(`http://localhost/api/transfers/${init.id}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });

    const rejectRes = await SELF.fetch(`http://localhost/api/transfers/${init.id}/reject`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ note: "Not accepting this member" }),
    });
    expect(rejectRes.status).toBe(200);
    const rejectBody = (await rejectRes.json()) as { success: boolean; status: string };
    expect(rejectBody.success).toBe(true);
    expect(rejectBody.status).toBe("rejected");

    const mCheck = await env.DB.prepare("SELECT status FROM members WHERE id = ?")
      .bind(memberId2)
      .first<{ status: string }>();
    expect(mCheck?.status).toBe("active");
  });

  it("accepts a transfer and moves member to destination church", async () => {
    const memberId3 = await createMember("Accept Test Member");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId3, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    await SELF.fetch(`http://localhost/api/transfers/${init.id}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });

    const acceptRes = await SELF.fetch(`http://localhost/api/transfers/${init.id}/accept`, {
      method: "POST",
      headers: authHeaders(),
    });
    expect(acceptRes.status).toBe(200);
    const acceptBody = (await acceptRes.json()) as { success: boolean; status: string };
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.status).toBe("completed");

    const mCheck = await env.DB.prepare("SELECT church_id, status FROM members WHERE id = ?")
      .bind(memberId3)
      .first<{ church_id: number; status: string }>();
    expect(mCheck?.status).toBe("active");
    expect(mCheck?.church_id).toBe(churchId2);
  });

  it("conference override requires secretary or president role", async () => {
    const memberId4 = await createMember("Override Auth Test");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId4, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    // Non-secretary user should be rejected
    const res = await SELF.fetch(`http://localhost/api/transfers/${init.id}/override`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ action: "force_approve" }),
    });
    expect(res.status).toBe(403);
  });

  it("conference secretary can force-approve a transfer", async () => {
    const secretaryToken = await setupSecretary();
    const memberId5 = await createMember("Override Approve Test");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId5, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    const overrideRes = await SELF.fetch(`http://localhost/api/transfers/${init.id}/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretaryToken}`,
      },
      body: JSON.stringify({ action: "force_approve", note: "Expedited by secretary" }),
    });
    expect(overrideRes.status).toBe(200);
    const overrideBody = (await overrideRes.json()) as {
      success: boolean;
      status: string;
      overridden: boolean;
    };
    expect(overrideBody.success).toBe(true);
    expect(overrideBody.overridden).toBe(true);

    const dbTransfer = await env.DB.prepare(
      "SELECT status, override_by, override_action, override_note FROM transfer_requests WHERE id = ?"
    )
      .bind(init.id)
      .first<{
        status: string;
        override_by: number | null;
        override_action: string | null;
        override_note: string | null;
      }>();
    expect(dbTransfer?.override_action).toBe("force_approve");
    expect(dbTransfer?.override_note).toBe("Expedited by secretary");
    expect(dbTransfer?.override_by).toBeGreaterThan(0);
  });

  it("conference secretary can force-reject a transfer", async () => {
    const secretaryToken = await setupSecretary();
    const memberId6 = await createMember("Force Reject Test");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId6, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    const overrideRes = await SELF.fetch(`http://localhost/api/transfers/${init.id}/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretaryToken}`,
      },
      body: JSON.stringify({ action: "force_reject", note: "Invalid transfer request" }),
    });
    expect(overrideRes.status).toBe(200);
    const overrideBody = (await overrideRes.json()) as {
      success: boolean;
      status: string;
      overridden: boolean;
    };
    expect(overrideBody.success).toBe(true);
    expect(overrideBody.status).toBe("rejected");

    const mCheck = await env.DB.prepare("SELECT status FROM members WHERE id = ?")
      .bind(memberId6)
      .first<{ status: string }>();
    expect(mCheck?.status).toBe("active");

    const dbTransfer = await env.DB.prepare(
      "SELECT status, override_action, override_note FROM transfer_requests WHERE id = ?"
    )
      .bind(init.id)
      .first<{
        status: string;
        override_action: string | null;
        override_note: string | null;
      }>();
    expect(dbTransfer?.status).toBe("rejected");
    expect(dbTransfer?.override_action).toBe("force_reject");
  });

  it("transfer returns 401 without auth", async () => {
    const res = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: 1, toChurchId: 2 }),
    });
    expect(res.status).toBe(401);
  });

  it("override returns 400 for invalid action", async () => {
    const secretaryToken = await setupSecretary();
    const memberId7 = await createMember("Invalid Override Test");

    const initRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId7, toChurchId: churchId2 }),
    });
    const init = (await initRes.json()) as { id: number };

    const res = await SELF.fetch(`http://localhost/api/transfers/${init.id}/override`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretaryToken}`,
      },
      body: JSON.stringify({ action: "invalid_action" }),
    });
    expect(res.status).toBe(400);
  });
});
