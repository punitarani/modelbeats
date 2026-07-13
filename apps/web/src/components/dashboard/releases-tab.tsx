import { type CatalogSnapshot, fmtDate } from '@rankedmodel/shared'
import { Link } from '@tanstack/react-router'
import { CadenceBars } from '#/components/charts/cadence-bars'
import { arenaPct } from '#/components/charts/scales'
import { dashboardStats } from './dashboard-data'

/** Design's Releases variant: month-grouped feed + cadence + open-vs-closed frontier. */
export function ReleasesTab({ catalog }: { catalog: CatalogSnapshot }) {
  const stats = dashboardStats(catalog)
  const arenaBounds = catalog.benchmarks.find((b) => b.slug === 'arena')
  const arenaMin = arenaBounds?.normMin ?? 1000
  const arenaMax = arenaBounds?.normMax ?? 1500

  // month-grouped feed: 22 most recent (design)
  const feed: { month: string; items: typeof catalog.models }[] = []
  for (const m of [...catalog.models].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 22)) {
    const month = fmtDate(m.date)
    let group = feed.find((g) => g.month === month)
    if (!group) {
      group = { month, items: [] }
      feed.push(group)
    }
    group.items.push(m)
  }

  // quarters: 'YYYY Qn' → design label 'YY Qn
  const counts = new Map<string, number>()
  for (const m of catalog.models) {
    const [y, mo] = m.date.split('-') as [string, string]
    const key = `${y} Q${Math.floor((Number(mo) - 1) / 3) + 1}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const quarterKeys = [...counts.keys()].sort()
  const quarters = quarterKeys.map((k, i) => ({
    label: k.replace('20', "'"),
    count: counts.get(k) ?? 0,
    latest: i === quarterKeys.length - 1,
  }))

  const frontier = [
    { label: 'Closed frontier', m: stats.closedBest, color: 'var(--closed)' },
    { label: 'Open frontier', m: stats.openBest, color: 'var(--open)' },
  ].filter((f) => f.m?.bench.arena != null)

  const gapNote =
    stats.gapElo != null
      ? `The open frontier trails by ${stats.gapElo} Elo — roughly a ${Math.round(
          100 / (1 + 10 ** (-stats.gapElo / 400)),
        )}% head-to-head win rate. Effectively equivalent for many tasks.`
      : ''

  return (
    <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      {/* feed */}
      <div
        className="rounded-[10px] border border-border bg-card py-1.5"
        data-testid="release-feed"
      >
        {feed.map((g) => (
          <div key={g.month}>
            <div className="px-[18px] pt-3.5 pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-dim">
              {g.month}
            </div>
            {g.items.map((m) => (
              <Link
                key={m.slug}
                to="/models/$slug"
                params={{ slug: m.slug }}
                className="flex cursor-pointer items-center gap-3 border-l-2 border-transparent px-[18px] py-[9px] text-text no-underline hover:bg-hover hover:no-underline"
              >
                <span
                  className="size-[7px] flex-none rounded-full"
                  style={{ background: m.open ? 'var(--open)' : 'var(--closed)' }}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold">
                    {m.name} <span className="text-xs font-normal text-mut">· {m.org}</span>
                  </span>
                  <span className="mt-px block overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-mut">
                    {m.note}
                  </span>
                </span>
                <span className="ml-auto flex-none text-right">
                  <span className="block font-mono text-[11.5px]">{m.index.toFixed(1)}</span>
                  <span className="block font-mono text-[9.5px] text-dim">INDEX</span>
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* right rail */}
      <div className="flex flex-col gap-3.5">
        <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="text-[13px] font-semibold">Release cadence</div>
          <div className="mt-px text-[11px] text-mut">Tracked releases per quarter</div>
          <CadenceBars quarters={quarters} />
        </div>
        <div className="rounded-[10px] border border-border bg-card px-4 py-3.5">
          <div className="text-[13px] font-semibold">Open vs closed frontier</div>
          <div className="mt-px text-[11px] text-mut">Best Arena Elo by camp</div>
          <div className="mt-3 flex flex-col gap-2.5" data-testid="frontier">
            {frontier.map((f) => (
              <div key={f.label}>
                <div className="flex items-baseline text-xs">
                  <span className="font-semibold">{f.label}</span>
                  <span className="ml-auto font-mono text-[11px] text-mut">
                    {f.m?.name} · {f.m?.bench.arena}
                  </span>
                </div>
                <div className="mt-[5px] h-[5px] overflow-hidden rounded-[3px] bg-bar">
                  <div
                    className="h-full"
                    style={{
                      width: `${arenaPct(f.m?.bench.arena as number, arenaMin, arenaMax)}%`,
                      background: f.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="text-[11.5px] leading-normal text-mut" data-testid="gap-note">
              {gapNote}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
