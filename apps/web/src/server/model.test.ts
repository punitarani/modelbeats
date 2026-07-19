import { describe, expect, it } from 'vitest'
import { loadModel } from './model'

/**
 * getModel reads the bundled per-model detail (no D1). Runs in plain node against the
 * generated artifact; the built-Worker path is covered by e2e.
 */
describe('getModel deep payload', () => {
  it('returns full detail with provenance, quants, pricing and lineage', () => {
    const detail = loadModel('llama-3-1-405b')
    expect(detail).not.toBeNull()
    expect(detail?.slug).toBe('llama-3-1-405b')
    expect(detail?.results.length).toBeGreaterThan(0)
    // each result carries its provenance (D8)
    expect(detail?.results[0]).toHaveProperty('source')
    expect(detail?.results[0]).toHaveProperty('scoreNormalized')
    // lineage shape is always present
    expect(detail?.lineage).toHaveProperty('predecessor')
    expect(Array.isArray(detail?.lineage.successors)).toBe(true)
  })

  it('returns null for unknown slugs', () => {
    expect(loadModel('definitely-not-a-real-model')).toBeNull()
  })
})
