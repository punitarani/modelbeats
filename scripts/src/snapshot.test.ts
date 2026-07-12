import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { buildSnapshot } from './snapshot'

const DATA = join(import.meta.dirname, '..', '..', 'data')

describe('catalog snapshot (C3 golden shape)', () => {
  it('builds a schema-valid snapshot with the full catalog', async () => {
    const snap = await buildSnapshot(DATA, 1)
    expect(snap.version).toBe(1)
    expect(snap.asOfIso).toBe('2026-07-11')
    expect(snap.models).toHaveLength(55)
    expect(snap.benchmarks).toHaveLength(10)
    expect(snap.gpus).toHaveLength(12)
  })

  it('carries precomputed index/rank and design-parity fields for opus', async () => {
    const snap = await buildSnapshot(DATA, 1)
    const opus = snap.models.find((m) => m.slug === 'claude-opus-4-8')
    expect(opus).toMatchObject({
      org: 'Anthropic',
      family: 'Claude 4',
      open: false,
      index: 87.9,
      rank: 1,
      ctxK: 500,
    })
    expect(opus?.bench.arena).toBe(1510)
    expect(opus?.price).toEqual({ input: 15, output: 75 })
    expect(opus?.categoryIdx.coding).toBe(84.2)
  })

  it('stays far under the 1.5 MB gzip budget at current scale', async () => {
    const snap = await buildSnapshot(DATA, 1)
    const gz = gzipSync(JSON.stringify(snap)).length
    expect(gz).toBeLessThan(1.5 * 1024 * 1024)
    expect(gz).toBeGreaterThan(1_000) // sanity: not empty
  })
})
