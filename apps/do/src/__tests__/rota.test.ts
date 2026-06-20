import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("CongregationDO — rota channel", () => {
  it("rotaUpdated RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("rota-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.rotaUpdated("2026-06-20", [{ id: "s1", role: "elder", status: "assigned" }])
    ).resolves.toBeUndefined();
  });

  it("slotAssigned RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("slot-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.slotAssigned({ id: "s1", role: "deacon", volunteerId: "p1", date: "2026-06-27" })
    ).resolves.toBeUndefined();
  });

  it("slotSwapRequested RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("swap-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.slotSwapRequested({ id: "s1", fromVolunteerId: "p1", date: "2026-06-27" })
    ).resolves.toBeUndefined();
  });
});
