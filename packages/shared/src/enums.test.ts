import { describe, expect, it } from 'vitest'
import { HEADLINE_SOURCE_PRECEDENCE, pickHeadlineRow, pickHeadlineScore } from './enums'

/**
 * pickHeadlineRow/pickHeadlineScore pick the headline result across multi-source rows for
 * one (model, benchmark) pair. Three call sites (derive.ts, snapshot.ts, catalog.ts) must
 * agree on this — a divergence would show a headline score alongside the wrong provenance
 * badge, so the precedence contract is pinned directly here rather than only transitively
 * through the derive golden.
 */

describe('HEADLINE_SOURCE_PRECEDENCE', () => {
  it('ranks independent measurements above every vendor-provided source', () => {
    expect(HEADLINE_SOURCE_PRECEDENCE[0]).toBe('independent')
    expect(HEADLINE_SOURCE_PRECEDENCE.at(-1)).toBe('self-reported')
  })
})

describe('pickHeadlineRow', () => {
  it('returns null for an empty row list', () => {
    expect(pickHeadlineRow([])).toBeNull()
  })

  it('picks the single row when only one source reported', () => {
    expect(pickHeadlineRow([{ score: 42, source: 'self-reported' }])).toEqual({
      score: 42,
      source: 'self-reported',
    })
  })

  it('prefers the higher-precedence source regardless of row order', () => {
    const rows = [
      { score: 70, source: 'self-reported' as const },
      { score: 75, source: 'independent' as const },
      { score: 72, source: 'curated' as const },
    ]
    expect(pickHeadlineRow(rows)).toEqual({ score: 75, source: 'independent' })
    // order-independence: precedence, not "first in the array", must decide the winner
    expect(pickHeadlineRow([...rows].reverse())).toEqual({ score: 75, source: 'independent' })
  })

  it('keeps the first-seen row on a same-source tie', () => {
    const rows = [
      { score: 80, source: 'curated' as const },
      { score: 81, source: 'curated' as const },
    ]
    expect(pickHeadlineRow(rows)).toEqual({ score: 80, source: 'curated' })
  })
})

describe('pickHeadlineScore', () => {
  it('returns null for an empty row list', () => {
    expect(pickHeadlineScore([])).toBeNull()
  })

  it('returns just the score of the row pickHeadlineRow would pick', () => {
    const rows = [
      { score: 70, source: 'self-reported' as const },
      { score: 75, source: 'independent' as const },
    ]
    expect(pickHeadlineScore(rows)).toBe(75)
  })
})
