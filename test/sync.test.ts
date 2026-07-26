import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";
import { SYNC_READ_LIMIT, SYNC_WRITE_LIMIT } from "../worker/lib/rate-limit";

describe("sync rate limits", () => {
  it("SYNC_READ_LIMIT is 300/min", () => {
    expect(SYNC_READ_LIMIT.maxRequests).toBe(300);
    expect(SYNC_READ_LIMIT.windowMs).toBe(60_000);
  });

  it("SYNC_WRITE_LIMIT is 60/min", () => {
    expect(SYNC_WRITE_LIMIT.maxRequests).toBe(60);
    expect(SYNC_WRITE_LIMIT.windowMs).toBe(60_000);
  });

  it("/api/sync/state requires auth", async () => {
    const request = new Request("http://localhost/api/sync/state?church_id=test");
    const response = await SELF.fetch(request);

    expect(response.status).toBe(401);
  });

  it("/api/sync/register requires auth", async () => {
    const request = new Request("http://localhost/api/sync/register?church_id=test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "1" }),
    });
    const response = await SELF.fetch(request);

    expect(response.status).toBe(401);
  });
});
