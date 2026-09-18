import path from 'node:path'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

const migrationsPath = path.join(import.meta.dirname, 'migrations')
const migrations = await readD1Migrations(migrationsPath)

export default defineConfig({
  test: {
    setupFiles: ['./test/apply-migrations.ts'],
  },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: migrations,
          // Not read from .dev.vars — tests get their own fixed value
          // so they never depend on a developer's local secret.
          SESSION_SECRET: 'test-only-session-secret-do-not-use-in-prod',
        },
      },
    }),
  ],
})
