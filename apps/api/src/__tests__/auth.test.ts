import { describe, it, expect, beforeAll } from "vitest";
import { createJwt, verifyJwt } from "@theobase/auth";
import {
  jwt, env, createExecutionContext, waitOnExecutionContext,
  worker, runMigrations, setupEmails, getEmails, getLastToken, authRequest, authVerify,
} from "./test-helpers";

describe("auth", () => {
  beforeAll(async () => {
    setupEmails();
    await runMigrations();
  });

  it("POST /auth/request returns 400 for invalid email", async () => {
    const { res } = await authRequest("notanemail");
    expect(res.status).toBe(400);
  });

  it("POST /auth/request sends magic link for valid email", async () => {
    const { res } = await authRequest("elder@example.com");
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.ok).toBe(true);

    const emails = getEmails();
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(emails[emails.length - 1].to).toBe("elder@example.com");
    expect(emails[emails.length - 1].html).toContain("auth/verify?token=");
  });

  it("POST /auth/verify returns 401 for invalid token", async () => {
    const { res } = await authVerify("invalid-token");
    expect(res.status).toBe(401);
  });

  it("POST /auth/verify returns JWT for valid token", async () => {
    const email = "clerk@example.com";
    const { res: reqRes } = await authRequest(email);
    expect(reqRes.status).toBe(200);

    const token = getLastToken();
    const { res: verifyRes } = await authVerify(token);

    expect(verifyRes.status).toBe(200);
    const cookies = verifyRes.headers.get("Set-Cookie");
    expect(cookies).toContain("token=");
    expect(cookies).toContain("HttpOnly");

    const body: any = await verifyRes.json();
    expect(body.ok).toBe(true);
    expect(body.userId).toBeDefined();
  });

  it("reusing a token returns 401", async () => {
    const email = "deacon@example.com";
    await authRequest(email);
    const token = getLastToken();

    const { res: first } = await authVerify(token);
    expect(first.status).toBe(200);

    const { res: second } = await authVerify(token);
    expect(second.status).toBe(401);
  });

  it("GET /me returns 401 without auth", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", { method: "GET" }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });

  it("GET /me returns user info with valid JWT", async () => {
    const email = "pastor@example.com";
    await authRequest(email);
    const token = getLastToken();

    const { res: verifyRes } = await authVerify(token);
    const cookie = verifyRes.headers.get("Set-Cookie")!;

    const ctx = createExecutionContext();
    const meRes = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: cookie.split(";")[0] },
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(meRes.status).toBe(200);
    const body: any = await meRes.json();
    expect(body.email).toBe(email.toLowerCase());
  });

  it("GET /me returns 401 with expired JWT", async () => {
    const expiredJwt = await jwt({ userId: "test-user" }, -1);
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("http://localhost/me", {
        method: "GET",
        headers: { Cookie: `token=${expiredJwt}` },
      }),
      env, ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(401);
  });

  it("verifyJwt rejects expired tokens", async () => {
    const expiredJwt = await createJwt({ userId: "test-user" }, -1);
    const result = await verifyJwt(expiredJwt);
    expect("error" in result).toBe(true);
  });
});
