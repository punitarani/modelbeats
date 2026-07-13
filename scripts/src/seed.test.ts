import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveScores } from './derive'
import { loadDataset } from './lib/load'
import { generateSeedSql } from './seed'

const DATA = join(import.meta.dirname, '..', '..', 'data')

describe('generateSeedSql (against the real curated dataset)', () => {
  it('produces bounded, idempotent upsert statements + cleanup deletes', async () => {
    const ds = await loadDataset(DATA)
    const derived = await deriveScores(DATA)
    const stmts = generateSeedSql(ds, derived)

    // every statement respects D1's 100 KB limit
    for (const stmt of stmts) {
      expect(new TextEncoder().encode(stmt).length).toBeLessThan(100_000)
    }
    // idempotent upserts, never INSERT OR REPLACE (§5.5)
    expect(stmts.some((x) => x.includes('INSERT OR REPLACE'))).toBe(false)
    expect(stmts.filter((x) => x.startsWith('INSERT INTO')).length).toBeGreaterThan(10)
    for (const stmt of stmts.filter((x) => x.startsWith('INSERT INTO'))) {
      expect(stmt).toContain('ON CONFLICT(')
    }
    // full-sync cleanup for every table, children before parents
    const deletes = stmts.filter((x) => x.startsWith('DELETE FROM'))
    expect(deletes).toHaveLength(10)
    expect(deletes[0]).toContain('throughput_estimates')
    expect(deletes.at(-1)).toContain('organizations')
  })

  it("escapes single quotes in curated text (01.AI's Yi-6B note contains an apostrophe)", async () => {
    const ds = await loadDataset(DATA)
    const derived = await deriveScores(DATA)
    const sql = generateSeedSql(ds, derived).join('\n')
    expect(sql).toContain("01.AI''s debut Yi series")
  })

  it('seeds model_scores for every real model and converts ctx to absolute tokens (D15)', async () => {
    const ds = await loadDataset(DATA)
    const derived = await deriveScores(DATA)
    const sql = generateSeedSql(ds, derived).join('\n')
    expect(derived.models).toHaveLength(ds.models.length)
    expect(derived.models.length).toBeGreaterThan(400) // real ~463-model corpus, not the old seed
    // llama-4-scout has ctxK 10000 (10M-token context) → 10_000_000 absolute tokens somewhere
    // in the models insert
    expect(sql).toContain('10000000')
  })
})
