import {
  CATEGORY_LABELS,
  type CatalogSnapshot,
  fmtCtx,
  fmtDate,
  fmtScore,
  RADAR_AXES,
  type SnapshotModel,
  selectRadarAxes,
} from '@modelbeats/shared'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { InlineBar } from '#/components/charts/inline-bar'
import { Radar } from '#/components/charts/radar'
import { normPct } from '#/components/charts/scales'
import { SearchSelect } from '#/components/search-select'
import { saveComparison } from '#/lib/saved'

/** Slot colors per the design: A=accent, B=open-green, C=closed-purple. */
const SLOT_COLORS = ['var(--acc)', 'var(--open)', 'var(--closed)'] as const
const SLOT_LABELS = ['Model A', 'Model B', 'Model C'] as const

interface SpecDef {
  label: string
  get: (m: SnapshotModel) => string
  num?: (m: SnapshotModel) => number | null
  kind?: 'max' | 'min'
}

const SPEC_DEFS: SpecDef[] = [
  { label: 'Organization', get: (m) => m.org },
  { label: 'Released', get: (m) => fmtDate(m.date) },
  { label: 'Weights', get: (m) => (m.open ? 'Open' : 'Closed') },
  {
    label: 'Parameters',
    get: (m) => (m.params == null ? 'undisclosed' : `${m.params}B`),
    num: (m) => m.params,
    kind: 'max',
  },
  { label: 'Active params', get: (m) => (m.active ? `${m.active}B` : '—') },
  { label: 'Context', get: (m) => fmtCtx(m.ctxK), num: (m) => m.ctxK, kind: 'max' },
  { label: 'Architecture', get: (m) => m.arch },
  { label: 'License', get: (m) => m.license },
  {
    label: 'Price in /M',
    get: (m) => (m.price ? `$${m.price.input}` : '—'),
    num: (m) => m.price?.input ?? null,
    kind: 'min',
  },
  {
    label: 'Price out /M',
    get: (m) => (m.price ? `$${m.price.output}` : '—'),
    num: (m) => m.price?.output ?? null,
    kind: 'min',
  },
  {
    label: 'VRAM @ Q4',
    get: (m) => (m.vramQ4 != null ? `${m.vramQ4} GB` : '—'),
    num: (m) => m.vramQ4,
    kind: 'min',
  },
  {
    label: 'Elo rating',
    get: (m) => m.index.toFixed(1),
    num: (m) => m.index,
    kind: 'max',
  },
]

