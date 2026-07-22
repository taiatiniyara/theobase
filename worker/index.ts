import { ChurchSyncDO } from "./durables/ChurchSyncDO";
import { ConferenceDO } from "./durables/ConferenceDO";

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

    if (url.pathname === "/api/health") {
      return json({ status: "ok" });
    }

    if (url.pathname.startsWith("/api/sync/") && env.CHURCH_SYNC_DO) {
      const churchParam = url.searchParams.get("church_id") || "default";
      const doId = env.CHURCH_SYNC_DO.idFromName(churchParam);
      const stub = env.CHURCH_SYNC_DO.get(doId);

      if (url.pathname === "/api/sync/state" && request.method === "GET") {
        const state = await stub.getSyncState(churchParam);
        return json(state);
      }

      if (url.pathname === "/api/sync/register" && request.method === "POST") {
        const body: { userId: string } = await request.json();
        await stub.registerSync(churchParam, body.userId);
        return json({ success: true });
      }
    }

    if (url.pathname.startsWith("/api/conference/") && env.CONFERENCE_DO) {
      const doId = env.CONFERENCE_DO.idFromName("main");
      const stub = env.CONFERENCE_DO.get(doId);

      if (url.pathname === "/api/conference/info" && request.method === "GET") {
        const info = await stub.getInfo();
        return json(info);
      }
    }

    return env.ASSETS ? env.ASSETS.fetch(request) : new Response("Not Found", { status: 404 });
  },
};
