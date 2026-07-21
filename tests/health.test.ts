import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("GET /api/v1/health", () => {
  it("returns ok with database connected", async () => {
    const res = await SELF.fetch("https://theobase.test/api/v1/health");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });
});
