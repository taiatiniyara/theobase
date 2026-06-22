import type { MiddlewareHandler } from "hono";
import { getDb } from "./get-db";
import { subscription } from "@theobase/db";
import { eq } from "drizzle-orm";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

export function requireSubscription(): MiddlewareHandler {
  return async (c, next) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      return c.json({ error: "No congregation" }, 400);
    }
    const db = getDb(c);
    const [sub] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.congregationId, congregationId))
      .limit(1);
    if (!sub || !ACTIVE_STATUSES.has(sub.status)) {
      return c.json(
        {
          error: "Active subscription required",
          code: "SUBSCRIPTION_REQUIRED",
        },
        402
      );
    }
    await next();
  };
}
