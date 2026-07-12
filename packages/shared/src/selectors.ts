import type { CapabilityKey } from './enums'
import type { SizeClass } from './hardware-fit'
import type { SnapshotModel } from './snapshot'

/**
 * Pure snapshot selectors (D17): every list/filter/sort interaction runs through these —
 * identical on server (SSR) and client (instant, in-memory). Sort semantics are copied
 * from the design prototype verbatim.
 */

export type OpenFilter = 'all' | 'open' | 'closed'

export interface RankingsQuery {
  q: string
  org: string // org slug or 'all'
  open: OpenFilter
  /** C4 sort encoding: leading '-' = descending. Keys: name|params|ctx|index|<benchSlug>. */
  sort: string
}

export function parseSort(sort: string): { key: string; desc: boolean } {
  return sort.startsWith('-') ? { key: sort.slice(1), desc: true } : { key: sort, desc: false }
}

/** Design toggle semantics: same key flips direction; a new key starts descending. */
export function toggleSort(current: string, key: string): string {
  const cur = parseSort(current)
  if (cur.key === key) return cur.desc ? key : `-${key}`
  return `-${key}`
}

function matchesOpen(m: SnapshotModel, f: OpenFilter): boolean {
  return f === 'all' || (f === 'open') === m.open
}

function textHaystack(m: SnapshotModel): string {
  return `${m.name} ${m.org} ${m.family}`.toLowerCase()
}

export function selectRankings(models: SnapshotModel[], query: RankingsQuery): SnapshotModel[] {
  const q = query.q.trim().toLowerCase()
  const { key, desc } = parseSort(query.sort)
  const dir = desc ? -1 : 1

  const sortVal = (m: SnapshotModel): string | number => {
    switch (key) {
      case 'name':
        return m.name.toLowerCase()
      case 'params':
        return m.params == null ? -1 : m.params
      case 'ctx':
        return m.ctxK
      case 'index':
        return m.index
      default:
        return m.bench[key] ?? -1e9
    }
  }

  return models
    .filter(
      (m) =>
        matchesOpen(m, query.open) &&
        (query.org === 'all' || m.orgSlug === query.org) &&
        (!q || textHaystack(m).includes(q)),
    )
    .sort((a, b) => {
      const va = sortVal(a)
      const vb = sortVal(b)
      // design quirk preserved: string columns invert the direction sign
      const c = typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)
      return c * (typeof va === 'string' ? -dir : dir)
    })
}

export interface OrgOption {
  slug: string
  name: string
}

/** Distinct orgs, name-sorted — the design's org <select> options. */
export function selectOrgs(models: SnapshotModel[]): OrgOption[] {
  const seen = new Map<string, string>()
  for (const m of models) if (!seen.has(m.orgSlug)) seen.set(m.orgSlug, m.org)
  return [...seen.entries()]
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Case-insensitive substring search over name+org+family, top N (design topbar). */
export function searchModels(models: SnapshotModel[], q: string, limit = 8): SnapshotModel[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return []
  return models.filter((m) => textHaystack(m).includes(needle)).slice(0, limit)
}

// ---------- explorer (design filter rail + card grid) ----------

export type ExplorerSort = 'index' | 'date' | 'params' | 'cheap'

export interface ExplorerQuery {
  q: string
  org: string
  open: OpenFilter
  size: SizeClass | 'any'
  /** hardware profile slug, or 'none' for any hardware / API. */
  gpu: string
  caps: CapabilityKey[]
  sort: ExplorerSort
}

export interface GpuBudget {
  slug: string
  vramGb: number
}

/**
 * Explorer filtering + sorting, design-verbatim — including its quirks: the GPU facet
 * requires a CURATED vramQ4 (no estimate fallback) with the boolean 1.08 rule, and
 * "Largest first" treats undisclosed params as 1e6 so closed frontier models lead.
 */
export function selectExplorer(
  models: SnapshotModel[],
  query: ExplorerQuery,
  gpus: GpuBudget[],
): SnapshotModel[] {
  const q = query.q.trim().toLowerCase()
  const gpu = query.gpu === 'none' ? undefined : gpus.find((g) => g.slug === query.gpu)

  const sizeOk = (m: SnapshotModel): boolean => {
    if (query.size === 'any') return true
    if (query.size === 'undisclosed') return m.params == null
    if (m.params == null) return false
    if (query.size === 's') return m.params < 15
    if (query.size === 'm') return m.params >= 15 && m.params < 70
    if (query.size === 'l') return m.params >= 70 && m.params < 300
    return m.params >= 300
  }

  const rows = models.filter(
    (m) =>
      (!q || `${m.name} ${m.org} ${m.family}`.toLowerCase().includes(q)) &&
      (query.open === 'all' || (query.open === 'open') === m.open) &&
      (query.org === 'all' || m.orgSlug === query.org) &&
      sizeOk(m) &&
      (!gpu || (m.open && m.vramQ4 != null && m.vramQ4 * 1.08 <= gpu.vramGb)) &&
      query.caps.every((cap) => m.caps[cap]),
  )

  return rows.sort((a, b) => {
    switch (query.sort) {
      case 'date':
        return b.date.localeCompare(a.date)
      case 'params':
        return (b.params ?? 1e6) - (a.params ?? 1e6)
      case 'cheap':
        return (a.price?.output ?? 1e9) - (b.price?.output ?? 1e9)
      default:
        return b.index - a.index
    }
  })
}
