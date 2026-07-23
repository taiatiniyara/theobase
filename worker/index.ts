import { Hono } from "hono";
import { cors } from "hono/cors";
import { ChurchSyncDO } from "./durables/ChurchSyncDO";
import { ConferenceDO } from "./durables/ConferenceDO";
import { checkRateLimitAsync } from "./lib/rate-limit";
import { json } from "./lib/response";
import {
  handleAuthSignup,
  handleAuthLogin,
  handleAuthRefresh,
  handleForgotPassword,
  handleResetPassword,
} from "./routes/auth";
import {
  handleGetConferences,
  handleCreateConference,
  handleUpdateConference,
  handleGetDistricts,
  handleCreateDistrict,
  handleUpdateDistrict,
  handleGetChurches,
  handleCreateChurch,
  handleUpdateChurch,
  handleBulkCreateChurches,
} from "./routes/org";
import {
  handleInviteUser,
  handleGetUsers,
  handleBulkInviteUsers,
  handleGetMe,
  handleUpdateUser,
} from "./routes/users";
import {
  handleGetMembers,
  handleGetMember,
  handleCreateMember,
  handleUpdateMember,
  handleRemoveMember,
  handleGetHouseholds,
  handleCreateHousehold,
  handleUpdateHousehold,
  handleGetPositions,
  handleCreatePosition,
  handleAssignPosition,
  handleRemovePosition,
  handleGetTransfers,
  handleInitiateTransfer,
  handleApproveTransfer,
  handleAcceptTransfer,
  handleRejectTransfer,
  handleOverrideTransfer,
  handleGetSelfMember,
  handleUpdateSelfMember,
  handleMemberGiving,
  handleMemberTransfer,
  handleListDeclarations,
  handleVerifyDeclaration,
  handleRejectDeclaration,
} from "./routes/members";
import {
  handleGetFunds,
  handleCreateFund,
  handleGetExpenseCategories,
  handleCreateExpenseCategory,
  handleUpdateExpenseCategory,
  handleGetBatches,
  handleGetBatch,
  handleCreateBatch,
  handleConfirmBatch,
  handleGetTransactions,
  handleCreateTransaction,
  handleCreateExpense,
  handleGetBudgets,
  handleCreateBudget,
  handleApproveBudget,
  handleGetBudgetTemplates,
  handleCreateBudgetTemplate,
  handleGetMonthlyReport,
} from "./routes/finance";
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllRead,
} from "./routes/notifications";
import { handleGetAuditLog, handleGetAuditByEntity } from "./routes/audit";
import { handleGetQuarterlyReport } from "./routes/reports";
import {
  handleGetConferenceTithe,
  handleReceiveTithe,
  handleChurchBalance,
  handleTitheReport,
} from "./routes/reconciliation";
import {
  handleConferenceDashboard,
  handleDistrictDashboard,
  handleGlobalDashboard,
} from "./routes/conference";
import {
  handleRecordAttendance,
  handleGetAttendance,
  handleGetAttendanceStats,
} from "./routes/attendance";
import { handleGetContributions, handleGetContributionStatement } from "./routes/contributions";

export { ChurchSyncDO, ConferenceDO };

type HonoEnv = {
  Bindings: Env;
};

const app = new Hono<HonoEnv>();

app.use("*", cors());

function rateLimit(key: string) {
  return async (c: { req: { raw: Request }; env: Env }, next: () => Promise<void>) => {
    const limit = await checkRateLimitAsync(c.req.raw, c.env, key);
    if (limit) return limit;
    await next();
  };
}

app.get("/api/health", async (c) => {
  try {
    if (c.env.DB) {
      await c.env.DB.prepare("SELECT 1").run();
      return json({ status: "ok", database: "connected" });
    }
    return json({ status: "ok", database: "unavailable" });
  } catch {
    return json({ status: "error", database: "error" }, 503);
  }
});

app.post("/api/auth/signup", rateLimit("auth:signup"), (c) => handleAuthSignup(c.req.raw, c.env));
app.post("/api/auth/login", rateLimit("auth:login"), (c) => handleAuthLogin(c.req.raw, c.env));
app.post("/api/auth/refresh", (c) => handleAuthRefresh(c.req.raw, c.env));
app.post("/api/auth/forgot-password", rateLimit("auth:forgot-password"), (c) =>
  handleForgotPassword(c.req.raw, c.env)
);
app.post("/api/auth/reset-password", rateLimit("auth:reset-password"), (c) =>
  handleResetPassword(c.req.raw, c.env)
);
app.get("/api/auth/me", (c) => handleGetMe(c.req.raw, c.env));

