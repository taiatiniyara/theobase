import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("theobase worker", () => {
  it("returns health check", async () => {
    const request = new Request("http://localhost/api/health");
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
    const body: { status: string } = await response.json();
    expect(body.status).toBe("ok");
  });

  it("returns 200 for SPA catch-all on unknown routes", async () => {
    const request = new Request("http://localhost/nonexistent");
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
  });

  it("returns 401 for unknown api routes (auth required)", async () => {
    const request = new Request("http://localhost/api/nonexistent");
    const response = await SELF.fetch(request);

    expect(response.status).toBe(401);
  });
});
