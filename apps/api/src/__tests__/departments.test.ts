import { describe, it, expect, beforeAll } from "vitest";
import { jwt, runMigrations, setupEmails, execSql, env, createExecutionContext, waitOnExecutionContext, worker } from "./test-helpers";

describe("departments", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('pf-1', 'con-1', 'Path', 'Finder', 'pf@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('pf-user', 'pf@test.com', 'pf-1', 'con-1', '2025-01-01')`);
  });

  const h = (method: string, path: string, body?: any) =>
    fetchWithToken(method, path, body);

  async function fetchWithToken(method: string, path: string, body?: any) {
    const token = await jwt({ userId: "pf-user", congregationId: "con-1" });
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

  it("POST /pathfinder/progress records class progress", async () => {
    const { res } = await fetchWithToken("POST", "/pathfinder/progress", {
      memberId: "pf-1", className: "friend", clubType: "pathfinders", status: "in_progress",
    });
    expect(res.status).toBe(201);
  });

  it("POST /pathfinder/honors records an honor", async () => {
    const { res } = await fetchWithToken("POST", "/pathfinder/honors", {
      memberId: "pf-1", name: "First Aid", category: "Health", earnedAt: "2025-06-01",
    });
    expect(res.status).toBe(201);
  });

  it("POST /sabbath-school/classes and GET them", async () => {
    const { res } = await fetchWithToken("POST", "/sabbath-school/classes", {
      division: "adult", name: "Adult Class A",
    });
    expect(res.status).toBe(201);
  });

  it("POST /welfare/cases creates a welfare case", async () => {
    const { res } = await fetchWithToken("POST", "/welfare/cases", {
      personId: "pf-1", assistanceType: "food", description: "Emergency food parcel", value: 50,
    });
    expect(res.status).toBe(201);
  });

  it("POST /pantry/items adds a pantry item", async () => {
    const { res, json } = await fetchWithToken("POST", "/pantry/items", {
      name: "Rice", quantity: 100, unit: "kg",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.name).toBe("Rice");
  });

  it("POST /health/events + contacts", async () => {
    const ev = await fetchWithToken("POST", "/health/events", {
      name: "Spring Health Expo", date: "2025-07-01", type: "health_expo",
    });
    expect(ev.res.status).toBe(201);
    const evBody = await ev.json();

    const ct = await fetchWithToken("POST", "/health/contacts", {
      eventId: evBody.id, name: "Jane Visitor", phone: "123", email: "jane@test.com", interests: ["diabetes"],
    });
    expect(ct.res.status).toBe(201);
  });

  it("POST /households creates a household", async () => {
    const { res } = await fetchWithToken("POST", "/households", {
      name: "The Pathfinder Family",
    });
    expect(res.status).toBe(201);
  });

  it("POST /candidacies starts a baptismal candidacy", async () => {
    const { res, json } = await fetchWithToken("POST", "/candidacies", {
      personId: "pf-1", stage: "interest", startDate: "2025-06-01",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.stage).toBe("interest");
  });
});
