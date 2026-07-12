import type { D1Migration } from '@cloudflare/vitest-pool-workers'

// pool-workers 0.18.x types `env` from cloudflare:test as Cloudflare.Env (the namespace
// wrangler types generates) — augment it with the test-only migrations binding that
// vitest.config.ts injects via miniflare.bindings.
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[]
    }
  }
}
