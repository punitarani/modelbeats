import { z } from 'zod'

/**
 * URL search-param conventions (contract C4): every param is optional-with-fallback —
 * `.default()` covers absence, `.catch()` covers invalid values, so bad URLs degrade to
 * defaults instead of throwing. Plain Zod v4 schemas plug straight into validateSearch
 * via Standard Schema (the @tanstack/zod-adapter would drag in a second zod major and
 * collapse search typing — deliberately not used).
 */

export const openFilterParam = z.enum(['all', 'open', 'closed']).default('all').catch('all')

export const textQueryParam = z.string().max(80).default('').catch('')

export const orgParam = z.string().max(60).default('all').catch('all')

/** Sort param constrained to a route's sortable keys (with optional `-` prefix, C4). */
export function sortParam(keys: readonly string[], def: string) {
  const re = new RegExp(`^-?(${keys.join('|')})$`)
  return z.string().regex(re).default(def).catch(def)
}

/** The rankings table's sortable columns (design: name/params/ctx/index + 7 benchmarks). */
export const RANKINGS_SORT_KEYS = [
  'name',
  'params',
  'ctx',
  'index',
  'arena',
  'gpqa',
  'hle',
  'swe',
  'lcb',
  'aime',
  'mmlu',
] as const

/** The design's seven rankings benchmark columns, in order. */
export const RANKINGS_BENCH_COLUMNS = [
  { slug: 'arena', label: 'Arena' },
  { slug: 'gpqa', label: 'GPQA' },
  { slug: 'hle', label: 'HLE' },
  { slug: 'swe', label: 'SWE' },
  { slug: 'lcb', label: 'LCB' },
  { slug: 'aime', label: 'AIME' },
  { slug: 'mmlu', label: 'MMLU' },
] as const
