import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // These are golden tests that run the real pipeline (load → derive → seed → snapshot)
    // over the full curated dataset — Bradley-Terry fitting alone is several CPU-seconds.
    // The 5s default is fine on fast local hardware but times out on 2-core CI runners;
    // 30s gives ample headroom without masking a genuine hang.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
