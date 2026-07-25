import { request, APIRequestContext } from "@playwright/test";

const API_BASE = "http://localhost:8787";

export async function createApiContext(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: API_BASE });
}

export async function setupUser(
  email: string,
  password: string,
  fullName: string,
  conferenceName?: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const ctx = await createApiContext();
  const res = await ctx.post("/api/auth/signup", {
    data: { email, password, fullName, conferenceName },
    headers: { "X-Theobase-Test-Bypass": "email-verification" },
  });
  const body = await res.json();
  return body as { accessToken: string; refreshToken: string; userId: string };
}
