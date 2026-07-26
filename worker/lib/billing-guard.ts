import { createDb } from "./db";
import { BillingRepo } from "../repos/billing";
import { json } from "./response";

const cache = new Map<number, { status: string; ts: number }>();
const CACHE_TTL_MS = 60_000;

export function billingGuard() {
  return async (
    c: {
      req: { raw: Request; method: string };
      env: Env;
      get: (k: string) => { conferenceId?: number } | undefined;
    },
    next: () => Promise<void>
  ) => {
    const auth = c.get("auth");
    if (!auth?.conferenceId) {
      await next();
      return;
    }

    const cached = cache.get(auth.conferenceId);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      if (cached.status === "read_only" && !["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
        return json(
          { error: "Subscription payment required. Please update your billing details." },
          402
        );
      }
      await next();
      return;
    }

    const db = createDb(c.env);
    const repo = new BillingRepo(db);
    let sub;
    try {
      sub = await repo.getSubscription(auth.conferenceId);
    } catch {
      await next();
      return;
    }

    if (!sub) {
      cache.set(auth.conferenceId, { status: "active", ts: Date.now() });
      await next();
      return;
    }

    const now = new Date();
    const pastDueDate = new Date(sub.updated_at);
    pastDueDate.setDate(pastDueDate.getDate() + 7);

    if (sub.status === "past_due" && now > pastDueDate) {
      await repo.updateSubscription(sub.conference_id, { status: "read_only" });
      sub.status = "read_only";
    }

    cache.set(auth.conferenceId, { status: sub.status, ts: Date.now() });

    if (sub.status === "read_only" && !["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
      return json(
        { error: "Subscription payment required. Please update your billing details." },
        402
      );
    }

    await next();
  };
}
