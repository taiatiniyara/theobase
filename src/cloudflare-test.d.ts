declare module "cloudflare:test" {
  interface EnvBinding {
    DB: D1Database;
    JWT_SECRET: string;
  }

  export const SELF: {
    fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
  };

  export const env: EnvBinding;
}
