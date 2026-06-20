import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    exclude: ["apps/do/src/__tests__/**", "apps/relay/src/__tests__/**"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./apps/api/wrangler.test.jsonc" },
        singleWorker: true,
        miniflare: {},
      },
    },
  },
});
