import { describe, it, expect } from "vitest";
import {
  applyMigrations,
  rollbackMigrations,
  MIGRATION_STATEMENTS,
} from "@theobase/db";
import { env } from "./test-helpers";

describe("migrations", () => {
  it("up → down → up cycle succeeds", async () => {
    // Up: apply all migrations
    await applyMigrations(env.DB, MIGRATION_STATEMENTS);

    // Verify a table exists after up
    const result = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='congregation'"
    ).first();
    expect(result).not.toBeNull();

    // Down: rollback all migrations
    await rollbackMigrations(env.DB);

    // Verify the table is gone
    const afterDown = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='congregation'"
    ).first();
    expect(afterDown).toBeNull();

    // Up again: re-apply after rollback
    await applyMigrations(env.DB, MIGRATION_STATEMENTS);

    // Verify table is back
    const afterReUp = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='congregation'"
    ).first();
    expect(afterReUp).not.toBeNull();
  });
});
