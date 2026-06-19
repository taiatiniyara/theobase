import { describe, it, expect } from "vitest";
import { lwwMerge, lwwSet, ORSet, detectRevisionFork } from "../src/crdt";

describe("LWW Register", () => {
  it("lwwMerge picks higher timestamp", () => {
    const a = { value: "alice", timestamp: 100, nodeId: "n1" };
    const b = { value: "bob", timestamp: 200, nodeId: "n2" };
    expect(lwwMerge(a, b).value).toBe("bob");
  });

  it("lwwMerge breaks timestamp ties by nodeId", () => {
    const a = { value: "alice", timestamp: 100, nodeId: "n2" };
    const b = { value: "bob", timestamp: 100, nodeId: "n1" };
    expect(lwwMerge(a, b).value).toBe("alice");
  });

  it("lwwSet creates register with current timestamp", () => {
    const reg = lwwSet("hello", "n1");
    expect(reg.value).toBe("hello");
    expect(reg.nodeId).toBe("n1");
    expect(reg.timestamp).toBeGreaterThan(0);
  });
});

describe("OR-Set", () => {
  it("add and has", () => {
    const set = new ORSet<string>();
    set.add("elder", "tag1");
    expect(set.has("elder")).toBe(true);
    expect(set.has("deacon")).toBe(false);
  });

  it("remove by tags", () => {
    const set = new ORSet<string>();
    set.add("elder", "tag1");
    set.add("elder", "tag2");
    set.remove("elder", ["tag1"]);
    expect(set.has("elder")).toBe(true);
    set.remove("elder", ["tag2"]);
    expect(set.has("elder")).toBe(false);
  });

  it("values returns all present elements", () => {
    const set = new ORSet<string>();
    set.add("elder", "t1");
    set.add("deacon", "t2");
    expect(set.values()).toContain("elder");
    expect(set.values()).toContain("deacon");
  });

  it("concurrent adds from different nodes are idempotent", () => {
    const set = new ORSet<string>();
    set.add("elder", "node1");
    set.add("elder", "node2");
    expect(set.values()).toEqual(["elder"]);
  });

  it("serialize and deserialize", () => {
    const set = new ORSet<string>();
    set.add("elder", "t1");
    set.add("deacon", "t2");
    set.remove("elder", ["t1"]);

    const json = set.toJSON();
    const restored = ORSet.fromJSON<string>(json);
    expect(restored.has("elder")).toBe(false);
    expect(restored.has("deacon")).toBe(true);
  });
});

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
