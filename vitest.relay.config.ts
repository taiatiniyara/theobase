import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/relay/src/__tests__/**/*.test.*"],
  },
});
