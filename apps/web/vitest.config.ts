// Standalone vitest config: vitest must NOT load vite.config.ts here — the Cloudflare
// vite plugin rejects vitest's injected `resolve.external` in the ssr environment.
// This file becomes the workers-pool harness at the spine-proof milestone.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: true,
  },
})
