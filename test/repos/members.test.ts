import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../worker/schema";
import { MemberRepo } from "../../worker/repos/members";
import { HouseholdRepo } from "../../worker/repos/households";
import { PositionRepo } from "../../worker/repos/positions";
import { TransferRepo } from "../../worker/repos/transfers";

const MEMBER_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL, parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER, conference_id INTEGER, role TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL, household_id INTEGER, full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT, join_date TEXT, prev_church_id INTEGER, phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active', status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1)`,
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL, head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, module TEXT NOT NULL DEFAULT 'core')`,
  `CREATE TABLE IF NOT EXISTS member_positions (member_id INTEGER NOT NULL, position_id INTEGER NOT NULL, start_date TEXT NOT NULL DEFAULT (datetime('now')), end_date TEXT, PRIMARY KEY (member_id, position_id))`,
  `CREATE TABLE IF NOT EXISTS transfer_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL, from_church_id INTEGER NOT NULL, to_church_id INTEGER NOT NULL, initiated_by INTEGER NOT NULL, initiated_at TEXT NOT NULL DEFAULT (datetime('now')), conference_approved_by INTEGER, conference_approved_at TEXT, accepted_by INTEGER, accepted_at TEXT, status TEXT NOT NULL DEFAULT 'pending_conference', rejection_note TEXT, expires_at TEXT, override_by INTEGER, override_at TEXT, override_action TEXT, override_note TEXT)`,
];

beforeAll(async () => {
  for (const s of MEMBER_SCHEMA) {
    await env.DB.exec(s);
  }
  await env.DB.prepare(
    "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (1, 'Test Church', 'TC', 'organized', 1, 'conference')"
  ).run();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES (1, 'test@test.com', 'hash', 'secretary')"
  ).run();
});

describe("MemberRepo", () => {
  const db = drizzle(env.DB, { schema });
  const repo = new MemberRepo(db);

  it("creates and finds a member", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Alice Test" });
    expect(member.fullName).toBe("Alice Test");
    expect(member.churchId).toBe(1);
    expect(member.status).toBe("active");
    expect(member.id).toBeGreaterThan(0);

    const found = await repo.findById(member.id);
    expect(found?.fullName).toBe("Alice Test");
  });

  it("finds all and filters by church", async () => {
    const _a = await repo.create({ churchId: 1, fullName: "Filter A" });
    const _b = await repo.create({ churchId: 1, fullName: "Filter B" });

    const all = await repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);

    const byChurch = await repo.findAll({ churchId: 1 });
    expect(byChurch.length).toBeGreaterThanOrEqual(2);
  });

  it("filters by search text", async () => {
    await repo.create({ churchId: 1, fullName: "Searchable Alice" });
    await repo.create({ churchId: 1, fullName: "Bob Other" });

    const results = await repo.findAll({ search: "Alice" });
    expect(results.length).toBe(1);
    expect(results[0]!.fullName).toContain("Alice");
  });

  it("updates a member and bumps version", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Version Test" });
    expect(member.version).toBe(1);

    await repo.update(member.id, { fullName: "Version Updated" });

    const fresh = await repo.findById(member.id);
    expect(fresh?.fullName).toBe("Version Updated");
    expect(fresh?.version).toBe(2);
  });

  it("sets status on a member", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Status Test" });
    await repo.setStatus(member.id, "removed", new Date().toISOString());

    const fresh = await repo.findById(member.id);
    expect(fresh?.status).toBe("removed");
    expect(fresh?.statusDate).toBeTruthy();
  });

  it("finds member by user id", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Linked Member" });
    await env.DB.prepare(
      "INSERT OR IGNORE INTO users (id, email, password_hash, member_id, role) VALUES (2, 'linked@test.com', 'hash', ?, 'member')"
    )
      .bind(member.id)
      .run();

    const found = await repo.findByUserId(2);
    expect(found?.fullName).toBe("Linked Member");
  });

  it("finds member by id and church", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Church Scoped" });
    const found = await repo.findByIdAndChurch(member.id, 1);
    expect(found?.fullName).toBe("Church Scoped");

    const notFound = await repo.findByIdAndChurch(member.id, 999);
    expect(notFound).toBeUndefined();
  });

  it("reactivates a transferred member", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Reactive Test" });
    await repo.setStatus(member.id, "transferred");
    await repo.reactivate(member.id);

    const fresh = await repo.findById(member.id);
    expect(fresh?.status).toBe("active");
    expect(fresh?.statusDate).toBeNull();
  });

  it("transfers a member to another church", async () => {
    const member = await repo.create({ churchId: 1, fullName: "Move Test" });
    await env.DB.prepare(
      "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (2, 'Dest Church', 'DC', 'organized', 1, 'conference')"
    ).run();

    await repo.transferTo(member.id, 2, 1);

    const fresh = await repo.findById(member.id);
    expect(fresh?.churchId).toBe(2);
    expect(fresh?.prevChurchId).toBe(1);
    expect(fresh?.status).toBe("active");
  });
});

describe("HouseholdRepo", () => {
  const db = drizzle(env.DB, { schema });
  const repo = new HouseholdRepo(db);

  it("creates and finds a household", async () => {
    const hh = await repo.create({ churchId: 1, name: "Test Home" });
    expect(hh.name).toBe("Test Home");
    expect(hh.id).toBeGreaterThan(0);

    const found = await repo.findById(hh.id);
    expect(found?.name).toBe("Test Home");
  });

  it("lists households by church", async () => {
    await repo.create({ churchId: 1, name: "HH A" });
    await repo.create({ churchId: 1, name: "HH B" });

    const list = await repo.findByChurch(1);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it("updates a household", async () => {
    const hh = await repo.create({ churchId: 1, name: "Old Name" });
    await repo.update(hh.id, { name: "New Name" });
    const found = await repo.findById(hh.id);
    expect(found?.name).toBe("New Name");
  });
});

describe("PositionRepo", () => {
  const db = drizzle(env.DB, { schema });
  const repo = new PositionRepo(db);

  it("creates and lists positions", async () => {
    await repo.create("Deacon");
    await repo.create("Head Elder");
    const all = await repo.findAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("assigns and removes a position for member 1", async () => {
    const pos = await repo.create("Treasurer");

    await repo.assign(1, pos.id);
    const hasActive = await repo.hasActivePosition(1, pos.id);
    expect(hasActive).toBe(true);

    const memberPositions = await repo.findByMember(1);
    expect(memberPositions.length).toBeGreaterThanOrEqual(1);

    await repo.removeActive(1, pos.id);
    const stillActive = await repo.hasActivePosition(1, pos.id);
    expect(stillActive).toBe(false);
  });
});

describe("TransferRepo", () => {
  const db = drizzle(env.DB, { schema });
  const repo = new TransferRepo(db);

  it("creates and finds a transfer", async () => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (3, 'Third Church', 'TC3', 'organized', 1, 'conference')"
    ).run();

    const tr = await repo.create({
      memberId: 1,
      fromChurchId: 1,
      toChurchId: 3,
      initiatedBy: 1,
    });
    expect(tr.status).toBe("pending_conference");
    expect(tr.expiresAt).toBeTruthy();

    const found = await repo.findById(tr.id);
    expect(found?.memberId).toBe(1);
  });

  it("handles transfer lifecycle", async () => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (3, 'Third Church', 'TC3', 'organized', 1, 'conference')"
    ).run();

    const tr = await repo.create({
      memberId: 1,
      fromChurchId: 1,
      toChurchId: 3,
      initiatedBy: 1,
    });

    await repo.approve(tr.id, 1);
    let updated = await repo.findById(tr.id);
    expect(updated?.status).toBe("pending_destination");

    await repo.accept(tr.id, 1);
    updated = await repo.findById(tr.id);
    expect(updated?.status).toBe("completed");
  });

  it("rejects a transfer", async () => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (3, 'Third Church', 'TC3', 'organized', 1, 'conference')"
    ).run();

    const tr = await repo.create({
      memberId: 1,
      fromChurchId: 1,
      toChurchId: 3,
      initiatedBy: 1,
    });

    await repo.reject(tr.id, "Not a good fit");
    const updated = await repo.findById(tr.id);
    expect(updated?.status).toBe("rejected");
    expect(updated?.rejectionNote).toBe("Not a good fit");
  });

  it("detects pending transfers for a member", async () => {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO churches (id, name, code, type, parent_id, parent_type) VALUES (3, 'Third Church', 'TC3', 'organized', 1, 'conference')"
    ).run();

    await repo.create({
      memberId: 1,
      fromChurchId: 1,
      toChurchId: 3,
      initiatedBy: 1,
    });

    const hasPending = await repo.hasPendingForMember(1);
    expect(hasPending).toBe(true);

    const noPending = await repo.hasPendingForMember(999);
    expect(noPending).toBe(false);
  });
});
