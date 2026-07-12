import {
  type BenchmarkCategory,
  CATEGORY_LABELS,
  parseSort,
  selectOrgs,
  selectRankings,
} from '@rankedmodel/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Segmented } from '#/components/segmented'
import { catalogQueryOptions } from '#/lib/catalog'
import { RankingsTable } from './rankings-table'

const SORT_LABELS: Record<string, string> = {
  index: 'Index',
  name: 'name',
  params: 'parameters',
  ctx: 'context',
  arena: 'Arena Elo',
  gpqa: 'GPQA',
  hle: 'HLE',
  swe: 'SWE-bench',
  lcb: 'LiveCodeBench',
  aime: 'AIME',
  mmlu: 'MMLU',
}

export interface RankingsSearch {
  sort: string
  q: string
  org: string
  open: 'all' | 'open' | 'closed'
}

export function RankingsScreen({
  search,
  category,
  navigateSearch,
}: {
  search: RankingsSearch
  category?: BenchmarkCategory
  navigateSearch: (patch: Partial<RankingsSearch>) => void
}) {
  const { data } = useSuspenseQuery(catalogQueryOptions)
  const navigate = useNavigate()
  const rows = selectRankings(data.models, search)
  const orgs = selectOrgs(data.models)
  const sortKey = parseSort(search.sort).key

  return (
    <div className="animate-fadeup px-6 py-5 pb-10">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.02em]">
            {category ? `${CATEGORY_LABELS[category]} rankings` : 'Global rankings'}
          </h1>
          <div className="mt-0.5 text-xs text-mut" data-testid="rankings-meta">
            {rows.length} models · sorted by {SORT_LABELS[sortKey] ?? sortKey} · click any column to
            re-sort
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search.q}
            onChange={(e) => navigateSearch({ q: e.target.value })}
            placeholder="Filter…"
            className="w-[140px] rounded-md border border-border bg-panel2 px-[9px] py-[5px] text-xs text-text outline-none focus:border-acc"
            data-testid="rankings-filter"
          />
          <select
            value={search.org}
            onChange={(e) => navigateSearch({ org: e.target.value })}
            className="rounded-md border border-border bg-panel2 px-2 py-[5px] text-xs outline-none focus:border-acc"
            data-testid="rankings-org"
          >
            <option value="all">All orgs</option>
            {orgs.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name}
              </option>
            ))}
          </select>
          <Segmented
            value={search.open}
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
            ]}
            onChange={(open) => navigateSearch({ open })}
          />
        </div>
      </div>

      <RankingsTable
        rows={rows}
        benchmarks={data.benchmarks}
        sort={search.sort}
        onSort={(sort) => navigateSearch({ sort })}
        category={category}
      />
      {category && (
        <div className="mt-2.5 text-[11px] text-dim">
          Showing {CATEGORY_LABELS[category].toLowerCase()} benchmark columns only.{' '}
          <button
            type="button"
            className="cursor-pointer text-acc underline"
            onClick={() => navigate({ to: '/rankings' })}
          >
            All columns
          </button>
        </div>
      )}
      <div className="mt-2.5 text-[11px] text-dim">
        Index = normalized mean across all available benchmarks (0–100). Missing scores are
        excluded, not penalized.
      </div>
    </div>
  )
}
