interface Env {
  DB: D1Database;
  CHURCH_SYNC_DO: DurableObjectNamespace<import("./durables/ChurchSyncDO").ChurchSyncDO>;
  CONFERENCE_DO: DurableObjectNamespace<import("./durables/ConferenceDO").ConferenceDO>;
  JWT_SECRET: string;
  ALLOWED_ORIGINS?: string;
  CSP_REPORT_ONLY?: string;
  DISABLE_API_RATE_LIMIT?: string;
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  ANALYTICS?: AnalyticsEngineDataset;
  EMAIL?: SendEmail;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}
