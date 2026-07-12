import { CATEGORY_LABELS, type CatalogSnapshot } from '@rankedmodel/shared'
import { Link } from '@tanstack/react-router'
import { InlineBar } from '#/components/charts/inline-bar'
import { normPct } from '#/components/charts/scales'

/** Design's Benchmarks variant: card per benchmark, top-5 bars, category label. */
export function BenchTab({ catalog }: { catalog: CatalogSnapshot }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
      {catalog.benchmarks.map((b) => {
        const top = catalog.models
          .filter((m) => m.bench[b.slug] != null)
          .sort((x, y) => (y.bench[b.slug] as number) - (x.bench[b.slug] as number))
          .slice(0, 5)
        return (
          <div
            key={b.slug}
            className="rounded-[10px] border border-border bg-card px-[15px] py-[13px]"
            data-testid="bench-card"
          >
            <div className="flex items-baseline gap-2">
              <Link
                to="/benchmarks/$slug"
                params={{ slug: b.slug }}
                className="text-[13px] font-semibold text-text hover:text-acc"
              >
                {b.name}
              </Link>
              <div className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.05em] text-dim">
                {CATEGORY_LABELS[b.category]}
              </div>
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {top.map((m) => {
                const v = m.bench[b.slug] as number
                return (
                  <Link
                    key={m.slug}
                    to="/models/$slug"
                    params={{ slug: m.slug }}
                    className="cursor-pointer text-text no-underline hover:no-underline"
                  >
                    <div className="flex items-baseline gap-1.5 text-[11.5px]">
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                        {m.name}
                      </span>
                      <span className="ml-auto font-mono text-[10.5px] text-mut">
                        {b.slug === 'arena' ? v : `${v.toFixed(1)}%`}
                      </span>
                    </div>
                    <InlineBar
                      pct={normPct(v, b.normMin, b.normMax)}
                      color={m.open ? 'var(--open)' : 'var(--closed)'}
                      className="mt-[3px]"
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
