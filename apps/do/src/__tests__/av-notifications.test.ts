import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("CongregationDO — av and notifications channels", () => {
  it("orderUpdated RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("av-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.orderUpdated("2026-06-20", [{ type: "hymn", title: "Amazing Grace" }])
    ).resolves.toBeUndefined();
  });

  it("slideChanged RPC completes with label", async () => {
    const id = env.CONGREGATION_DO.idFromName("slide-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(stub.slideChanged(3, "Scripture Reading")).resolves.toBeUndefined();
  });

  it("notifyUser RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("notify-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(stub.notifyUser("u1", "Receipt approved")).resolves.toBeUndefined();
  });

  it("notifyCongregation RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("broadcast-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(stub.notifyCongregation("Meeting in 30 min")).resolves.toBeUndefined();
  });
});
