import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
        miniflare: {
          vars: {
            JWT_SECRET: "test-jwt-secret-for-vitest",
          },
        },
      },
    },
    include: ["test/**/*.test.ts"],
  },
});
