import { describe, it, expect, beforeAll } from "vitest";
import { jwt, runMigrations, setupEmails, execSql, authedRequest, seedRoles } from "./test-helpers";

describe("receipt registry", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-1', 'con-1', 'John', 'Member', 'john@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treasurer-1', 'con-1', 'Treas', 'Urer', 'treasurer@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('member-user-1', 'john@test.com', 'member-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('treasurer-user-1', 'treasurer@test.com', 'treasurer-1', 'con-1', '2025-01-01')`);
    await seedRoles("member-1", "con-1", ["member"]);
    await seedRoles("treasurer-1", "con-1", ["treasurer"]);
  });

  it("POST /receipts creates a receipt with valid fund split", async () => {
    const token = await jwt({ userId: "treasurer-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/receipts", token, {
      amount: 10000,
      fundSplit: { tithe: 7000, church_budget: 2000, pathfinders: 1000 },
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.id).toBeDefined();
    expect(body.amount).toBe(10000);
    expect(body.fundSplit).toEqual({ tithe: 7000, church_budget: 2000, pathfinders: 1000 });
    expect(body.status).toBe("pending");
  });

  it("POST /receipts rejects fund split that doesn't match total", async () => {
    const token = await jwt({ userId: "treasurer-user-1", congregationId: "con-1" });
    const { res } = await authedRequest("POST", "/receipts", token, {
      amount: 10000,
      fundSplit: { tithe: 5000, church_budget: 3000 },
    });
    expect(res.status).toBe(400);
  });

  it("GET /receipts returns member's own receipts", async () => {
    const token = await jwt({ userId: "member-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/receipts", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /receipts/:id/verify approves a receipt", async () => {
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'member-1', 5000, '{"tithe":3000,"church_budget":2000}', 'pending', '2025-01-01')`);

    const token = await jwt({ userId: "treasurer-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/receipts/rec-1/verify", token, { approved: true });
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.status).toBe("approved");
    expect(body.verifiedById).toBe("treasurer-1");
  });
});

describe("treasury", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treas-1', 'con-1', 'Treas', 'Urer', 'treas@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('treas-user-1', 'treas@test.com', 'treas-1', 'con-1', '2025-01-01')`);
    await seedRoles("treas-1", "con-1", ["treasurer"]);
    await execSql(`INSERT INTO receipt (id, congregation_id, member_id, amount, fund_split, status, created_at) VALUES ('rec-1', 'con-1', 'treas-1', 10000, '{"tithe":7000,"church_budget":3000}', 'approved', '2025-01-01')`);
    await execSql(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-1', 'con-1', '2025-06-21', 'completed', '2025-01-01')`);
    await execSql(`INSERT INTO board_decision (id, meeting_id, number, title, description, vote_outcome, created_at) VALUES ('dec-1', 'meet-1', 1, 'Approve budget', 'Q3 budget', 'approved', '2025-01-01')`);
  });

  it("POST /treasury/expenses creates an expense linked to receipt and board decision", async () => {
    const token = await jwt({ userId: "treas-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/treasury/expenses", token, {
      amount: 3000, description: "Electricity bill", category: "church_budget",
      receiptId: "rec-1", boardDecisionId: "dec-1",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.description).toBe("Electricity bill");
    expect(body.receiptId).toBe("rec-1");
    expect(body.boardDecisionId).toBe("dec-1");
  });

  it("GET /treasury/expenses lists expenses", async () => {
    const token = await jwt({ userId: "treas-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/treasury/expenses", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("GET /treasury/balance returns fund balances computed from verified receipts minus expenses", async () => {
    const token = await jwt({ userId: "treas-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/treasury/balance", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body).toHaveProperty("church_budget");
    expect(body.church_budget).toBe(3000);
  });
});
