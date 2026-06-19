import { describe, it, expect, beforeAll } from "vitest";
import { jwt, runMigrations, setupEmails, execSql, authedRequest } from "./test-helpers";

describe("boardroom", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user-1', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO board_meeting (id, congregation_id, date, status, created_at) VALUES ('meet-1', 'con-1', '2025-06-21', 'in_progress', '2025-01-01')`);
    await execSql(`INSERT INTO board_decision (id, meeting_id, number, title, description, vote_outcome, created_at) VALUES ('dec-1', 'meet-1', 1, 'Approve budget', 'Q3 budget', 'approved', '2025-01-01')`);
  });

  it("POST /board/meetings creates a meeting", async () => {
    const token = await jwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/board/meetings", token, {
      date: "2025-06-21", agenda: [{ title: "Treasurer Report" }, { title: "Baptismal Candidates" }],
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.id).toBeDefined();
    expect(body.status).toBe("draft");
    expect(body.agenda).toHaveLength(2);
  });

  it("GET /board/meetings lists meetings", async () => {
    const token = await jwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/board/meetings", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("POST /board/meetings/:id/decisions records a decision", async () => {
    const token = await jwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/board/meetings/meet-1/decisions", token, {
      title: "Approve budget", description: "Q3 budget approved", voteOutcome: "approved",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.title).toBe("Approve budget");
    expect(body.number).toBe(2);
    expect(body.voteOutcome).toBe("approved");
  });

  it("GET /board/meetings/:id returns meeting with decisions", async () => {
    const token = await jwt({ userId: "clerk-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/board/meetings/meet-1", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.id).toBe("meet-1");
    expect(body.decisions).toBeDefined();
    expect(body.decisions.length).toBeGreaterThanOrEqual(1);
    expect(body.decisions[0].title).toBe("Approve budget");
  });
});

describe("duty rota", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('elder-1', 'con-1', 'Elder', 'One', 'elder@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('elder-user-1', 'elder@test.com', 'elder-1', 'con-1', '2025-01-01')`);
  });

  it("POST /rota/slots creates a duty slot", async () => {
    const token = await jwt({ userId: "elder-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/rota/slots", token, {
      date: "2025-06-21", role: "elder", volunteerId: "elder-1",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.role).toBe("elder");
    expect(body.status).toBe("assigned");
  });

  it("GET /rota/:date returns slots for that date", async () => {
    const token = await jwt({ userId: "elder-user-1", congregationId: "con-1" });
    const { res, json } = await authedRequest("GET", "/rota/2025-06-21", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("Safety shield blocks youth duty without clearance", async () => {
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('youth-vol-1', 'con-1', 'Youth', 'Volunteer', 'youth@test.com', 1, '2025-01-01', '2025-01-01')`);

    const token = await jwt({ userId: "elder-user-1", congregationId: "con-1" });
    const { res } = await authedRequest("POST", "/rota/slots", token, {
      date: "2025-06-21", role: "youth_leader", volunteerId: "youth-vol-1",
    });
    expect(res.status).toBe(400);
  });
});
