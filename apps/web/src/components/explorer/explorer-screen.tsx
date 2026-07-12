import {
  type CapabilityKey,
  type ExplorerQuery,
  type ExplorerSort,
  fmtCtx,
  fmtDate,
  fmtParams,
  fmtPrice,
  SIZE_CLASS_LABELS,
  selectExplorer,
  selectOrgs,
} from '@rankedmodel/shared'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { InlineBar } from '#/components/charts/inline-bar'
import { FilterSelect } from '#/components/filter-select'
import { ModelTag } from '#/components/model-tag'
import { SearchSelect } from '#/components/search-select'
import { Segmented } from '#/components/segmented'
import { catalogQueryOptions } from '#/lib/catalog'
import { CAP_CODES, type ExplorerSearch } from '#/lib/search'

/** The 5 filter chips exactly as the design's rail lists them. */
const CAP_CHIPS: { code: keyof typeof CAP_CODES; label: string }[] = [
  { code: 'reason', label: 'Reasoning' },
  { code: 'vision', label: 'Vision' },
  { code: 'fc', label: 'Function calling' },
  { code: 'tools', label: 'Tool use' },
  { code: 'agent', label: 'Agentic' },
]

const CAP_LABELS: Record<CapabilityKey, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  vision: 'Vision',
  functionCalling: 'Function calling',
  toolUse: 'Tool use',
  agentic: 'Agentic',
}

