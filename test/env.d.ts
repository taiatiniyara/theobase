declare module "cloudflare:test" {
  export interface ProvidedEnv {
    DB: D1Database;
    CHURCH_SYNC_DO: DurableObjectNamespace<import("../worker/durables/ChurchSyncDO").ChurchSyncDO>;
    CONFERENCE_DO: DurableObjectNamespace<import("../worker/durables/ConferenceDO").ConferenceDO>;
    JWT_SECRET: string;
  }
}
