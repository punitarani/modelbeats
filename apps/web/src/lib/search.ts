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

/**
 * Rankings sort keys: the fixed columns (name/params/ctx/index) plus ANY kebab-case
 * benchmark slug — the catalog is data-driven and count-varying (D18), so this can't be a
 * static enum. `selectRankings`'s sort switch already degrades an unrecognized key via
 * `m.bench[key] ?? -1e9`, so accepting any slug-shaped string here is safe; a slug that
 * doesn't exist in the current catalog just sorts everything to the bottom.
 */
export const RANKINGS_SORT_KEYS = ['name', 'params', 'ctx', 'index', '[a-z][a-z0-9-]*'] as const

/**
 * One flagship benchmark per category (arena + 6), in category order — the rankings
 * table's default CORE column set. Category subpages (`/rankings/$category`) instead show
 * every benchmark in that category, sourced live from the snapshot's benchmark catalog.
 */
export const CORE_RANKINGS_SLUGS = [
  'arena', // human-preference
  'mmlu', // knowledge
  'gpqa', // reasoning
  'swe-bench', // coding
  'aime', // math
  'mmmu', // vision
  'tau-bench', // agents
] as const

/** Compact capability codes in URLs (C4 `?caps=fc,tools`) → shared CapabilityKey. */
export const CAP_CODES = {
  reason: 'reasoning',
  vision: 'vision',
  fc: 'functionCalling',
  tools: 'toolUse',
  agent: 'agentic',
} as const

export const sizeParam = z
  .enum(['any', 's', 'm', 'l', 'xl', 'undisclosed'])
  .default('any')
  .catch('any')

export const gpuParam = z.string().max(40).default('none').catch('none')

export const capsParam = z
  .string()
  .regex(/^(reason|vision|fc|tools|agent)(,(reason|vision|fc|tools|agent))*$/)
  .default('')
  .catch('')

export const explorerSortParam = z
  .enum(['index', 'date', 'params', 'cheap'])
  .default('index')
  .catch('index')

export const explorerSearchSchema = z.object({
  q: textQueryParam,
  open: openFilterParam,
  org: orgParam,
  size: sizeParam,
  gpu: gpuParam,
  caps: capsParam,
  sort: explorerSortParam,
})

export const EXPLORER_SEARCH_DEFAULTS = {
  q: '',
  open: 'all',
  org: 'all',
  size: 'any',
  gpu: 'none',
  caps: '',
  sort: 'index',
} as const

export type ExplorerSearch = z.infer<typeof explorerSearchSchema>

export const hardwareSearchSchema = z.object({
  mode: z.enum(['gpu', 'model']).default('gpu').catch('gpu'),
  gpu: z.string().max(40).default('rtx4090').catch('rtx4090'),
  vram: z.number().positive().max(2048).default(24).catch(24),
  show: z.enum(['all', 'fits']).default('all').catch('all'),
  model: z.string().max(60).default('llama-3-3-70b').catch('llama-3-3-70b'),
})

export const HARDWARE_SEARCH_DEFAULTS = {
  mode: 'gpu',
  gpu: 'rtx4090',
  vram: 24,
  show: 'all',
  model: 'llama-3-3-70b',
} as const

export type HardwareSearch = z.infer<typeof hardwareSearchSchema>
