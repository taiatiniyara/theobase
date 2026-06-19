import { drizzle } from "drizzle-orm/d1";
import * as schema from "@theobase/db";

export function getDb(c: any): any {
  return drizzle(c.env.DB, { schema });
}
