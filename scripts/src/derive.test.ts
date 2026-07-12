import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveScores } from './derive'

/**
 * GOLDEN TESTS (C1): expected values computed independently (python implementation of the
 * design prototype's formula over the curated dataset) before the TS engine was written.
 * If these fail, the index no longer matches what the design renders — do not "fix" the
 * numbers; fix the engine (or consciously amend C1 in docs/DECISIONS.md).
 */

const DATA = join(import.meta.dirname, '..', '..', 'data')

describe('derived scores match the design formula (goldens)', () => {
  it('pins overall index values', async () => {
    const { models } = await deriveScores(DATA)
    const idx = new Map(models.map((m) => [m.slug, m.overallIndex]))
    expect(idx.get('claude-opus-4-8')).toBe(87.9)
    expect(idx.get('gemini-3-1-pro')).toBe(85.9)
    expect(idx.get('deepseek-v4-5')).toBe(83.7)
    expect(idx.get('kimi-k2-5')).toBe(80.4)
    expect(idx.get('gpt-oss-20b')).toBe(52.4)
    expect(idx.get('llama-3-1-8b')).toBe(17)
    expect(idx.get('smollm3-3b')).toBe(11.2)
  })

  it('pins overall ranks (55 models; opus #1, gpt-5.5-pro #2, smollm last)', async () => {
    const { models } = await deriveScores(DATA)
    expect(models).toHaveLength(55)
    const rank = new Map(models.map((m) => [m.slug, m.rankOverall]))
    expect(rank.get('claude-opus-4-8')).toBe(1)
    expect(rank.get('gpt-5-5-pro')).toBe(2)
    expect(rank.get('smollm3-3b')).toBe(55)
  })

  it('pins claude-opus-4-8 category indexes (radar vector × 100)', async () => {
    const { models } = await deriveScores(DATA)
    const opus = models.find((m) => m.slug === 'claude-opus-4-8')
    expect(opus?.categoryIdx).toEqual({
      'human-preference': 97.3,
      knowledge: 88.5,
      reasoning: 78.3,
      coding: 84.2,
      math: 99,
      vision: 83.5,
      agents: 87.1,
    })
    expect(opus?.arenaElo).toBe(1510)
  })

  it('pins the movers top-5 exactly as the design computes them', async () => {
    const { movers } = await deriveScores(DATA)
    expect(movers.map((m) => [m.slug, m.prevSlug, m.delta])).toEqual([
      ['qwen3-7-max', 'qwen3-8b', 39.6],
      ['llama-3-3-70b', 'llama-3-1-8b', 21.7],
      ['kimi-k2-5', 'kimi-k2', 14.3],
      ['grok-4-2', 'grok-4-fast', 13.7],
      ['phi-4-reasoning', 'phi-4', 13.3],
    ])
  })

  it('is deterministic', async () => {
    const a = await deriveScores(DATA)
    const b = await deriveScores(DATA)
    expect(a).toEqual(b)
  })
})
