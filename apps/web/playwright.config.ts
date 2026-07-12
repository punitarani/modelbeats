import { defineConfig, devices } from '@playwright/test'

/**
 * E2E harness (plan commit 17): runs against the BUILT app in `vite preview` — real
 * workerd serving dist/, same local D1/KV state the wrangler CLI seeds — so specs
 * exercise SSR, bindings and caching, not just the DOM. `bun run e2e` at the repo root
 * publishes local data first.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
