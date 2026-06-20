import type { MiddlewareHandler } from "hono";

export function quorumGuard(minMembers: number = 3): MiddlewareHandler {
  return async (c, next) => {
    const congregationId = c.get("congregationId");
    if (!congregationId) {
      await next();
      return;
    }

    const db = (c.env as any).DB as D1Database;
    const roles = await db
      .prepare("SELECT COUNT(*) as count FROM role WHERE congregation_id = ? AND person_id IS NOT NULL AND role_type IN ('elder', 'clerk', 'treasurer', 'deacon', 'deaconess')")
      .bind(congregationId)
      .first<{ count: number }>();

    if (!roles || roles.count < minMembers) {
      return c.json({
        error: `Quorum not met. Minimum ${minMembers} board members required.`,
        detail: `Only ${roles?.count ?? 0} board members found.`,
      }, 400);
    }

    await next();
  };
}

export function auditTrailGuard(): MiddlewareHandler {
  return async (c, next) => {
    const db = (c.env as any).DB as D1Database;
    const congregationId = c.get("congregationId");

    if (!congregationId) {
      await next();
      return;
    }

    c.set("policyAuditTrail", async (expenseId: string) => {
      const expense = await db
        .prepare("SELECT board_decision_id FROM expense WHERE id = ?")
        .bind(expenseId)
        .first<{ board_decision_id: string | null }>();

      if (!expense) return { valid: false, reason: "Expense not found" };
      if (!expense.board_decision_id) {
        return { valid: false, reason: "Expense must be linked to a board decision per Church Manual policy" };
      }
      return { valid: true };
    });

    await next();
  };
}

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
