import { SELF, env } from "cloudflare:test";
import { FULL_SCHEMA, SCHEMA_ALTERS } from "./schema";

export interface TestContext {
  accessToken: string;
  conferenceId: number;
  userId: number;
  churchId: number;
}

export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function jsonAuthHeaders(token: string): Record<string, string> {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export async function setupTestContext(role = "sysadmin" as string): Promise<TestContext> {
  await env.DB.exec(FULL_SCHEMA);
  for (const alter of SCHEMA_ALTERS) {
    await env.DB.exec(alter);
  }

  const signupRes = await SELF.fetch("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `${role}@test.com`,
      password: "password123",
      fullName: "Test Admin",
      conferenceName: "Test Conference",
    }),
  });
  const signupBody = (await signupRes.json()) as { accessToken: string };
  const accessToken = signupBody.accessToken;

  const meRes = await SELF.fetch("http://localhost/api/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const me = (await meRes.json()) as { id: number; conference: { id: number } };
  const userId = me.id;
  const conferenceId = me.conference.id;

  const churchRes = await SELF.fetch("http://localhost/api/churches", {
    method: "POST",
    headers: jsonAuthHeaders(accessToken),
    body: JSON.stringify({
      name: "Test Church",
      type: "organized",
      parentId: conferenceId,
      parentType: "conference",
    }),
  });
  const churchBody = (await churchRes.json()) as { id: number };
  const churchId = churchBody.id;

  return { accessToken, conferenceId, userId, churchId };
}

export async function createSecondChurch(
  token: string,
  conferenceId: number
): Promise<{ churchId2: number }> {
  const res = await SELF.fetch("http://localhost/api/churches", {
    method: "POST",
    headers: jsonAuthHeaders(token),
    body: JSON.stringify({
      name: "Second Church",
      type: "organized",
      parentId: conferenceId,
      parentType: "conference",
    }),
  });
  const body = (await res.json()) as { id: number };
  return { churchId2: body.id };
}
