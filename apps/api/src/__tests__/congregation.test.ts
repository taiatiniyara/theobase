import { describe, it, expect, beforeAll } from "vitest";
import {
  jwt, env, createExecutionContext, waitOnExecutionContext,
  worker, runMigrations, setupEmails, getEmails, execSql, authedRequest,
} from "./test-helpers";

describe("congregation management", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Suva SDA Church', 'church', 'Pacific/Fiji', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-con1', 'con-1', 'Clerk', 'C1', 'clerk1@test.com', 1, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk1-user', 'clerk1@test.com', 'clerk-con1', 'con-1', '2025-01-01T00:00:00Z')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk-1', 'clerk-con1', 'con-1', 'clerk', '2025-01-01T00:00:00Z')`);
  });

  it("POST /congregations creates a new congregation", async () => {
    const token = await jwt({ userId: "clerk-1", congregationId: undefined } as any);
    const { res, json } = await authedRequest("POST", "/congregations", token, {
      name: "Nadi SDA Church",
      type: "church",
      timezone: "Pacific/Fiji",
    });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe("Nadi SDA Church");
    expect(body.type).toBe("church");
    expect(body.timezone).toBe("Pacific/Fiji");
  });

  it("GET /congregations/:id returns details", async () => {
    const token = await jwt({ userId: "clerk-1" });
    const { res, json } = await authedRequest("GET", "/congregations/con-1", token);
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.name).toBe("Suva SDA Church");
    expect(body.type).toBe("church");
  });

  it("PATCH /congregations/:id updates details", async () => {
    const token = await jwt({ userId: "clerk1-user", congregationId: "con-1" });
    const { res, json } = await authedRequest("PATCH", "/congregations/con-1", token, { timezone: "Pacific/Auckland" });
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.timezone).toBe("Pacific/Auckland");
  });

  it("POST /congregations/:id/invite sends officer invitation with role", async () => {
    const token = await jwt({ userId: "clerk1-user", congregationId: "con-1" });
    const { res } = await authedRequest("POST", "/congregations/con-1/invite", token, { email: "treasurer@nadi.org", role: "treasurer" });
    expect(res.status).toBe(200);

    const emails = getEmails();
    const inviteEmail = emails[emails.length - 1];
    expect(inviteEmail.to).toBe("treasurer@nadi.org");
    expect(inviteEmail.html).toContain("treasurer");
    expect(inviteEmail.html).toContain("con-1");
  });
});

describe("csv member import", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
  });

  it("POST /congregations/:id/members/import creates persons from CSV", async () => {
    const token = await jwt({ userId: "clerk-user", congregationId: "con-1" });
    const csv = "firstName,lastName,email,phone,isMember\nAlice,Smith,alice@test.com,+679 111,true\nBob,Jones,bob@test.com,+679 222,false";
    const { res, json } = await authedRequest("POST", "/congregations/con-1/members/import", token, { csv });
    expect(res.status).toBe(201);
    const body = await json();
    expect(body.imported).toBe(2);
    expect(body.errors).toHaveLength(0);
    expect(body.personIds).toHaveLength(2);
  });

  it("POST /congregations/:id/members/import returns validation errors", async () => {
    const token = await jwt({ userId: "clerk-user", congregationId: "con-1" });
    const csv = "firstName,lastName,email,phone,isMember\n,Smith,bademail,+679 111,true";
    const { res, json } = await authedRequest("POST", "/congregations/con-1/members/import", token, { csv });
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.errors.length).toBeGreaterThan(0);
  });
});

describe("officer invitation flow", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
  });

  it("POST /congregations/:id/invite creates pending role and sends email", async () => {
    const token = await jwt({ userId: "clerk-user", congregationId: "con-1" });
    const { res, json } = await authedRequest("POST", "/congregations/con-1/invite", token, { email: "treasurer@test.com", role: "treasurer" });
    expect(res.status).toBe(200);
    const body = await json();
    expect(body.ok).toBe(true);

    const roles: any = await env.DB.prepare("SELECT * FROM role WHERE congregation_id = 'con-1'").all();
    const pendingRole = roles.results.find((r: any) => r.role_type === "treasurer");
    expect(pendingRole).toBeDefined();

    const emails = getEmails();
    const inviteEmail = emails[emails.length - 1];
    expect(inviteEmail.to).toBe("treasurer@test.com");
    expect(inviteEmail.html).toContain("treasurer");
  });

  it("invited officer logging in gets role assigned to their person record", async () => {
    const jwtClerk = await jwt({ userId: "clerk-user", congregationId: "con-1" });
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('treas-1', 'con-1', 'Treas', 'Urer', 'treasurer@test.com', 1, '2025-01-01', '2025-01-01')`);

    const ctx = createExecutionContext();
    await worker.fetch(
      new Request("http://localhost/congregations/con-1/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `token=${jwtClerk}` },
        body: JSON.stringify({ email: "treasurer@test.com", role: "treasurer" }),
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);

    await worker.fetch(
      new Request("http://localhost/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "treasurer@test.com" }),
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);

    const emails = getEmails();
    const tokenMatch = emails[emails.length - 1].html.match(/token=([a-f0-9]+)/);
    const token = tokenMatch![1];

    const verifyRes = await worker.fetch(
      new Request("http://localhost/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(verifyRes.status).toBe(200);

    const roles: any = await env.DB.prepare("SELECT * FROM role WHERE congregation_id = 'con-1' AND role_type = 'treasurer'").all();
    const assignedRole = roles.results.find((r: any) => r.person_id === "treas-1");
    expect(assignedRole).toBeDefined();
  });
});

describe("role-based permissions", () => {
  beforeAll(async () => {
    await runMigrations();
    await execSql(`INSERT INTO congregation (id, name, type, timezone, created_at) VALUES ('con-1', 'Test Church', 'church', 'UTC', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('clerk-1', 'con-1', 'Clerk', 'One', 'clerk@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO person (id, congregation_id, first_name, last_name, email, is_member, created_at, updated_at) VALUES ('member-1', 'con-1', 'Member', 'One', 'member@test.com', 1, '2025-01-01', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('clerk-user', 'clerk@test.com', 'clerk-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO "user" (id, email, person_id, congregation_id, created_at) VALUES ('member-user', 'member@test.com', 'member-1', 'con-1', '2025-01-01')`);
    await execSql(`INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('role-clerk', 'clerk-1', 'con-1', 'clerk', '2025-01-01')`);
  });

  it("non-clerk cannot modify congregation details", async () => {
    const token = await jwt({ userId: "member-user", congregationId: "con-1" });
    const { res } = await authedRequest("PATCH", "/congregations/con-1", token, { name: "Hacked Name" });
    expect(res.status).toBe(403);
  });

  it("clerk can modify congregation details", async () => {
    const token = await jwt({ userId: "clerk-user", congregationId: "con-1" });
    const { res } = await authedRequest("PATCH", "/congregations/con-1", token, { timezone: "Pacific/Auckland" });
    expect(res.status).toBe(200);
  });
});
