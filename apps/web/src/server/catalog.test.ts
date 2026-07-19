import { describe, expect, it } from 'vitest'
import { loadCatalog } from './catalog'

/**
 * The catalog spine now reads a bundled, build-time snapshot (no D1/KV). These tests run
 * in plain node against the generated artifact; the built-Worker path is covered by e2e.
 */
describe('catalog spine (getCatalog server logic)', () => {
  it('serves the bundled snapshot, parsed against the C3 contract', () => {
    const catalog = loadCatalog()
    expect(catalog.version).toBeGreaterThan(0)
    expect(catalog.models.length).toBeGreaterThan(400)
    expect(catalog.benchmarks.length).toBeGreaterThan(100)
  })

  it('carries precomputed ratings/ranks (publish-time C1/D21)', () => {
    const catalog = loadCatalog()
    const top = catalog.models.find((m) => m.rank === 1)
    expect(top).toBeDefined()
    expect(typeof top?.index).toBe('number')
    // ranks are dense and start at 1 among rank-eligible models
    const ranks = catalog.models.filter((m) => m.ranked).map((m) => m.rank)
    expect(Math.min(...(ranks as number[]))).toBe(1)
  })

  it('is a stable in-memory singleton', () => {
    expect(loadCatalog()).toBe(loadCatalog())
  })
})
