import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
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
    coverage: {
      provider: "istanbul",
      thresholds: {
        lines: 35,
        branches: 20,
        functions: 25,
      },
    },
  },
});
