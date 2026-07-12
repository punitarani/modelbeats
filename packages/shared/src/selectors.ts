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
