import { ChurchSyncDO } from "./durables/ChurchSyncDO";
import { ConferenceDO } from "./durables/ConferenceDO";
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
} from "./routes/members";
import {
  handleGetFunds,
  handleCreateFund,
  handleGetExpenseCategories,
  handleCreateExpenseCategory,
  handleGetBatches,
  handleGetBatch,
  handleCreateBatch,
  handleConfirmBatch,
  handleGetTransactions,
  handleCreateTransaction,
  handleCreateExpense,
  handleGetBudgets,
  handleCreateBudget,
  handleGetMonthlyReport,
} from "./routes/finance";
import { handleGetAuditLog, handleGetAuditByEntity } from "./routes/audit";

export { ChurchSyncDO, ConferenceDO };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (path === "/api/health") {
      return json({ status: "ok" });
    }

    // Auth routes
    if (path === "/api/auth/signup" && request.method === "POST") {
      return handleAuthSignup(request, env);
    }
    if (path === "/api/auth/login" && request.method === "POST") {
      return handleAuthLogin(request, env);
    }
    if (path === "/api/auth/refresh" && request.method === "POST") {
      return handleAuthRefresh(request, env);
    }
    if (path === "/api/auth/forgot-password" && request.method === "POST") {
      return handleForgotPassword(request, env);
    }
    if (path === "/api/auth/reset-password" && request.method === "POST") {
      return handleResetPassword(request, env);
    }
    if (path === "/api/auth/me" && request.method === "GET") {
      return handleGetMe(request, env);
    }

    // Conference routes
    if (path === "/api/conferences" && request.method === "GET") {
      return handleGetConferences(request, env);
    }
    if (path === "/api/conferences" && request.method === "POST") {
      return handleCreateConference(request, env);
    }
    const confUpdateMatch = path.match(/^\/api\/conferences\/(\d+)$/);
    if (confUpdateMatch && request.method === "PATCH") {
      return handleUpdateConference(request, env, Number(confUpdateMatch[1]));
    }

    // District routes
    const distListMatch = path.match(/^\/api\/conferences\/(\d+)\/districts$/);
    if (distListMatch && request.method === "GET") {
      return handleGetDistricts(request, env, Number(distListMatch[1]));
    }
    if (distListMatch && request.method === "POST") {
      return handleCreateDistrict(request, env, Number(distListMatch[1]));
    }
    const distUpdateMatch = path.match(/^\/api\/districts\/(\d+)$/);
    if (distUpdateMatch && request.method === "PATCH") {
      return handleUpdateDistrict(request, env, Number(distUpdateMatch[1]));
    }

    // Church routes
    const churchListMatch = path.match(/^\/api\/conferences\/(\d+)\/churches$/);
    if (churchListMatch && request.method === "GET") {
      return handleGetChurches(request, env, Number(churchListMatch[1]));
    }
    if (path === "/api/churches" && request.method === "POST") {
      return handleCreateChurch(request, env);
    }
    if (path === "/api/churches/bulk" && request.method === "POST") {
      return handleBulkCreateChurches(request, env);
    }
    const churchUpdateMatch = path.match(/^\/api\/churches\/(\d+)$/);
    if (churchUpdateMatch && request.method === "PATCH") {
      return handleUpdateChurch(request, env, Number(churchUpdateMatch[1]));
    }

    // User routes
    if (path === "/api/users" && request.method === "GET") {
      return handleGetUsers(request, env);
    }
    if (path === "/api/users/invite" && request.method === "POST") {
      return handleInviteUser(request, env);
    }
    if (path === "/api/users/bulk-invite" && request.method === "POST") {
      return handleBulkInviteUsers(request, env);
    }

    // Member routes
    if (path === "/api/members" && request.method === "GET") {
      return handleGetMembers(request, env);
    }
    if (path === "/api/members" && request.method === "POST") {
      return handleCreateMember(request, env);
    }
    const memberMatch = path.match(/^\/api\/members\/(\d+)$/);
    if (memberMatch && request.method === "GET") {
      return handleGetMember(request, env, Number(memberMatch[1]));
    }
    if (memberMatch && request.method === "PATCH") {
      return handleUpdateMember(request, env, Number(memberMatch[1]));
    }
    const removeMemberMatch = path.match(/^\/api\/members\/(\d+)\/remove$/);
    if (removeMemberMatch && request.method === "POST") {
      return handleRemoveMember(request, env, Number(removeMemberMatch[1]));
    }

    // Household routes
    if (path === "/api/households" && request.method === "GET") {
      return handleGetHouseholds(request, env);
    }
    if (path === "/api/households" && request.method === "POST") {
      return handleCreateHousehold(request, env);
    }
    const householdMatch = path.match(/^\/api\/households\/(\d+)$/);
    if (householdMatch && request.method === "PATCH") {
      return handleUpdateHousehold(request, env, Number(householdMatch[1]));
    }

    // Position routes
    if (path === "/api/positions" && request.method === "GET") {
      return handleGetPositions(request, env);
    }
    if (path === "/api/positions" && request.method === "POST") {
      return handleCreatePosition(request, env);
    }

    // Member position routes
    const memberPosMatch = path.match(/^\/api\/members\/(\d+)\/positions$/);
    if (memberPosMatch && request.method === "POST") {
      return handleAssignPosition(request, env, Number(memberPosMatch[1]));
    }
    const memberPosDelMatch = path.match(/^\/api\/members\/(\d+)\/positions\/(\d+)$/);
    if (memberPosDelMatch && request.method === "DELETE") {
      return handleRemovePosition(
        request,
        env,
        Number(memberPosDelMatch[1]),
        Number(memberPosDelMatch[2])
      );
    }

    // Transfer routes
    if (path === "/api/transfers" && request.method === "GET") {
      return handleGetTransfers(request, env);
    }
    if (path === "/api/transfers" && request.method === "POST") {
      return handleInitiateTransfer(request, env);
    }
    const transferApproveMatch = path.match(/^\/api\/transfers\/(\d+)\/approve$/);
    if (transferApproveMatch && request.method === "POST") {
      return handleApproveTransfer(request, env, Number(transferApproveMatch[1]));
    }
    const transferAcceptMatch = path.match(/^\/api\/transfers\/(\d+)\/accept$/);
    if (transferAcceptMatch && request.method === "POST") {
      return handleAcceptTransfer(request, env, Number(transferAcceptMatch[1]));
    }
    const transferRejectMatch = path.match(/^\/api\/transfers\/(\d+)\/reject$/);
    if (transferRejectMatch && request.method === "POST") {
      return handleRejectTransfer(request, env, Number(transferRejectMatch[1]));
    }

    // Finance — funds
    if (path === "/api/funds" && request.method === "GET") {
      return handleGetFunds(request, env);
    }
    if (path === "/api/funds" && request.method === "POST") {
      return handleCreateFund(request, env);
    }

    // Finance — expense categories
    if (path === "/api/expense-categories" && request.method === "GET") {
      return handleGetExpenseCategories(request, env);
    }
    if (path === "/api/expense-categories" && request.method === "POST") {
      return handleCreateExpenseCategory(request, env);
    }

    // Finance — offering batches
    if (path === "/api/finance/batches" && request.method === "GET") {
      return handleGetBatches(request, env);
    }
    if (path === "/api/finance/batches" && request.method === "POST") {
      return handleCreateBatch(request, env);
    }
    const batchMatch = path.match(/^\/api\/finance\/batches\/(\d+)$/);
    if (batchMatch && request.method === "GET") {
      return handleGetBatch(request, env, Number(batchMatch[1]));
    }
    const batchConfirmMatch = path.match(/^\/api\/finance\/batches\/(\d+)\/confirm$/);
    if (batchConfirmMatch && request.method === "POST") {
      return handleConfirmBatch(request, env, Number(batchConfirmMatch[1]));
    }

    // Finance — transactions
    if (path === "/api/finance/transactions" && request.method === "GET") {
      return handleGetTransactions(request, env);
    }
    if (path === "/api/finance/transactions" && request.method === "POST") {
      return handleCreateTransaction(request, env);
    }
    if (path === "/api/finance/expenses" && request.method === "POST") {
      return handleCreateExpense(request, env);
    }

    // Finance — budgets
    if (path === "/api/finance/budgets" && request.method === "GET") {
      return handleGetBudgets(request, env);
    }
    if (path === "/api/finance/budgets" && request.method === "POST") {
      return handleCreateBudget(request, env);
    }

    // Finance — reports
    if (path === "/api/finance/report/monthly" && request.method === "GET") {
      return handleGetMonthlyReport(request, env);
    }

    // Audit routes
    if (path === "/api/audit" && request.method === "GET") {
      return handleGetAuditLog(request, env);
    }
    const auditEntityMatch = path.match(/^\/api\/audit\/(.+)\/(\d+)$/);
    if (auditEntityMatch && request.method === "GET") {
      return handleGetAuditByEntity(
        request,
        env,
        auditEntityMatch[1]!,
        Number(auditEntityMatch[2])
      );
    }

    // DO routes (existing)
    if (path.startsWith("/api/sync/") && env.CHURCH_SYNC_DO) {
      const churchParam = url.searchParams.get("church_id") || "default";
      const doId = env.CHURCH_SYNC_DO.idFromName(churchParam);
      const stub = env.CHURCH_SYNC_DO.get(doId);

      if (path === "/api/sync/state" && request.method === "GET") {
        const state = await stub.getSyncState(churchParam);
        return json(state);
      }

      if (path === "/api/sync/register" && request.method === "POST") {
        const body: { userId: string } = await request.json();
        await stub.registerSync(churchParam, body.userId);
        return json({ success: true });
      }
    }

    if (path.startsWith("/api/conference/") && env.CONFERENCE_DO) {
      const doId = env.CONFERENCE_DO.idFromName("main");
      const stub = env.CONFERENCE_DO.get(doId);

      if (path === "/api/conference/info" && request.method === "GET") {
        const info = await stub.getInfo();
        return json(info);
      }
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
  },
};
