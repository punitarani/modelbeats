import path from 'node:path'
import { defineConfig } from 'vitest/config'

/**
 * Plain node harness. The server modules read a bundled JSON snapshot (no D1/KV/workerd),
 * so unit tests run in node; the built-worker behaviour is covered by the Playwright e2e
 * suite. The `#/` alias mirrors tsconfig's `#/* → ./src/*`.
 */
export default defineConfig({
  resolve: {
    alias: [{ find: /^#\/(.*)$/, replacement: `${path.resolve(import.meta.dirname, 'src')}/$1` }],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
