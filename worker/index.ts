import { ChurchSyncDO } from "./durables/ChurchSyncDO";
import { ConferenceDO } from "./durables/ConferenceDO";

export { ChurchSyncDO, ConferenceDO };

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname.startsWith("/api/sync/") && env.CHURCH_SYNC_DO) {
      const churchParam = url.searchParams.get("church_id") || "default";
      const doId = env.CHURCH_SYNC_DO.idFromName(churchParam);
      const stub = env.CHURCH_SYNC_DO.get(doId);

      if (url.pathname === "/api/sync/state" && request.method === "GET") {
        const state = await stub.getSyncState(churchParam);
        return new Response(JSON.stringify(state), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      if (url.pathname === "/api/sync/register" && request.method === "POST") {
        const body: { userId: string } = await request.json();
        await stub.registerSync(churchParam, body.userId);
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    if (url.pathname.startsWith("/api/conference/") && env.CONFERENCE_DO) {
      const doId = env.CONFERENCE_DO.idFromName("main");
      const stub = env.CONFERENCE_DO.get(doId);

      if (url.pathname === "/api/conference/info" && request.method === "GET") {
        const info = await stub.getConferenceInfo();
        return new Response(JSON.stringify(info), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
  },
};
