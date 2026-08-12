import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';

export default defineConfig(async () => {
  const migrationsPath = path.join(__dirname, 'drizzle');
  const migrations = await readD1Migrations(migrationsPath);

  return defineConfig({
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.jsonc' },
        main: './src/index.ts',
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
          kvNamespaces: { theobase_auth: 'test' },
        },
      }),
    ],
    test: {
      setupFiles: ['./test/apply-migrations.ts'],
    },
  });
});