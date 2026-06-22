import { describe, it, expect } from "vitest";
import { detectRevisionFork } from "../src/crdt";

describe("Revision Fork", () => {
  it("detects fork when both edit same base", () => {
    const base = { version: 1, content: "hello" };
    const local = { version: 2, content: "hello world", nodeId: "n1" };
    const remote = { version: 2, content: "hello there", nodeId: "n2" };

    const fork = detectRevisionFork(base, local, remote);
    expect(fork).not.toBeNull();
    expect(fork!.ours.content).toBe("hello world");
    expect(fork!.theirs.content).toBe("hello there");
  });

  it("returns null when no fork (sequential edits by same node)", () => {
    const base = { version: 1, content: "hello" };
    const local = { version: 2, content: "hello world", nodeId: "n1" };
    const remote = { version: 3, content: "hello world!!!", nodeId: "n1" };

    const fork = detectRevisionFork(base, local, remote);
    expect(fork).toBeNull();
  });
});
