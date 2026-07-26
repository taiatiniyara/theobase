import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "../schema";

export function createDb(env: { DB: D1Database }, _conferenceId?: number) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof createDb>;
