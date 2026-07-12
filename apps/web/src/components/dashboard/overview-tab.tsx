import { type CatalogSnapshot, fmtDate } from '@rankedmodel/shared'
import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { arenaPct } from '#/components/charts/scales'
import { QualityPriceScatter } from '#/components/charts/scatter'
import { ModelTag } from '#/components/model-tag'
import { arenaTop, dashboardMovers, latestReleases, SCATTER_LABELED } from './dashboard-data'

export function OverviewTab({ catalog }: { catalog: CatalogSnapshot }) {
  const navigate = useNavigate()
  const [qcA, setQcA] = useState('claude-opus-4-8')
  const [qcB, setQcB] = useState('deepseek-v4-5')
  const scatterPoints = catalog.models
    .filter((m) => m.price && m.bench.arena != null)
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      outputPrice: (m.price as { output: number }).output,
      elo: m.bench.arena as number,
      open: m.open,
      labeled: SCATTER_LABELED.has(m.slug),
    }))
  const options = [...catalog.models].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.9fr)_minmax(280px,1fr)]">
      <div className="flex min-w-0 flex-col gap-3.5">
        {/* scatter */}
        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <div className="text-[13px] font-semibold">Quality vs. price</div>
            <div className="text-[11px] text-mut">Arena Elo against output price, log scale</div>
            <div className="ml-auto flex gap-3 text-[11px] text-mut">
              <span className="flex items-center gap-[5px]">
                <span className="size-2 rounded-full bg-open" />
                Open weights
              </span>
              <span className="flex items-center gap-[5px]">
                <span className="size-2 rounded-full bg-closed" />
                Closed
              </span>
            </div>
          </div>
          <QualityPriceScatter
            points={scatterPoints}
            onSelect={(slug) => navigate({ to: '/models/$slug', params: { slug } })}
          />
        </div>

        {/* latest releases */}
        <div className="overflow-hidden rounded-[10px] border border-border bg-card">
          <div className="flex items-baseline px-4 pt-[13px] pb-2.5">
            <div className="text-[13px] font-semibold">Latest releases</div>
            <Link to="/models" className="ml-auto text-[11.5px]">
              Model explorer →
            </Link>
          </div>
          {latestReleases(catalog).map((m) => (
            <Link
              key={m.slug}
              to="/models/$slug"
              params={{ slug: m.slug }}
              className="grid cursor-pointer grid-cols-[92px_minmax(0,1.5fr)_1fr_90px_70px] items-center gap-2.5 border-t border-border px-4 py-2 text-[12.5px] text-text no-underline hover:bg-hover hover:no-underline"
              data-testid="latest-row"
            >
              <span className="font-mono text-[11px] text-dim">{fmtDate(m.date)}</span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                {m.name}
              </span>
              <span className="text-xs text-mut">{m.org}</span>
              <ModelTag open={m.open} />
              <span className="text-right font-mono text-[11.5px]">{m.index.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* right rail */}
      <div className="flex min-w-0 flex-col gap-3.5">
        <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="flex items-baseline">
            <div className="text-[13px] font-semibold">Arena leaderboard</div>
            <Link to="/rankings" className="ml-auto text-[11.5px]">
              All rankings →
            </Link>
          </div>
          <div className="mt-[11px] flex flex-col gap-[7px]" data-testid="arena-rail">
            {arenaTop(catalog).map((m, i) => (
              <Link
                key={m.slug}
                to="/models/$slug"
                params={{ slug: m.slug }}
                className="cursor-pointer text-text no-underline hover:no-underline"
              >
                <div className="flex items-baseline gap-[7px] text-xs">
                  <span className="w-3.5 font-mono text-[10px] text-dim">{i + 1}</span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                    {m.name}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-mut">{m.bench.arena}</span>
                </div>
                <div className="mt-1 ml-[21px] h-1 overflow-hidden rounded-sm bg-bar">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${arenaPct(m.bench.arena as number)}%`,
                      background: m.open ? 'var(--open)' : 'var(--closed)',
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="text-[13px] font-semibold">Biggest movers</div>
          <div className="mt-px text-[11px] text-mut">Index gain over previous family release</div>
          <div className="mt-[11px] flex flex-col gap-[9px]" data-testid="movers">
            {dashboardMovers(catalog).map((mv) => (
              <Link
                key={mv.slug}
                to="/models/$slug"
                params={{ slug: mv.slug }}
                className="flex cursor-pointer items-baseline gap-2 text-xs text-text no-underline hover:no-underline"
              >
                <span className="font-semibold">{mv.name}</span>
                <span className="text-[11px] text-dim">vs {mv.prevName}</span>
                <span className="ml-auto font-mono text-[11px] text-open">+{mv.delta}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="text-[13px] font-semibold">Quick compare</div>
          <div className="mt-2.5 flex flex-col gap-2">
            <select
              value={qcA}
              onChange={(e) => setQcA(e.target.value)}
              className="w-full rounded-md border border-border bg-panel2 px-2 py-[5px] text-xs outline-none focus:border-acc"
              data-testid="qc-a"
            >
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name} — {o.org}
                </option>
              ))}
            </select>
            <select
              value={qcB}
              onChange={(e) => setQcB(e.target.value)}
              className="w-full rounded-md border border-border bg-panel2 px-2 py-[5px] text-xs outline-none focus:border-acc"
              data-testid="qc-b"
            >
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name} — {o.org}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigate({ to: '/compare', search: { m: `${qcA},${qcB}` } })}
              className="cursor-pointer rounded-md border-none bg-acc py-[7px] text-xs font-semibold text-bg"
              data-testid="qc-go"
            >
              Compare →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
