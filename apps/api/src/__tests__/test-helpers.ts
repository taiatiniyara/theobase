import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { createJwt, verifyJwt, DEFAULT_SECRET } from "@theobase/auth";
import { applyMigrations, MIGRATION_STATEMENTS } from "@theobase/db";
import { generateId } from "@theobase/shared";
import worker from "../index";

export const TEST_SECRET = DEFAULT_SECRET;

export function jwt(payload: { userId: string; congregationId?: string }, ttlSeconds?: number): Promise<string> {
  return createJwt(payload, TEST_SECRET, ttlSeconds);
}

export function vjwt(token: string): Promise<{ userId: string; congregationId?: string } | { error: string }> {
  return verifyJwt(token, TEST_SECRET);
}

export { env, createExecutionContext, waitOnExecutionContext, worker };

export async function runMigrations() {
  await applyMigrations(env.DB, MIGRATION_STATEMENTS);
}

export function setupEmails() {
  (globalThis as any).__testEmails = [];
}

export function getEmails(): any[] {
  return (globalThis as any).__testEmails || [];
}

export function getLastToken(): string {
  const emails = getEmails();
  const lastEmail = emails[emails.length - 1];
  const tokenMatch = lastEmail.html.match(/token=([a-f0-9]+)/);
  return tokenMatch![1];
}

export async function authRequest(email: string) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request("http://localhost/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return { res, ctx };
}

export async function authVerify(token: string, ctx?: ExecutionContext) {
  const c = ctx || createExecutionContext();
  const res = await worker.fetch(
    new Request("http://localhost/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
    env,
    c,
  );
  await waitOnExecutionContext(c);
  return { res, ctx: c };
}

export async function authedRequest(method: string, path: string, token: string, body?: any) {
  const ctx = createExecutionContext();
  const headers: Record<string, string> = { Cookie: `token=${token}`, Origin: "http://localhost:5173" };
  if (body) headers["Content-Type"] = "application/json";
  const res = await worker.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return { res, ctx, json: () => res.json() as Promise<Record<string, unknown> | Record<string, unknown>[]> };
}

export async function execSql(sql: string) {
  await env.DB.exec(sql);
}

export async function seedRoles(personId: string, congregationId: string, roles: string[]) {
  for (const roleType of roles) {
    const id = generateId();
    await env.DB.exec(
      `INSERT INTO role (id, person_id, congregation_id, role_type, created_at) VALUES ('${id}', '${personId}', '${congregationId}', '${roleType}', '${new Date().toISOString()}')`
    );
  }
}
