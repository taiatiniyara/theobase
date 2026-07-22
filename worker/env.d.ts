interface Env {
  DB: D1Database;
  CHURCH_SYNC_DO: DurableObjectNamespace<import("./durables/ChurchSyncDO").ChurchSyncDO>;
  CONFERENCE_DO: DurableObjectNamespace<import("./durables/ConferenceDO").ConferenceDO>;
  JWT_SECRET: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}
