import { describe, expect, it } from 'vitest'
import { parseSort, searchModels, selectExplorer, selectRankings, toggleSort } from './selectors'
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

describe('selectExplorer', () => {
  const gpus = [{ slug: 'rtx4090', vramGb: 24 }]
  const open20b = model({
    slug: 'oss20b',
    name: 'OSS 20B',
    open: true,
    openness: 'open-weights',
    params: 21,
    vramQ4: 13,
    price: { input: 0.1, output: 0.6 },
    caps: {
      reasoning: true,
      coding: true,
      vision: false,
      functionCalling: true,
      toolUse: true,
      agentic: false,
    },
  })
  const open120b = model({
    slug: 'oss120b',
    name: 'OSS 120B',
    open: true,
    openness: 'open-weights',
    params: 117,
    vramQ4: 66,
    index: 60,
  })
  const closed = model({
    slug: 'front',
    name: 'Frontier',
    params: null,
    price: { input: 2, output: 8 },
    index: 95,
  })
  const base = {
    q: '',
    org: 'all',
    open: 'all' as const,
    size: 'any' as const,
    gpu: 'none',
    caps: [] as never[],
    sort: 'index' as const,
  }

  it('GPU facet keeps only curated-VRAM open models fitting 1.08×', () => {
    const rows = selectExplorer([open20b, open120b, closed], { ...base, gpu: 'rtx4090' }, gpus)
    expect(rows.map((m) => m.slug)).toEqual(['oss20b']) // 13×1.08=14.04 ≤ 24; 66×1.08 > 24; closed excluded
  })
  it('Largest-first treats undisclosed params as 1e6 (design quirk)', () => {
    const rows = selectExplorer([open20b, open120b, closed], { ...base, sort: 'params' }, gpus)
    expect(rows[0]?.slug).toBe('front')
  })
  it('cheapest sorts by output price with unpriced last', () => {
    const rows = selectExplorer([open120b, closed, open20b], { ...base, sort: 'cheap' }, gpus)
    expect(rows.map((m) => m.slug)).toEqual(['oss20b', 'front', 'oss120b'])
  })
  it('capability chips require every selected cap', () => {
    const rows = selectExplorer(
      [open20b, open120b, closed],
      { ...base, caps: ['reasoning' as const] },
      gpus,
    )
    expect(rows.map((m) => m.slug)).toEqual(['oss20b'])
  })
})

describe('searchModels', () => {
  const gpt4o = model({ slug: 'gpt-4o', name: 'GPT-4o', org: 'OpenAI', orgSlug: 'openai' })
  const gpt4mini = model({
    slug: 'gpt-4o-mini',
    name: 'GPT-4o mini',
    org: 'OpenAI',
    orgSlug: 'openai',
  })
  const claude = model({
    slug: 'claude-4',
    name: 'Claude 4',
    org: 'Anthropic',
    orgSlug: 'anthropic',
  })
  const all = [gpt4o, gpt4mini, claude]

  it('plain substring query matches name/org/family (unchanged)', () => {
    expect(searchModels(all, 'claude').map((m) => m.slug)).toEqual(['claude-4'])
  })

  it('provider slash filters to only that provider (all its models)', () => {
    expect(searchModels(all, 'openai/').map((m) => m.slug)).toEqual(['gpt-4o', 'gpt-4o-mini'])
  })

  it('provider slash is case-insensitive against orgSlug and org name', () => {
    expect(searchModels(all, 'OpenAI/').map((m) => m.slug)).toEqual(['gpt-4o', 'gpt-4o-mini'])
  })

  it('text after the slash narrows within the provider by name', () => {
    expect(searchModels(all, 'openai/mini').map((m) => m.slug)).toEqual(['gpt-4o-mini'])
  })

  it('a slash whose prefix names no provider falls back to substring search', () => {
    // 'gpt' is not a provider; the whole 'gpt/' string isn't in any haystack → no matches
    expect(searchModels(all, 'gpt/')).toEqual([])
  })

  it('respects the limit within a provider scope', () => {
    expect(searchModels(all, 'openai/', 1).map((m) => m.slug)).toEqual(['gpt-4o'])
  })
})
