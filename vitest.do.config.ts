import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: ["apps/do/src/__tests__/**/*.test.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./apps/do/wrangler.test.jsonc" },
        miniflare: {},
      },
    },
  },
});
