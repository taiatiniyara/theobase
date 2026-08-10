interface Env {
  DB: unknown;
  CHURCH_SYNC_DO: unknown;
  CONFERENCE_DO: unknown;
  JWT_SECRET: string;
  ALLOWED_ORIGINS?: string;
  CSP_REPORT_ONLY?: string;
  DISABLE_API_RATE_LIMIT?: string;
  DISABLE_EMAIL_VERIFICATION?: string;
  INVITE_CODE?: string;
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  ANALYTICS?: unknown;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
  EMAIL?: unknown;
  ASSETS?: unknown;
}