app.get("/api/conferences", (c) => handleGetConferences(c.req.raw, c.env));
app.post("/api/conferences", (c) => handleCreateConference(c.req.raw, c.env));
app.patch("/api/conferences/:id", (c) =>
  handleUpdateConference(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/conferences/:confId/districts", (c) =>
  handleGetDistricts(c.req.raw, c.env, Number(c.req.param("confId")))
);
app.post("/api/conferences/:confId/districts", (c) =>
  handleCreateDistrict(c.req.raw, c.env, Number(c.req.param("confId")))
);
app.patch("/api/districts/:id", (c) =>
  handleUpdateDistrict(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/conferences/:confId/churches", (c) =>
  handleGetChurches(c.req.raw, c.env, Number(c.req.param("confId")))
);
app.post("/api/churches", (c) => handleCreateChurch(c.req.raw, c.env));
app.post("/api/churches/bulk", (c) => handleBulkCreateChurches(c.req.raw, c.env));
app.patch("/api/churches/:id", (c) =>
  handleUpdateChurch(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/users", (c) => handleGetUsers(c.req.raw, c.env));
app.post("/api/users/invite", (c) => handleInviteUser(c.req.raw, c.env));
app.post("/api/users/bulk-invite", (c) => handleBulkInviteUsers(c.req.raw, c.env));
app.patch("/api/users/:id", (c) => handleUpdateUser(c.req.raw, c.env, Number(c.req.param("id"))));

app.get("/api/members", (c) => handleGetMembers(c.req.raw, c.env));
app.post("/api/members", (c) => handleCreateMember(c.req.raw, c.env));
app.get("/api/members/:id", (c) => handleGetMember(c.req.raw, c.env, Number(c.req.param("id"))));
app.patch("/api/members/:id", (c) =>
  handleUpdateMember(c.req.raw, c.env, Number(c.req.param("id")))
);
app.post("/api/members/:id/remove", (c) =>
  handleRemoveMember(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/households", (c) => handleGetHouseholds(c.req.raw, c.env));
app.post("/api/households", (c) => handleCreateHousehold(c.req.raw, c.env));
app.patch("/api/households/:id", (c) =>
  handleUpdateHousehold(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/positions", (c) => handleGetPositions(c.req.raw, c.env));
app.post("/api/positions", (c) => handleCreatePosition(c.req.raw, c.env));
app.post("/api/members/:memberId/positions", (c) =>
  handleAssignPosition(c.req.raw, c.env, Number(c.req.param("memberId")))
);
app.delete("/api/members/:memberId/positions/:posId", (c) =>
  handleRemovePosition(
    c.req.raw,
    c.env,
    Number(c.req.param("memberId")),
    Number(c.req.param("posId"))
  )
);

app.get("/api/transfers", (c) => handleGetTransfers(c.req.raw, c.env));
app.post("/api/transfers", (c) => handleInitiateTransfer(c.req.raw, c.env));
app.post("/api/transfers/:id/approve", (c) =>
  handleApproveTransfer(c.req.raw, c.env, Number(c.req.param("id")))
);
app.post("/api/transfers/:id/accept", (c) =>
  handleAcceptTransfer(c.req.raw, c.env, Number(c.req.param("id")))
);
app.post("/api/transfers/:id/reject", (c) =>
  handleRejectTransfer(c.req.raw, c.env, Number(c.req.param("id")))
);
app.post("/api/transfers/:id/override", (c) =>
  handleOverrideTransfer(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/churches/:churchId/members/me", (c) =>
  handleGetSelfMember(c.req.raw, c.env, Number(c.req.param("churchId")))
);
app.patch("/api/churches/:churchId/members/me", (c) =>
  handleUpdateSelfMember(c.req.raw, c.env, Number(c.req.param("churchId")))
);

app.post("/api/churches/:churchId/members/:memberId/giving", (c) =>
  handleMemberGiving(
    c.req.raw,
    c.env,
    Number(c.req.param("churchId")),
    Number(c.req.param("memberId"))
  )
);
app.post("/api/churches/:churchId/members/:memberId/transfer-request", (c) =>
  handleMemberTransfer(
    c.req.raw,
    c.env,
    Number(c.req.param("churchId")),
    Number(c.req.param("memberId"))
  )
);

app.get("/api/churches/:churchId/declarations", (c) =>
  handleListDeclarations(c.req.raw, c.env, Number(c.req.param("churchId")))
);
app.post("/api/churches/:churchId/declarations/:declId/verify", (c) =>
  handleVerifyDeclaration(
    c.req.raw,
    c.env,
    Number(c.req.param("churchId")),
    Number(c.req.param("declId"))
  )
);
app.post("/api/churches/:churchId/declarations/:declId/reject", (c) =>
  handleRejectDeclaration(
    c.req.raw,
    c.env,
    Number(c.req.param("churchId")),
    Number(c.req.param("declId"))
  )
);

app.get("/api/funds", (c) => handleGetFunds(c.req.raw, c.env));
app.post("/api/funds", (c) => handleCreateFund(c.req.raw, c.env));

app.get("/api/expense-categories", (c) => handleGetExpenseCategories(c.req.raw, c.env));
app.post("/api/expense-categories", (c) => handleCreateExpenseCategory(c.req.raw, c.env));
app.patch("/api/expense-categories/:id", (c) =>
  handleUpdateExpenseCategory(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/finance/batches", (c) => handleGetBatches(c.req.raw, c.env));
app.post("/api/finance/batches", (c) => handleCreateBatch(c.req.raw, c.env));
app.get("/api/finance/batches/:id", (c) =>
  handleGetBatch(c.req.raw, c.env, Number(c.req.param("id")))
);
app.post("/api/finance/batches/:id/confirm", (c) =>
  handleConfirmBatch(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/finance/transactions", (c) => handleGetTransactions(c.req.raw, c.env));
app.post("/api/finance/transactions", (c) => handleCreateTransaction(c.req.raw, c.env));
app.post("/api/finance/expenses", (c) => handleCreateExpense(c.req.raw, c.env));

app.get("/api/finance/budgets", (c) => handleGetBudgets(c.req.raw, c.env));
app.post("/api/finance/budgets", (c) => handleCreateBudget(c.req.raw, c.env));
app.post("/api/finance/budgets/:id/approve", (c) =>
  handleApproveBudget(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/finance/budget-templates", (c) => handleGetBudgetTemplates(c.req.raw, c.env));
app.post("/api/finance/budget-templates", (c) => handleCreateBudgetTemplate(c.req.raw, c.env));

app.get("/api/finance/report/monthly", (c) => handleGetMonthlyReport(c.req.raw, c.env));
app.get("/api/report/quarterly", (c) => handleGetQuarterlyReport(c.req.raw, c.env));

app.get("/api/conference/tithe", (c) => handleGetConferenceTithe(c.req.raw, c.env));
app.post("/api/conference/tithe/receive", (c) => handleReceiveTithe(c.req.raw, c.env));
app.get("/api/conference/tithe/report", (c) => handleTitheReport(c.req.raw, c.env));
app.on(["GET", "POST"], "/api/church/balance", (c) => handleChurchBalance(c.req.raw, c.env));

app.get("/api/notifications", (c) => handleGetNotifications(c.req.raw, c.env));
app.post("/api/notifications/read-all", (c) => handleMarkAllRead(c.req.raw, c.env));
app.post("/api/notifications/:id/read", (c) =>
  handleMarkNotificationRead(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/audit", (c) => handleGetAuditLog(c.req.raw, c.env));
app.get("/api/audit/:entityType/:entityId", (c) =>
  handleGetAuditByEntity(
    c.req.raw,
    c.env,
    c.req.param("entityType"),
    Number(c.req.param("entityId"))
  )
);

app.post("/api/attendance", (c) => handleRecordAttendance(c.req.raw, c.env));
app.get("/api/attendance", (c) => handleGetAttendance(c.req.raw, c.env));
app.get("/api/attendance/stats", (c) => handleGetAttendanceStats(c.req.raw, c.env));

app.get("/api/conference/dashboard", (c) => handleConferenceDashboard(c.req.raw, c.env));
app.get("/api/conference/district-dashboard", (c) => handleDistrictDashboard(c.req.raw, c.env));
app.get("/api/conference/global-dashboard", (c) => handleGlobalDashboard(c.req.raw, c.env));

app.get("/api/contributions", (c) => handleGetContributions(c.req.raw, c.env));
app.get("/api/contributions/:id", (c) =>
  handleGetContributionStatement(c.req.raw, c.env, Number(c.req.param("id")))
);

app.get("/api/sync/state", async (c) => {
  if (!c.env.CHURCH_SYNC_DO) return c.notFound();
  const churchParam = c.req.query("church_id") || "default";
  const doId = c.env.CHURCH_SYNC_DO.idFromName(churchParam);
  const stub = c.env.CHURCH_SYNC_DO.get(doId);
  const state = await stub.getSyncState(churchParam);
  return json(state);
});

app.post("/api/sync/register", async (c) => {
  if (!c.env.CHURCH_SYNC_DO) return c.notFound();
  const churchParam = c.req.query("church_id") || "default";
  const body = await c.req.json<{
    userId: string;
    operationType?: string;
    clientUuid?: string;
    payload?: string;
  }>();
  const doId = c.env.CHURCH_SYNC_DO.idFromName(churchParam);
  const stub = c.env.CHURCH_SYNC_DO.get(doId);
  await stub.registerSync(churchParam, body.userId);
  if (body.operationType && body.clientUuid) {
    await stub.applyOfflineOperation(churchParam, body.userId, {
      type: body.operationType,
      payload: body.payload ?? "{}",
      clientUuid: body.clientUuid,
    });
  }
  return json({ success: true });
});

app.get("/api/conference/info", async (c) => {
  if (!c.env.CONFERENCE_DO) return c.notFound();
  const doId = c.env.CONFERENCE_DO.idFromName("main");
  const stub = c.env.CONFERENCE_DO.get(doId);
  const info = await stub.getInfo();
  return json(info);
});

export default app;
