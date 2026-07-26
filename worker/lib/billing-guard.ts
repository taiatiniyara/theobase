import { createDb } from "./db";
import { BillingRepo } from "../repos/billing";
import { json } from "./response";

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

    const readMethods = ["GET", "HEAD", "OPTIONS"];
    if (sub.status === "read_only" && !readMethods.includes(c.req.method)) {
      return json(
        { error: "Subscription payment required. Please update your billing details." },
        402
      );
    }

    await next();
  };
}
