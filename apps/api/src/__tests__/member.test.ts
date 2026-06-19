import { describe, it, expect, beforeAll } from "vitest";
import {
  TEST_SECRET, jwt, env, createExecutionContext, waitOnExecutionContext,
  worker, runMigrations, setupEmails, execSql, authedRequest,
} from "./test-helpers";
import { createJwt } from "@theobase/auth";

describe("member portal", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('church-1', 'Test Church', 'church', 'Pacific/Fiji', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, phone, address, is_member, created_at, updated_at) VALUES ('person-1', 'church-1', 'John', 'Elder', 'john@example.com', '+679 1234567', '123 Church St', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-1', 'john@example.com', 'person-1', 'church-1', '2025-01-01T00:00:00Z')`);
  });

  it("GET /me returns enriched profile when person record is linked", async () => {
    const token = await jwt({ userId: "user-1", congregationId: "church-1" });
    const { res, json } = await authedRequest("GET", "/me", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.email).toBe("john@example.com");
    expect(body.firstName).toBe("John");
    expect(body.lastName).toBe("Elder");
    expect(body.phone).toBe("+679 1234567");
    expect(body.address).toBe("123 Church St");
    expect(body.isMember).toBe(true);
    expect(body.congregationId).toBe("church-1");
  });

  it("PATCH /me updates contact details", async () => {
    const token = await jwt({ userId: "user-1", congregationId: "church-1" });
    const { res, json } = await authedRequest("PATCH", "/me", token, { phone: "+679 9876543", address: "456 New Rd" });
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.phone).toBe("+679 9876543");
    expect(body.address).toBe("456 New Rd");
  });

  it("PATCH /me rejects invalid phone format", async () => {
    const token = await jwt({ userId: "user-1", congregationId: "church-1" });
    const { res } = await authedRequest("PATCH", "/me", token, { phone: "not-a-phone" });
    expect(res.status).toBe(400);
  });

  it("GET /me rejects access to a different congregation's data", async () => {
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('church-2', 'Other Church', 'church', 'Pacific/Auckland', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, created_at, updated_at) VALUES ('person-2', 'church-2', 'Jane', 'Stranger', 'jane@other.com', '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);

    const token = await jwt({ userId: "user-1", congregationId: "church-1" });
    const { res, json } = await authedRequest("GET", "/me", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.congregationId).toBe("church-1");
    expect(body.firstName).toBe("John");
  });
});

describe("enhanced /me endpoint", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Grace SDA', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, phone, is_member, created_at, updated_at) VALUES ('person-1', 'con-1', 'Mary', 'Member', 'mary@grace.org', '+679 111222', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-1', 'mary@grace.org', 'person-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-1', 'person-1', 'con-1', 'elder', '2025-01-01')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-2', 'person-1', 'con-1', 'deaconess', '2025-01-01')`);
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'person-1', 7000, '{"tithe":5000,"church_budget":2000}', 'approved', '2025-06-01')`);
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-2', 'con-1', 'person-1', 3000, '{"tithe":3000}', 'pending', '2025-06-15')`);
  });

  it("GET /me returns giving summary", async () => {
    const token = await jwt({ userId: "user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/me", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.email).toBe("mary@grace.org");
    expect(body.giving).toBeDefined();
    expect(body.giving.totalReceipts).toBe(2);
    expect(body.giving.approvedCount).toBe(1);
    expect(body.giving.pendingCount).toBe(1);
    expect(body.giving.totalAmount).toBe(10000);
  });

  it("GET /me returns ministry roles", async () => {
    const token = await jwt({ userId: "user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/me", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.roles).toBeDefined();
    expect(body.roles).toHaveLength(2);
    expect(body.roles).toContain("elder");
    expect(body.roles).toContain("deaconess");
  });
});

describe("rls isolation", () => {
  beforeAll(async () => {
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-a', 'Church A', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-b', 'Church B', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-a', 'con-a', 'Alice', 'A', 'alice@a.org', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-b', 'con-b', 'Bob', 'B', 'bob@b.org', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-a', 'alice@a.org', 'member-a', 'con-a', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('user-b', 'bob@b.org', 'member-b', 'con-b', '2025-01-01')`);
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-a', 'con-a', 'member-a', 5000, '{"tithe":5000}', 'approved', '2025-01-01')`);
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-b', 'con-b', 'member-b', 9000, '{"church_budget":9000}', 'approved', '2025-01-01')`);
    await execSql(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-a', 'con-a', '2025-06-01', 'completed', '2025-01-01')`);
    await execSql(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-b', 'con-b', '2025-06-01', 'completed', '2025-01-01')`);
  });

  it("user from Church A cannot see Church B receipts", async () => {
    const token = await jwt({ userId: "user-a", congregationId: "con-a" });
    const { res, json } = await authedRequest("GET", "/receipts", token);
    expect(res.status).toBe(200);
    const body: any[] = await json();
    const ids = body.map((r: any) => r.id);
    expect(ids).toContain("rec-a");
    expect(ids).not.toContain("rec-b");
  });

  it("user from Church A cannot see Church B board meetings", async () => {
    const token = await jwt({ userId: "user-a", congregationId: "con-a" });
    const { res, json } = await authedRequest("GET", "/board/meetings", token);
    expect(res.status).toBe(200);
    const body: any[] = await json();
    const ids = body.map((m: any) => m.id);
    expect(ids).toContain("meet-a");
    expect(ids).not.toContain("meet-b");
  });

  it("user without congregation gets empty results", async () => {
    const token = await createJwt({ userId: "user-a", congregationId: undefined });
    const { res, json } = await authedRequest("GET", "/receipts", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body).toEqual([]);
  });
});
