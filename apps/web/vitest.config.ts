import path from 'node:path'
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

/**
 * Workers test harness (plan commit 13): tests run inside real workerd with the app's
 * D1/KV bindings from wrangler.jsonc. Standalone config on purpose — vitest must not
 * load vite.config.ts (the Cloudflare vite plugin rejects vitest's resolve.external).
 * D1 migrations are read here and applied per-test-storage in the setup file.
 */
export default defineConfig(async () => {
  const migrations = await readD1Migrations(
    path.join(import.meta.dirname, '..', '..', 'packages', 'db', 'migrations'),
  )
  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: './wrangler.test.jsonc' },
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
        },
      }),
    ],
    test: {
      include: ['src/**/*.test.ts'],
      setupFiles: ['./src/test/apply-migrations.ts'],
    },
  }
})
