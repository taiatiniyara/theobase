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
        bindings: { TEST_MIGRATIONS: migrations },
      },
    }),
  ],
})
