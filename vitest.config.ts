import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./apps/api/wrangler.test.jsonc" },
        miniflare: {},
      },
    },
  },
});
