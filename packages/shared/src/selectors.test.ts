import { describe, expect, it } from 'vitest'
import { parseSort, selectRankings, toggleSort } from './selectors'
import type { SnapshotModel } from './snapshot'

const model = (over: Partial<SnapshotModel>): SnapshotModel =>
  ({
    slug: 'x',
    name: 'X',
    org: 'Org',
    orgSlug: 'org',
    family: 'F',
    familySlug: 'f',
    date: '2026-01-01',
    status: 'released',
    openness: 'closed',
    open: false,
    predecessor: null,
    params: null,
    active: null,
    ctxK: 128,
    arch: 'Dense',
    archClass: 'dense',
    license: 'Proprietary',
    langCount: null,
    modalities: ['text'],
    caps: {
      reasoning: false,
      coding: false,
      vision: false,
      functionCalling: false,
      toolUse: false,
      agentic: false,
    },
    apiAvailable: true,
    bench: {},
    price: null,
    vramQ4: null,
    vramFp16: null,
    quants: [],
    tps4090: null,
    tpsNote: null,
    links: {},
    note: '',
    index: 0,
    rank: 1,
    categoryIdx: {
      'human-preference': null,
      knowledge: null,
      reasoning: null,
      coding: null,
      math: null,
      vision: null,
      agents: null,
    },
    ...over,
  }) as SnapshotModel

const A = model({
  slug: 'a',
  name: 'Alpha',
  index: 90,
  params: 70,
  bench: { swe: 80 },
  open: true,
  openness: 'open-weights',
  orgSlug: 'acme',
  org: 'Acme',
})
const B = model({ slug: 'b', name: 'Beta', index: 70, params: null, bench: { swe: 85 } })
const C = model({ slug: 'c', name: 'Gamma', index: 80, params: 8, bench: {} })

describe('sort encoding (C4)', () => {
  it('parses leading dash as descending', () => {
    expect(parseSort('-index')).toEqual({ key: 'index', desc: true })
    expect(parseSort('name')).toEqual({ key: 'name', desc: false })
  })
  it('toggle flips same key, new key starts descending (design semantics)', () => {
    expect(toggleSort('-index', 'index')).toBe('index')
    expect(toggleSort('index', 'index')).toBe('-index')
    expect(toggleSort('-index', 'swe')).toBe('-swe')
  })
})

describe('selectRankings', () => {
  const base = { q: '', org: 'all', open: 'all' as const }
  it('sorts by index desc by default', () => {
    const rows = selectRankings([B, C, A], { ...base, sort: '-index' })
    expect(rows.map((m) => m.slug)).toEqual(['a', 'c', 'b'])
  })
  it('missing benchmark scores sink to the bottom on desc', () => {
    const rows = selectRankings([C, A, B], { ...base, sort: '-swe' })
    expect(rows.map((m) => m.slug)).toEqual(['b', 'a', 'c'])
  })
  it('undisclosed params sort below smallest on desc', () => {
    const rows = selectRankings([A, B, C], { ...base, sort: '-params' })
    expect(rows.map((m) => m.slug)).toEqual(['a', 'c', 'b'])
  })
  it('filters compose: open + text query', () => {
    const rows = selectRankings([A, B, C], { ...base, open: 'open', sort: '-index', q: 'alp' })
    expect(rows.map((m) => m.slug)).toEqual(['a'])
  })
})
