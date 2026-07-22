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