export function CompareScreen({
  catalog,
  slugs,
  onChangeSlugs,
}: {
  catalog: CatalogSnapshot
  slugs: [string, string, string]
  onChangeSlugs: (slugs: [string, string, string]) => void
}) {
  const bySlug = new Map(catalog.models.map((m) => [m.slug, m]))
  const slots = slugs.map((s) => bySlug.get(s) ?? null)
  const active = slots
    .map((m, i) => ({ m, i }))
    .filter((x): x is { m: SnapshotModel; i: number } => x.m != null)
  const options = [...catalog.models].sort((a, b) => a.name.localeCompare(b.name))
  const benchRows = catalog.benchmarks.filter((b) =>
    active.some(({ m }) => m.bench[b.slug] != null),
  )

  // Adaptive capability radar (D24): chart only the categories at least one selected model covers,
  // so an untested axis is dropped rather than collapsed to a false zero. `null` values flow through
  // to the radar untouched (untested), never coerced to 0.
  const radarAxes = selectRadarAxes(active.map(({ m }) => m.categoryIdx))
  const radarSeries = active.map(({ m, i }) => ({
    color: SLOT_COLORS[i],
    values: radarAxes.map((a) => {
      const v = m.categoryIdx[a.category]
      return v == null ? null : v / 100
    }),
  }))
  const radarTooltips = radarAxes.map((a) => ({
    title: CATEGORY_LABELS[a.category],
    rows: active.map(({ m, i }) => {
      const parts = catalog.benchmarks
        .filter((b) => b.category === a.category)
        .map((b) => {
          const v = m.bench[b.slug]
          return v == null ? null : `${b.name} ${fmtScore(v, b.unit)}`
        })
        .filter((s): s is string => s != null)
      return {
        color: SLOT_COLORS[i],
        name: m.name,
        text: parts.length ? parts.join(' · ') : 'Untested',
      }
    }),
  }))
  // Categories no selected model covers — hidden from the radar, named so their absence is explicit.
  const hiddenAxes = active.length
    ? RADAR_AXES.filter((a) => active.every(({ m }) => m.categoryIdx[a.category] == null))
    : []
  const coverageOf = (m: SnapshotModel) =>
    RADAR_AXES.filter((a) => m.categoryIdx[a.category] != null).length

  const [saveName, setSaveName] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const setSlot = (i: number, slug: string) => {
    const next = [...slugs] as [string, string, string]
    next[i] = slug
    onChangeSlugs(next)
  }

  return (
    <div className="max-w-[1100px] animate-fadeup px-6 py-5 pb-12">
      <h1 className="text-lg font-semibold tracking-[-0.02em]">Compare models</h1>
      <div className="mt-0.5 text-xs text-mut">
        Side by side across specs, benchmarks and capability profile. Best value per row is
        highlighted.
      </div>

      {/* selects */}
      <div className="mt-4 flex flex-wrap gap-2.5">
        {SLOT_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col gap-1">
            <span
              className="font-mono text-[9.5px] uppercase tracking-[0.06em]"
              style={{ color: SLOT_COLORS[i] }}
            >
              {label}
            </span>
            <SearchSelect
              value={slugs[i]}
              onValueChange={(slug) => setSlot(i, slug)}
              options={[
                { value: '', label: '— none —' },
                ...options.map((o) => ({ value: o.slug, label: `${o.name} — ${o.org}` })),
              ]}
              aria-label={label}
              searchPlaceholder="Search models…"
              testid={`compare-slot-${i}`}
              className="min-w-[210px]"
            />
          </div>
        ))}
        <div className="ml-auto flex items-end gap-1.5">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Name this comparison…"
            className="w-[170px] rounded-md border border-border bg-panel2 px-2 py-[5px] text-xs outline-none focus:border-acc"
            data-testid="save-name"
          />
          <button
            type="button"
            disabled={!saveName.trim() || active.length === 0}
            onClick={() => {
              saveComparison(saveName.trim(), slugs.filter(Boolean).join(','))
              setSaveName('')
              setSavedFlash(true)
              setTimeout(() => setSavedFlash(false), 1500)
            }}
            className="cursor-pointer rounded-md border border-border bg-panel2 px-2.5 py-[5px] text-xs text-mut hover:text-text disabled:cursor-default disabled:opacity-50"
            data-testid="save-comparison"
          >
            {savedFlash ? 'Saved ✓' : 'Save'}
          </button>
          <Link to="/saved" className="pb-[5px] text-[11.5px]">
            Saved →
          </Link>
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* specs */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-card">
            <div className="px-4 pt-[13px] pb-[9px] text-[13px] font-semibold">Specifications</div>
            {SPEC_DEFS.map((d) => {
              let bestI = -1
              if (d.kind && d.num && active.length > 1) {
                let bestV: number | null = null
                for (const { m, i } of active) {
                  const n = d.num(m)
                  if (n == null) continue
                  if (bestV == null || (d.kind === 'max' ? n > bestV : n < bestV)) {
                    bestV = n
                    bestI = i
                  }
                }
              }
              return (
                <div
                  key={d.label}
                  className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] items-baseline gap-2 border-t border-border px-4 py-[7px] text-xs"
                  data-testid={`spec-${d.label.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}
                >
                  <span className="text-[11.5px] text-mut">{d.label}</span>
                  {slots.map((m, i) => (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3 slots
                      key={i}
                      title={m ? d.get(m) : ''}
                      className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px]"
                      style={{
                        color: i === bestI ? SLOT_COLORS[i] : 'var(--text)',
                        fontWeight: i === bestI ? 600 : 400,
                      }}
                    >
                      {m ? d.get(m) : ''}
                    </span>
                  ))}
                </div>
              )
            })}
          </div>

          {/* benchmarks — only rows some compared model was actually evaluated on (D20), so
              the card isn't a wall of em-dashes over 100+ untested benchmarks. */}
          <div className="overflow-hidden rounded-[10px] border border-border bg-card">
            <div className="px-4 pt-[13px] pb-[9px] text-[13px] font-semibold">Benchmarks</div>
            {benchRows.length === 0 && (
              <div className="border-t border-border px-4 py-3 text-[11.5px] text-mut">
                No shared benchmark results across the selected models.
              </div>
            )}
            {benchRows.map((b) => {
              // "Best" only means something when ≥2 selected models actually scored this row.
              let bestI = -1
              let bestV: number | null = null
              let covered = 0
              for (const { m, i } of active) {
                const v = m.bench[b.slug]
                if (v == null) continue
                covered++
                if (bestV == null || v > bestV) {
                  bestV = v
                  bestI = i
                }
              }
              const highlight = covered > 1
              return (
                <div
                  key={b.slug}
                  className="grid grid-cols-[150px_repeat(3,minmax(0,1fr))] items-center gap-2 border-t border-border px-4 py-2 text-xs"
                >
                  <span className="text-[11.5px] text-mut">{b.name}</span>
                  {slots.map((m, i) => {
                    const v = m?.bench[b.slug]
                    return (
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3 slots
                      <span key={i} className="min-w-0">
                        <span
                          className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px]"
                          style={{
                            color: highlight && i === bestI ? SLOT_COLORS[i] : 'var(--text)',
                            fontWeight: highlight && i === bestI ? 600 : 400,
                          }}
                        >
                          {m == null ? '' : v == null ? '—' : fmtScore(v, b.unit)}
                        </span>
                        {m != null && (
                          <InlineBar
                            pct={v == null ? 0 : normPct(v, b.normMin, b.normMax, 3)}
                            color={SLOT_COLORS[i]}
                            className="mt-[3px] max-w-[110px]"
                          />
                        )}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* radar — honest + adaptive capability profile (D24) */}
        <div className="rounded-[10px] border border-border bg-card p-4 lg:sticky lg:top-[63px]">
          <div className="text-[13px] font-semibold">Capability profile</div>
          <div className="mt-px text-[11px] text-mut">
            Normalized against the tracked field · only categories a selected model was tested on
          </div>
          <div data-testid="compare-radar">
            {active.length === 0 ? (
              <div className="py-8 text-center text-[11.5px] text-mut">
                Select a model to see its capability profile.
              </div>
            ) : radarAxes.length >= 3 ? (
              <Radar axes={radarAxes} series={radarSeries} tooltips={radarTooltips} />
            ) : (
              <div className="mt-2 flex flex-col gap-2" data-testid="compare-radar-fallback">
                <div className="text-[10px] leading-snug text-dim">
                  Too few tested categories for a radar — showing coverage directly.
                </div>
                {RADAR_AXES.map((a) => (
                  <div key={a.key} className="grid grid-cols-[64px_1fr] items-start gap-2">
                    <span className="mt-[2px] font-mono text-[10px] text-mut">{a.key}</span>
                    <div className="flex flex-col gap-1">
                      {active.map(({ m, i }) => {
                        const v = m.categoryIdx[a.category]
                        return (
                          <div key={m.slug} className="flex items-center gap-1.5">
                            {v == null ? (
                              <span className="text-[10px] text-dim">untested</span>
                            ) : (
                              <>
                                <InlineBar
                                  pct={v}
                                  color={SLOT_COLORS[i]}
                                  className="max-w-[120px]"
                                />
                                <span className="font-mono text-[10px] text-mut">
                                  {v.toFixed(0)}
                                </span>
                              </>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {radarAxes.length >= 3 && hiddenAxes.length > 0 && (
            <div className="mt-1.5 text-[10px] leading-snug text-dim">
              {hiddenAxes.map((a) => a.key).join(' · ')} hidden — untested by{' '}
              {active.length > 1 ? 'all selected models' : 'this model'}, so not charted.
            </div>
          )}
          <div className="mt-2 flex flex-col gap-[5px]" data-testid="compare-legend">
            {active.map(({ m, i }) => (
              <div key={m.slug} className="flex items-baseline gap-[7px] text-xs">
                <span
                  className="size-[9px] self-center rounded-[3px]"
                  style={{ background: SLOT_COLORS[i] }}
                />
                <span className="font-semibold">{m.name}</span>
                <span
                  className="font-mono text-[10px] text-dim"
                  title={`Tested on ${coverageOf(m)} of 6 capability categories`}
                >
                  {coverageOf(m)}/6
                </span>
                <span className="ml-auto font-mono text-[11px] text-mut">{m.index.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
