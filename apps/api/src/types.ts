import type { Hono } from "hono";

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  SMTP_RELAY_URL: string;
  SMTP_RELAY_TOKEN: string;
  CONGREGATION_DO: DurableObjectNamespace;
  NOMINATING_DO: DurableObjectNamespace;
  STORAGE: R2Bucket;
};

export type Variables = {
  userId: string;
  congregationId?: string;
  userRoles: string[];
  correlationId: string;
};

export type AppType = Hono<{ Bindings: Bindings; Variables: Variables }>;
