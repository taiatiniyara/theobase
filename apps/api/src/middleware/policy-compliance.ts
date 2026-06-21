import type { MiddlewareHandler } from "hono";

export function policyGuardian(): MiddlewareHandler {
  return async (c, next) => {
    const method = c.req.method;
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      await next();
      return;
    }

    const db = (c.env as any).DB as D1Database;
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      await next();
      return;
    }

    const path = c.req.path;

    if (path.includes("/board/meetings") && method === "POST") {
      const boardMembers = await db
        .prepare("SELECT COUNT(*) as count FROM role WHERE congregation_id = ? AND person_id IS NOT NULL AND role_type IN ('elder', 'clerk', 'treasurer', 'deacon', 'deaconess')")
        .bind(congregationId)
        .first<{ count: number }>();

      if (!boardMembers || boardMembers.count < 3) {
        return c.json({
          error: "Church Manual compliance: At least 3 board members required to convene a board meeting.",
          current: boardMembers?.count ?? 0,
          required: 3,
        }, 400);
      }
    }

    if (path === "/treasury/expenses" && method === "POST") {
      const body = await c.req.json().catch(() => ({}));
      if (!body.boardDecisionId) {
        return c.json({
          error: "Church Manual compliance: Every expense must be authorized by a board decision.",
        }, 400);
      }
    }

    if (path.includes("/discipline/cases") && method === "POST") {
      const body = await c.req.json().catch(() => ({}));
      if (!body.boardMeetingId) {
        return c.json({
          error: "Church Manual compliance: Discipline cases must be discussed in a board meeting.",
        }, 400);
      }
    }

    await next();
  };
}