export function ExplorerScreen({
  search,
  navigateSearch,
}: {
  search: ExplorerSearch
  navigateSearch: (patch: Partial<ExplorerSearch>) => void
}) {
  const { data } = useSuspenseQuery(catalogQueryOptions)
  const orgs = selectOrgs(data.models)
  const activeCaps = search.caps
    .split(',')
    .filter((c): c is keyof typeof CAP_CODES => c in CAP_CODES)
  const query: ExplorerQuery = {
    q: search.q,
    org: search.org,
    open: search.open,
    size: search.size,
    gpu: search.gpu,
    caps: activeCaps.map((c) => CAP_CODES[c]),
    sort: search.sort as ExplorerSort,
  }
  const rows = selectExplorer(data.models, query, data.gpus)

  const toggleCap = (code: keyof typeof CAP_CODES) => {
    const next = activeCaps.includes(code)
      ? activeCaps.filter((c) => c !== code)
      : [...activeCaps, code]
    navigateSearch({ caps: next.join(',') })
  }

  const FacetLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-[7px] font-mono text-[9.5px] uppercase tracking-[0.07em] text-dim">
      {children}
    </div>
  )

  return (
    <div className="flex animate-fadeup items-start">
      {/* filter rail */}
      <div className="sticky top-[49px] flex h-[calc(100vh-49px)] w-[228px] flex-none flex-col gap-4 overflow-y-auto border-r border-border px-4 pt-[18px] pb-8">
        <input
          type="text"
          value={search.q}
          onChange={(e) => navigateSearch({ q: e.target.value })}
          placeholder="Filter models…"
          className="rounded-md border border-border bg-panel2 px-[9px] py-1.5 text-xs text-text outline-none focus:border-acc"
          data-testid="explorer-filter"
        />
        <div>
          <FacetLabel>Weights</FacetLabel>
          <Segmented
            grow
            value={search.open}
            options={[
              { value: 'all', label: 'All' },
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
            ]}
            onChange={(open) => navigateSearch({ open })}
          />
        </div>
        <div>
          <FacetLabel>Organization</FacetLabel>
          <SearchSelect
            value={search.org}
            onValueChange={(org) => navigateSearch({ org })}
            options={[
              { value: 'all', label: 'All orgs' },
              ...orgs.map((o) => ({ value: o.slug, label: o.name })),
            ]}
            aria-label="Filter by organization"
            searchPlaceholder="Search organizations…"
            testid="explorer-org"
            className="w-full"
          />
        </div>
        <div>
          <FacetLabel>Total parameters</FacetLabel>
          <FilterSelect
            value={search.size}
            onValueChange={(size) => navigateSearch({ size: size as ExplorerSearch['size'] })}
            options={[
              { value: 'any', label: 'Any size' },
              { value: 's', label: SIZE_CLASS_LABELS.s },
              { value: 'm', label: SIZE_CLASS_LABELS.m },
              { value: 'l', label: SIZE_CLASS_LABELS.l },
              { value: 'xl', label: SIZE_CLASS_LABELS.xl },
              { value: 'undisclosed', label: SIZE_CLASS_LABELS.undisclosed },
            ]}
            aria-label="Filter by parameter size class"
            testid="explorer-size"
            className="w-full"
          />
        </div>
        <div>
          <FacetLabel>Runs on my hardware</FacetLabel>
          <FilterSelect
            value={search.gpu}
            onValueChange={(gpu) => navigateSearch({ gpu })}
            options={[
              { value: 'none', label: 'Any hardware / API' },
              ...data.gpus.map((g) => ({ value: g.slug, label: g.name })),
            ]}
            aria-label="Filter by hardware fit"
            testid="explorer-gpu"
            className="w-full"
          />
          <div className="mt-[5px] text-[10.5px] leading-[1.45] text-dim">
            Filters open models whose Q4 quant fits in VRAM/unified memory.
          </div>
        </div>
        <div>
          <FacetLabel>Capabilities</FacetLabel>
          <div className="flex flex-wrap gap-[5px]">
            {CAP_CHIPS.map((chip) => {
              const active = activeCaps.includes(chip.code)
              return (
                <button
                  key={chip.code}
                  type="button"
                  onClick={() => toggleCap(chip.code)}
                  aria-pressed={active}
                  className="cursor-pointer rounded-[20px] border px-2.5 py-[3px] text-[11px]"
                  style={{
                    borderColor: active ? 'var(--acc)' : 'var(--border)',
                    background: active ? 'var(--accdim)' : 'transparent',
                    color: active ? 'var(--acc)' : 'var(--mut)',
                  }}
                  data-testid={`cap-${chip.code}`}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            navigateSearch({ q: '', open: 'all', org: 'all', size: 'any', gpu: 'none', caps: '' })
          }
          className="cursor-pointer self-start text-[11.5px] text-mut underline"
        >
          Reset filters
        </button>
      </div>

      {/* results */}
      <div className="min-w-0 flex-1 px-6 pt-[18px] pb-10">
        <div className="mb-[13px] flex items-baseline gap-2.5">
          <div className="text-sm font-semibold" data-testid="explorer-count">
            {rows.length} models
          </div>
          <div className="ml-auto flex items-center gap-[7px] text-[11.5px] text-mut">
            Sort
            <FilterSelect
              value={search.sort}
              onValueChange={(sort) => navigateSearch({ sort: sort as ExplorerSort })}
              options={[
                { value: 'index', label: 'Index score' },
                { value: 'date', label: 'Newest first' },
                { value: 'params', label: 'Largest first' },
                { value: 'cheap', label: 'Cheapest API' },
              ]}
              aria-label="Sort models"
              testid="explorer-sort"
            />
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-[11px]">
          {rows.map((m) => (
            <Link
              key={m.slug}
              to="/models/$slug"
              params={{ slug: m.slug }}
              className="flex cursor-pointer flex-col gap-2 rounded-[10px] border border-border bg-card p-[13px] px-[15px] text-text no-underline hover:border-border2 hover:bg-hover hover:no-underline"
              data-testid="explorer-card"
            >
              <div className="flex items-baseline gap-2">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold">
                  {m.name}
                </div>
                <span className="ml-auto">
                  <ModelTag open={m.open} />
                </span>
              </div>
              <div className="text-[11.5px] text-mut">
                {m.org} · {fmtDate(m.date)}
              </div>
              <div className="flex gap-3 font-mono text-[10.5px] text-mut">
                <span>{fmtParams(m.params, m.active)}</span>
                <span>{fmtCtx(m.ctxK)} ctx</span>
                <span>{fmtPrice(m.price, m.open)}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <InlineBar pct={Math.round(m.index)} height={4} className="flex-1" />
                <span className="font-mono text-[11px] font-semibold">{m.index.toFixed(1)}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(Object.keys(m.caps) as CapabilityKey[])
                  .filter((k) => m.caps[k] && k !== 'coding')
                  .slice(0, 4)
                  .map((k) => (
                    <span
                      key={k}
                      className="rounded border border-border px-1.5 py-px text-[10px] text-mut"
                    >
                      {CAP_LABELS[k]}
                    </span>
                  ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
