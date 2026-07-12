import {
  type BenchmarkCategory,
  fmtCtx,
  fmtParams,
  parseSort,
  type SnapshotBenchmark,
  type SnapshotModel,
  toggleSort,
} from '@rankedmodel/shared'
import { useNavigate } from '@tanstack/react-router'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { InlineBar } from '#/components/charts/inline-bar'
import { normPct } from '#/components/charts/scales'
import { ModelTag } from '#/components/model-tag'
import { RANKINGS_BENCH_COLUMNS } from '#/lib/search'

/**
 * The design's dense rankings table: headless TanStack Table for the column/row model
 * (sorting stays in the URL via the shared selector), design grid markup for rendering.
 */

const GRID = 'grid grid-cols-[34px_minmax(190px,1.6fr)_74px_62px_84px_repeat(7,72px)] gap-2'

const columnHelper = createColumnHelper<SnapshotModel>()

export function RankingsTable({
  rows,
  benchmarks,
  sort,
  onSort,
  category,
}: {
  rows: SnapshotModel[]
  benchmarks: SnapshotBenchmark[]
  sort: string
  onSort: (next: string) => void
  category?: BenchmarkCategory
}) {
  const navigate = useNavigate()
  const boundsBySlug = new Map(benchmarks.map((b) => [b.slug, b]))
  const { key: sortKey, desc } = parseSort(sort)
  const arrow = (key: string) => (sortKey === key ? (desc ? '↓' : '↑') : '')

  const benchCols = category
    ? RANKINGS_BENCH_COLUMNS.filter((c) => boundsBySlug.get(c.slug)?.category === category)
    : [...RANKINGS_BENCH_COLUMNS]

  const table = useReactTable({
    data: rows,
    columns: [
      columnHelper.accessor('index', { id: 'index' }),
      ...benchCols.map((c) => columnHelper.accessor((m) => m.bench[c.slug], { id: c.slug })),
    ],
    getCoreRowModel: getCoreRowModel(),
  })

  const HeadBtn = ({
    id,
    label,
    className = '',
  }: {
    id: string
    label: string
    className?: string
  }) => (
    <button
      type="button"
      onClick={() => onSort(toggleSort(sort, id))}
      className={`cursor-pointer whitespace-nowrap text-left font-mono text-[9.5px] uppercase tracking-[0.05em] ${
        sortKey === id ? 'text-acc' : 'text-dim'
      } ${className}`}
      data-testid={`sort-${id}`}
    >
      {label} {arrow(id)}
    </button>
  )

  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
      <div style={{ minWidth: 1020 }}>
        <div className={`${GRID} items-center border-b border-border2 px-3.5 py-[9px]`}>
          <span className="font-mono text-[9.5px] text-dim">#</span>
          <HeadBtn id="name" label="Model" />
          <HeadBtn id="params" label="Params" className="text-right" />
          <HeadBtn id="ctx" label="Ctx" className="text-right" />
          <HeadBtn id="index" label="Index" className="text-right" />
          {benchCols.map((c) => (
            <HeadBtn key={c.slug} id={c.slug} label={c.label} className="text-right" />
          ))}
        </div>
        {table.getRowModel().rows.map((row, i) => {
          const m = row.original
          return (
            <button
              key={m.slug}
              type="button"
              onClick={() => navigate({ to: '/models/$slug', params: { slug: m.slug } })}
              className={`${GRID} w-full cursor-pointer items-center border-b border-border px-3.5 py-[7px] text-left text-[12.5px] hover:bg-hover`}
              data-testid="ranking-row"
            >
              <span className="font-mono text-[11px] text-dim">{i + 1}</span>
              <span className="flex min-w-0 items-baseline gap-[7px]">
                <span className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                  {m.name}
                </span>
                <span className="flex-none text-[11px] text-mut">{m.org}</span>
                <ModelTag open={m.open} />
              </span>
              <span className="text-right font-mono text-[11px] text-mut">
                {fmtParams(m.params, m.active)}
              </span>
              <span className="text-right font-mono text-[11px] text-mut">{fmtCtx(m.ctxK)}</span>
              <span className="text-right">
                <span className="font-mono text-[11.5px] font-semibold">{m.index.toFixed(1)}</span>
                <InlineBar pct={Math.round(m.index)} className="mt-[3px]" />
              </span>
              {benchCols.map((c) => {
                const bounds = boundsBySlug.get(c.slug)
                const v = m.bench[c.slug]
                const pct = bounds ? normPct(v, bounds.normMin, bounds.normMax) : 0
                return (
                  <span key={c.slug} className="text-right">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: v == null ? 'var(--dim)' : 'var(--text)' }}
                    >
                      {v == null ? '—' : c.slug === 'arena' ? String(v) : v.toFixed(1)}
                    </span>
                    <InlineBar
                      pct={pct}
                      color={pct > 92 ? 'var(--acc)' : 'var(--border2)'}
                      className="mt-[3px]"
                    />
                  </span>
                )
              })}
            </button>
          )
        })}
      </div>
    </div>
  )
}
