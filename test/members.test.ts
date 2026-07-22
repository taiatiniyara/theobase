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
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS transfer_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL REFERENCES members(id), from_church_id INTEGER NOT NULL REFERENCES churches(id), to_church_id INTEGER NOT NULL REFERENCES churches(id), initiated_by INTEGER NOT NULL REFERENCES users(id), initiated_at TEXT NOT NULL DEFAULT (datetime('now')), conference_approved_by INTEGER REFERENCES users(id), conference_approved_at TEXT, accepted_by INTEGER REFERENCES users(id), accepted_at TEXT, rejection_note TEXT, status TEXT NOT NULL DEFAULT 'pending_conference' CHECK (status IN ('pending_conference', 'pending_destination', 'completed', 'rejected')));` +
  `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, recipient_user_id INTEGER NOT NULL REFERENCES users(id), type TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, message TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

describe("membership API", () => {
  let accessToken: string;
  let conferenceId: number;
  let churchId: number;
  let churchId2: number;
  let memberId: number;
  let memberId2: number;

  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");

    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "memadmin@test.com",
        password: "password123",
        fullName: "Mem Admin",
        conferenceName: "Central Conference",
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
        name: "Central SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const c1Body = (await c1.json()) as { id: number };
    churchId = c1Body.id;

    const c2 = await SELF.fetch("http://localhost/api/churches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: "Riverside SDA Church",
        type: "organized",
        parentId: conferenceId,
        parentType: "conference",
      }),
    });
    const c2Body = (await c2.json()) as { id: number };
    churchId2 = c2Body.id;
  });

  function authHeaders() {
    return { Authorization: `Bearer ${accessToken}` };
  }
  function jsonAuthHeaders() {
    return { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };
  }

  async function createMember(name: string, opts?: Record<string, unknown>) {
    const res = await SELF.fetch("http://localhost/api/members", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ churchId, fullName: name, ...opts }),
    });
    if (res.status !== 201)
      throw new Error(`Create member failed: ${res.status} ${await res.text()}`);
    return ((await res.json()) as { id: number }).id;
  }

  it("member CRUD: create, list, filter, search, detail, update, 404", async () => {
    memberId = await createMember("John Doe", { gender: "male", email: "john@example.com" });
    memberId2 = await createMember("Jane Smith", { gender: "female", email: "jane@example.com" });

    const listRes = await SELF.fetch("http://localhost/api/members", { headers: authHeaders() });
    const listBody = (await listRes.json()) as { members: { id: number }[] };
    expect(listBody.members.length).toBeGreaterThanOrEqual(2);

    const filterRes = await SELF.fetch(`http://localhost/api/members?church_id=${churchId}`, {
      headers: authHeaders(),
    });
    const filterBody = (await filterRes.json()) as { members: { id: number }[] };
    expect(filterBody.members.length).toBe(2);

    const searchRes = await SELF.fetch(`http://localhost/api/members?search=John`, {
      headers: authHeaders(),
    });
    const searchBody = (await searchRes.json()) as { members: unknown[] };
    expect(searchBody.members.length).toBe(1);

    const detailRes = await SELF.fetch(`http://localhost/api/members/${memberId}`, {
      headers: authHeaders(),
    });
    const detailBody = (await detailRes.json()) as { full_name: string; church_name: string };
    expect(detailBody.full_name).toBe("John Doe");
    expect(detailBody.church_name).toBe("Central SDA Church");

    const updateRes = await SELF.fetch(`http://localhost/api/members/${memberId}`, {
      method: "PATCH",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ fullName: "John Doe Jr.", version: 1 }),
    });
    expect(updateRes.status).toBe(200);

    const staleRes = await SELF.fetch(`http://localhost/api/members/${memberId}`, {
      method: "PATCH",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ fullName: "Stale", version: 1 }),
    });
    expect(staleRes.status).toBe(409);

    const missingRes = await SELF.fetch("http://localhost/api/members/99999", {
      headers: authHeaders(),
    });
    expect(missingRes.status).toBe(404);
  });

  it("households", async () => {
    memberId = await createMember("Household Tester", { gender: "male" });

    const createRes = await SELF.fetch("http://localhost/api/households", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ churchId, name: "Test Family", address: "123 Main St" }),
    });
    expect(createRes.status).toBe(201);
    const hh = (await createRes.json()) as { id: number };

    const listRes = await SELF.fetch(`http://localhost/api/households?church_id=${churchId}`, {
      headers: authHeaders(),
    });
    const listBody = (await listRes.json()) as { households: unknown[] };
    expect(listBody.households.length).toBe(1);

    const updateRes = await SELF.fetch(`http://localhost/api/households/${hh.id}`, {
      method: "PATCH",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ name: "Test Family Updated" }),
    });
    expect(updateRes.status).toBe(200);
  });

  it("positions: create, list, duplicate rejection", async () => {
    const createRes = await SELF.fetch("http://localhost/api/positions", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ name: "Elder" }),
    });
    expect(createRes.status).toBe(201);

    const listRes = await SELF.fetch("http://localhost/api/positions", { headers: authHeaders() });
    const listBody = (await listRes.json()) as { positions: { name: string }[] };
    expect(listBody.positions.some((p) => p.name === "Elder")).toBe(true);

    const dupRes = await SELF.fetch("http://localhost/api/positions", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ name: "Elder" }),
    });
    expect(dupRes.status).toBe(409);
  });

  it("member positions: assign, duplicate, remove", async () => {
    memberId = await createMember("Position Tester", { gender: "male" });

    await SELF.fetch("http://localhost/api/positions", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ name: "Deacon" }),
    });

    const assignRes = await SELF.fetch(`http://localhost/api/members/${memberId}/positions`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ positionId: 1 }),
    });
    expect(assignRes.status).toBe(201);

    const dupAssignRes = await SELF.fetch(`http://localhost/api/members/${memberId}/positions`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ positionId: 1 }),
    });
    expect(dupAssignRes.status).toBe(409);

    const rmRes = await SELF.fetch(`http://localhost/api/members/${memberId}/positions/1`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    expect(rmRes.status).toBe(200);
  });

  it("transfer workflow: initiate, approve, accept, list", async () => {
    memberId = await createMember("Transfer Src", { gender: "male" });
    memberId2 = await createMember("Transfer Tgt", { gender: "female" });

    const transferRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId2, toChurchId: churchId2 }),
    });
    expect(transferRes.status).toBe(201);
    const t = (await transferRes.json()) as { id: number };
    const transferId = t.id;

    // Notifications should be available via the API
    const notifRes = await SELF.fetch("http://localhost/api/notifications", {
      headers: authHeaders(),
    });
    expect(notifRes.status).toBe(200);

    // Duplicate transfer for same member fails (member is now 'transferred')
    const dupTransferRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId: memberId2, toChurchId: churchId2 }),
    });
    expect(dupTransferRes.status).toBe(400);

    const approveRes = await SELF.fetch(`http://localhost/api/transfers/${transferId}/approve`, {
      method: "POST",
      headers: authHeaders(),
    });
    expect(approveRes.status).toBe(200);

    const acceptRes = await SELF.fetch(`http://localhost/api/transfers/${transferId}/accept`, {
      method: "POST",
      headers: authHeaders(),
    });
    expect(acceptRes.status).toBe(200);

    const listRes = await SELF.fetch("http://localhost/api/transfers", { headers: authHeaders() });
    const listBody = (await listRes.json()) as { transfers: { status: string }[] };
    expect(listBody.transfers.length).toBe(1);
    expect(listBody.transfers[0]!.status).toBe("completed");
  });

  it("transfer rejection with note", async () => {
    memberId = await createMember("Reject Me", { gender: "male" });
    const transferRes = await SELF.fetch("http://localhost/api/transfers", {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ memberId, toChurchId: churchId2 }),
    });
    expect(transferRes.status).toBe(201);
    const t = (await transferRes.json()) as { id: number };

    const rejectRes = await SELF.fetch(`http://localhost/api/transfers/${t.id}/reject`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ note: "Member not eligible" }),
    });
    expect(rejectRes.status).toBe(200);

    // Verify member is active again after rejection
    const detailRes = await SELF.fetch(`http://localhost/api/members/${memberId}`, {
      headers: authHeaders(),
    });
    const detailBody = (await detailRes.json()) as { status: string };
    expect(detailBody.status).toBe("active");
  });

  it("member removal", async () => {
    memberId = await createMember("Remove Me", { gender: "male" });

    const deceasedRes = await SELF.fetch(`http://localhost/api/members/${memberId}/remove`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ reason: "deceased" }),
    });
    expect(deceasedRes.status).toBe(200);
  });

  it("rejects unauthenticated access", async () => {
    expect((await SELF.fetch("http://localhost/api/members")).status).toBe(401);
    expect((await SELF.fetch("http://localhost/api/transfers")).status).toBe(401);
    expect((await SELF.fetch("http://localhost/api/households")).status).toBe(401);
    expect((await SELF.fetch("http://localhost/api/positions")).status).toBe(401);
  });
});
