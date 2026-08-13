import type { ChurchDO } from './church-do';

export interface Env {
  CHURCH_DO: DurableObjectNamespace<ChurchDO>;
  theobase_auth?: KVNamespace;
  AUTH_EMAIL: {
    send(message: EmailMessage): Promise<void>;
  };
  APP_URL: string;
  DB?: D1Database;
  JWT_PRIVATE_KEY?: string;
  JWT_PUBLIC_KEY?: string;
  ERROR_QUEUE?: Queue;
  ERROR_STORAGE?: R2Bucket;
  SEED_TOKEN?: string;
  SEED_OPERATOR_EMAIL?: string;
}

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}
