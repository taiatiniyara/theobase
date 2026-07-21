import { addRoute, router, json } from "./lib/router";
import { register, login, refresh } from "./modules/auth/handler";
import { listOrgs, createOrg, getOrg, updateOrg } from "./modules/org/handler";
import {
  listMembers,
  getMember,
  createMember,
  updateMember,
} from "./modules/member/handler";
import {
  getMe,
  updateMe,
  submitGiving,
  requestTransfer,
  rollConfirm,
} from "./modules/member/self-service";
import {
  listTransactions,
  createTransaction,
  getTransaction,
  verifyTransaction,
  transactionStats,
} from "./modules/finance/handler";
import { authMiddleware } from "./modules/middleware/auth";

addRoute("POST", "/api/v1/auth/register", register);
addRoute("POST", "/api/v1/auth/login", login);
addRoute("POST", "/api/v1/auth/refresh", refresh);

addRoute("GET", "/api/v1/orgs", listOrgs, [authMiddleware]);
addRoute("POST", "/api/v1/orgs", createOrg, [authMiddleware]);
addRoute("GET", "/api/v1/orgs/:id", getOrg, [authMiddleware]);
addRoute("PATCH", "/api/v1/orgs/:id", updateOrg, [authMiddleware]);

addRoute("GET", "/api/v1/churches/:churchId/members", listMembers, [
  authMiddleware,
]);
addRoute("POST", "/api/v1/churches/:churchId/members", createMember, [
  authMiddleware,
]);
addRoute("GET", "/api/v1/churches/:churchId/members/me", getMe, [
  authMiddleware,
]);
addRoute("PATCH", "/api/v1/churches/:churchId/members/me", updateMe, [
  authMiddleware,
]);
addRoute("GET", "/api/v1/churches/:churchId/members/:id", getMember, [
  authMiddleware,
]);
addRoute("PATCH", "/api/v1/churches/:churchId/members/:id", updateMember, [
  authMiddleware,
]);
addRoute("POST", "/api/v1/churches/:churchId/giving", submitGiving, [
  authMiddleware,
]);
addRoute(
  "POST",
  "/api/v1/churches/:churchId/members/:id/transfer-request",
  requestTransfer,
  [authMiddleware],
);
addRoute("POST", "/api/v1/churches/:churchId/roll-confirm", rollConfirm, [
  authMiddleware,
]);

addRoute(
  "GET",
  "/api/v1/churches/:churchId/transactions/stats",
  transactionStats,
  [authMiddleware],
);
addRoute("GET", "/api/v1/churches/:churchId/transactions", listTransactions, [
  authMiddleware,
]);
addRoute("POST", "/api/v1/churches/:churchId/transactions", createTransaction, [
  authMiddleware,
]);
addRoute(
  "POST",
  "/api/v1/churches/:churchId/transactions/:id/verify",
  verifyTransaction,
  [authMiddleware],
);
addRoute("GET", "/api/v1/churches/:churchId/transactions/:id", getTransaction, [
  authMiddleware,
]);

addRoute("GET", "/api/v1/health", async (ctx) => {
  try {
    await ctx.db.prepare("SELECT 1").first();
    return json({ status: "ok", database: "connected" });
  } catch {
    return json({ status: "error", database: "error" }, 503);
  }
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return router(request, env.DB, env.JWT_SECRET);
  },
};
