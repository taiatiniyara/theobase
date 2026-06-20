import { drizzle } from "drizzle-orm/d1";
import * as schema from "@theobase/db";

export function getDb(c: any): any {
  const db = c.env?.DB;
  if (!db) throw new Error("D1 binding (DB) not configured");
  return drizzle(db, { schema });
}
