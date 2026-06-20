import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("CongregationDO — board channel", () => {
  it("connectedCount returns zeros initially", async () => {
    const id = env.CONGREGATION_DO.idFromName("board-test");
    const stub = env.CONGREGATION_DO.get(id);
    const counts = await stub.connectedCount();
    expect(counts).toEqual({ board: 0, rota: 0, av: 0, notifications: 0 });
  });

  it("meetingUpdated RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("meeting-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.meetingUpdated({ id: "m1", status: "in_progress", date: "2026-06-20" })
    ).resolves.toBeUndefined();
  });

  it("decisionRecorded RPC completes", async () => {
    const id = env.CONGREGATION_DO.idFromName("decision-test");
    const stub = env.CONGREGATION_DO.get(id);
    await expect(
      stub.decisionRecorded("m1", { id: "d1", title: "Budget", voteOutcome: "approved" as const })
    ).resolves.toBeUndefined();
  });
});
