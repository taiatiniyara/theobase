import { describe, it, expect, beforeAll } from "vitest";
import { SELF, env } from "cloudflare:test";

const FULL_SCHEMA =
  `CREATE TABLE IF NOT EXISTS conferences (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, parent_union_id INTEGER, address TEXT, bank_details TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS districts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, conference_id INTEGER NOT NULL REFERENCES conferences(id), pastor_user_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS churches (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL CHECK (type IN ('organized', 'company', 'branch')), parent_id INTEGER NOT NULL, parent_type TEXT NOT NULL CHECK (parent_type IN ('conference', 'church')), district_id INTEGER REFERENCES districts(id), address TEXT, bank_details TEXT, charter_status TEXT, founded_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS households (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), head_member_id INTEGER, name TEXT NOT NULL, address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));` +
  `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, church_id INTEGER NOT NULL REFERENCES churches(id), household_id INTEGER REFERENCES households(id), full_name TEXT NOT NULL, preferred_name TEXT, dob TEXT, gender TEXT, baptism_date TEXT, baptism_type TEXT CHECK (baptism_type IN ('immersion', 'profession_of_faith')), join_date TEXT, prev_church_id INTEGER REFERENCES churches(id), phone TEXT, email TEXT, address TEXT, marital_status TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'deceased', 'removed')), status_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), version INTEGER NOT NULL DEFAULT 1);` +
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, member_id INTEGER REFERENCES members(id), conference_id INTEGER REFERENCES conferences(id), role TEXT NOT NULL CHECK (role IN ('president', 'secretary', 'treasurer', 'auditor', 'sysadmin', 'pastor', 'member')), email_verified INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));`;

describe("auth API", () => {
  beforeAll(async () => {
    await env.DB.exec(FULL_SCHEMA);
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;");
    await env.DB.exec("ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;");
    try {
      await env.DB.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;");
    } catch {
      // May already exist if FULL_SCHEMA created with it
    }
  });

  describe("auth middleware", () => {
    beforeAll(async () => {
      await env.DB.exec(FULL_SCHEMA);
    });

    async function createUser(): Promise<{ accessToken: string; userId: string }> {
      const res = await SELF.fetch("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "middleware-test@test.com",
          password: "password123",
          fullName: "Middleware Test",
          conferenceName: "MW Conference",
        }),
      });
      // 409 means already registered — that's fine
      if (res.status !== 200 && res.status !== 409) {
        throw new Error(`Signup failed: ${res.status}`);
      }
      await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
        .bind("middleware-test@test.com")
        .run();
      const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "middleware-test@test.com", password: "password123" }),
      });
      const body = (await loginRes.json()) as { accessToken: string; userId: string };
      return body;
    }

    it("returns 401 for unauthenticated request to a protected route", async () => {
      const res = await SELF.fetch("http://localhost/api/members");
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("Authentication required");
    });

    it("returns 200 for authenticated request to a protected route", async () => {
      await createUser();
      await SELF.fetch("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mw-admin@test.com",
          password: "password123",
          fullName: "MW Admin",
          conferenceName: "MW2 Conference",
        }),
      });
      await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
        .bind("mw-admin@test.com")
        .run();
      const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "mw-admin@test.com", password: "password123" }),
      });
      const { accessToken: adminToken } = (await loginRes.json()) as { accessToken: string };

      await SELF.fetch("http://localhost/api/churches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "MW Church",
          code: "mw_church",
          type: "organized",
          parentId: 1,
          parentType: "conference",
          districtId: 2,
        }),
      });

      const res = await SELF.fetch("http://localhost/api/members", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
    });

    it("does not protect the health route", async () => {
      const res = await SELF.fetch("http://localhost/api/health");
      expect(res.status).toBe(200);
    });

    it("does not protect auth signup", async () => {
      const res = await SELF.fetch("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "no-auth-test@test.com",
          password: "password123",
          fullName: "No Auth Test",
        }),
      });
      expect(res.status).toBe(200);
    });

    it("does not protect auth login", async () => {
      await createUser();
      const res = await SELF.fetch("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "middleware-test@test.com", password: "password123" }),
      });
      expect(res.status).toBe(200);
    });

    it("returns 401 for expired or invalid token", async () => {
      const res = await SELF.fetch("http://localhost/api/members", {
        headers: { Authorization: "Bearer invalid.token.here" },
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("Invalid or expired token");
    });

    it("does not protect auth forgot-password", async () => {
      const res = await SELF.fetch("http://localhost/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "middleware-test@test.com" }),
      });
      expect(res.status).toBe(200);
    });
  });

  it("full auth flow: signup, verify, login, me, refresh, forgot-password", async () => {
    // Signup — returns message, not tokens
    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@test.com",
        password: "password123",
        fullName: "Test Admin",
        conferenceName: "Test Conference",
      }),
    });
    expect(signupRes.status).toBe(200);
    const signupBody = (await signupRes.json()) as { message: string };
    expect(signupBody.message).toBeTruthy();

    // Unverified login is blocked
    const unverifiedLogin = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "password123" }),
    });
    expect(unverifiedLogin.status).toBe(403);
    const unverifiedBody = (await unverifiedLogin.json()) as { error: string };
    expect(unverifiedBody.error).toContain("verify your email");

    // Verify email via DB
    await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
      .bind("admin@test.com")
      .run();

    // Login after verification
    const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "password123" }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as {
      accessToken: string;
      refreshToken: string;
      role: string;
    };
    expect(loginBody.accessToken).toBeTruthy();
    expect(loginBody.refreshToken).toBeTruthy();
    expect(loginBody.role).toBe("sysadmin");

    // /me with login token
    const meRes = await SELF.fetch("http://localhost/api/auth/me", {
      headers: { Authorization: `Bearer ${loginBody.accessToken}` },
    });
    expect(meRes.status).toBe(200);
    const meBody = (await meRes.json()) as { email: string; role: string };
    expect(meBody.email).toBe("admin@test.com");
    expect(meBody.role).toBe("sysadmin");

    // Token refresh
    const refreshRes = await SELF.fetch("http://localhost/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: loginBody.refreshToken }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshBody = (await refreshRes.json()) as { accessToken: string };
    expect(refreshBody.accessToken).toBeTruthy();

    // Forgot password — no resetToken in response body
    const forgotRes = await SELF.fetch("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com" }),
    });
    expect(forgotRes.status).toBe(200);
    const forgotBody = (await forgotRes.json()) as { message: string; resetToken?: string };
    expect(forgotBody.message).toBeTruthy();
    expect(forgotBody.resetToken).toBeUndefined();

    // Get reset token from DB
    const tokenRow = await env.DB.prepare("SELECT reset_token FROM users WHERE email = ?")
      .bind("admin@test.com")
      .first<{ reset_token: string }>();
    expect(tokenRow).toBeTruthy();
    const resetToken = tokenRow!.reset_token;

    // Reset password
    const resetRes = await SELF.fetch("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: "newpass789" }),
    });
    expect(resetRes.status).toBe(200);

    // Login with new password
    const loginRes2 = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "newpass789" }),
    });
    expect(loginRes2.status).toBe(200);
  });

  it("rejects wrong password", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@test.com", password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unauthenticated /me", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("health endpoint returns database status", async () => {
    const res = await SELF.fetch("http://localhost/api/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; database: string };
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });

  it("user deactivation prevents login", async () => {
    // Create a separate user for this test
    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "deacttest@test.com",
        password: "testpass12",
        fullName: "Deact Test",
      }),
    });
    expect(signupRes.status).toBe(200);

    // Verify email manually
    await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
      .bind("deacttest@test.com")
      .run();

    // Login to get token
    const loginRes0 = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "deacttest@test.com", password: "testpass12" }),
    });
    expect(loginRes0.status).toBe(200);
    const loginBody0 = (await loginRes0.json()) as {
      accessToken: string;
      userId: string;
    };
    const adminToken = loginBody0.accessToken;
    const userId = Number(loginBody0.userId);

    // Deactivate the user
    const deactRes = await SELF.fetch(`http://localhost/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active: false }),
    });
    expect(deactRes.status).toBe(200);

    // Login should be rejected
    const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "deacttest@test.com", password: "testpass12" }),
    });
    expect(loginRes.status).toBe(403);

    // Reactivate (token still valid from signup)
    const reactRes = await SELF.fetch(`http://localhost/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active: true }),
    });
    expect(reactRes.status).toBe(200);

    // Login works again
    const loginRes2 = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "deacttest@test.com", password: "testpass12" }),
    });
    expect(loginRes2.status).toBe(200);
  });

  it("email verification: signup, unverified login blocked, verify via API, login succeeds", async () => {
    // Signup — should return message, not tokens
    const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "verify-test@test.com",
        password: "testpass12",
        fullName: "Verify Test",
      }),
    });
    expect(signupRes.status).toBe(200);
    const signupBody = (await signupRes.json()) as { message: string };
    expect(signupBody.message).toBeTruthy();
    expect((signupBody as Record<string, unknown>).accessToken).toBeUndefined();

    // Unverified login should be blocked
    const blockedRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "verify-test@test.com", password: "testpass12" }),
    });
    expect(blockedRes.status).toBe(403);

    // Verify email manually in DB (real token arrives via email, not testable here)
    await env.DB.prepare("UPDATE users SET email_verified = 1 WHERE email = ?")
      .bind("verify-test@test.com")
      .run();

    const loginRes = await SELF.fetch("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "verify-test@test.com", password: "testpass12" }),
    });
    expect(loginRes.status).toBe(200);
    const loginBody = (await loginRes.json()) as { accessToken: string };
    expect(loginBody.accessToken).toBeTruthy();
  });

  it("verify-email endpoint rejects invalid token", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Invalid");
  });
});

describe("cors", () => {
  it("returns ACAO header for allowed origin", async () => {
    const res = await SELF.fetch("http://localhost/api/health", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });

  it("does not return ACAO header for disallowed origin", async () => {
    const res = await SELF.fetch("http://localhost/api/health", {
      headers: { Origin: "https://evil.com" },
    });
    expect(res.status).toBe(200);
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).not.toBe("https://evil.com");
  });

  it("handles OPTIONS preflight for allowed origin", async () => {
    const res = await SELF.fetch("http://localhost/api/auth/login", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:5173");
  });

  it("returns a default origin for requests without Origin header", async () => {
    const res = await SELF.fetch("http://localhost/api/health");
    expect(res.status).toBe(200);
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).toBe("http://localhost:5173");
  });

  it("enforces restricted methods in preflight", async () => {
    const res = await SELF.fetch("http://localhost/api/health", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "PUT",
      },
    });
    expect(res.status).toBe(204);
    const allowed = res.headers.get("Access-Control-Allow-Methods");
    expect(allowed).not.toContain("PUT");
    expect(allowed).toContain("GET");
  });
});
