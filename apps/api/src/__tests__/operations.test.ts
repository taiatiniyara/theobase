import { describe, it, expect, beforeAll } from "vitest";
import { jwt, runMigrations, setupEmails, execSql, env, createExecutionContext, waitOnExecutionContext, worker } from "./test-helpers";

describe("communion + AV", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('deacon-1', 'con-1', 'Deacon', 'One', 'deacon@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('deacon-user', 'deacon@test.com', 'deacon-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO av_order_of_service (id, congregation_id, date, items, updated_at, created_at) VALUES ('av-1', 'con-1', '2025-06-21', '[{"type":"hymn","title":"Amazing Grace"},{"type":"scripture","title":"Psalm 23"}]', '2025-01-01', '2025-01-01')`);
  });

  async function fetchWithToken(method: string, path: string, body?: any) {
    const token = await jwt({ userId: "deacon-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const headers: Record<string, string> = { Cookie: `token=${token}` };
    if (body) headers["Content-Type"] = "application/json";
    const res = await worker.fetch(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    return { res, json: () => res.json() };
  }

  it("POST /communion plans a communion service", async () => {
    const { res, json } = await fetchWithToken("POST", "/communion", {
      date: "2025-07-05",
      rooms: [{ name: "Men's Room", gender: "male", volunteerIds: ["deacon-1"] }],
      inventory: [{ item: "towel", quantity: 20, unit: "pieces" }],
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.rooms).toHaveLength(1);
    expect(body.inventory).toHaveLength(1);
  });

  it("POST /av/order-of-service updates the order", async () => {
    const { res } = await fetchWithToken("POST", "/av/order-of-service", {
      date: "2025-06-21",
      items: [{ type: "hymn", title: "Amazing Grace" }, { type: "scripture", title: "Psalm 23" }, { type: "prayer", title: "Opening Prayer" }],
    });
    expect(res.status).toBe(201);
  });

  it("GET /av/order-of-service/:date returns current order", async () => {
    const { res, json } = await fetchWithToken("GET", "/av/order-of-service/2025-06-21");
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.items).toBeDefined();
  });
});

describe("coordination", () => {
  beforeAll(async () => {
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-2', 'Other Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('pastor-1', 'con-1', 'Pastor', 'One', 'pastor@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('pastor-user', 'pastor@test.com', 'pastor-1', 'con-1', '2025-01-01')`);
  });

  async function fetchWithToken(method: string, path: string, body?: any) {
    const token = await jwt({ userId: "pastor-user", congregationId: "con-1" });
    const ctx = createExecutionContext();
    const headers: Record<string, string> = { Cookie: `token=${token}` };
    if (body) headers["Content-Type"] = "application/json";
    const res = await worker.fetch(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    return { res, json: () => res.json() };
  }

  it("POST /district/rotations schedules preaching", async () => {
    const { res } = await fetchWithToken("POST", "/district/rotations", {
      congregationId: "con-1", date: "2025-07-12", preacherId: "pastor-1", topic: "Faith",
    });
    expect(res.status).toBe(201);
  });

  it("POST /facilities/bookings creates a booking", async () => {
    const { res } = await fetchWithToken("POST", "/facilities/bookings", {
      date: "2025-08-01", timeStart: "10:00", timeEnd: "14:00", purpose: "Wedding reception",
    });
    expect(res.status).toBe(201);
  });

  it("POST /crisis/assets registers an asset", async () => {
    const { res } = await fetchWithToken("POST", "/crisis/assets", {
      type: "generator", description: "Honda 5kW",
    });
    expect(res.status).toBe(201);
  });

  it("POST /transfers initiates a transfer", async () => {
    const { res, json } = await fetchWithToken("POST", "/transfers", {
      memberId: "pastor-1", toCongregationId: "con-2",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.status).toBe("requested");
  });

  it("POST /nominating/sessions opens a nominating session", async () => {
    const { res, json } = await fetchWithToken("POST", "/nominating/sessions", {
      year: 2025,
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.year).toBe(2025);
  });
});
