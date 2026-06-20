import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/.svelte-kit/**",
      "**/node_modules/**",
      "**/dist/**",
      "drizzle/**",
      "scripts/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-empty-pattern": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["apps/relay/**/*.js"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", Buffer: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  {
    files: ["apps/web/src/service-worker.ts"],
    languageOptions: {
      globals: { self: "readonly", fetch: "readonly", Response: "readonly", Headers: "readonly", caches: "readonly", indexedDB: "readonly", IDBDatabase: "readonly", ExtendableMessageEvent: "readonly", PushEvent: "readonly", NotificationEvent: "readonly", Notification: "readonly" },
    },
    rules: {
      "no-empty": "off",
    },
  },
);
