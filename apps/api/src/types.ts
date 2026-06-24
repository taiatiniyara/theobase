import type { Hono } from "hono";

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  SMTP_RELAY_URL: string;
  SMTP_RELAY_PIN: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  APP_URL: string;
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
