import {
  CATEGORY_LABELS,
  type CatalogSnapshot,
  fmtScore,
  RADAR_AXES,
  type SnapshotModel,
  selectRadarAxes,
} from '@modelbeats/shared'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'
import { Radar } from '#/components/charts/radar'
import { fitYWindow } from '#/components/charts/scales'
import { QualityPriceScatter } from '#/components/charts/scatter'
import { CompareTable, SLOT_COLORS, SLOT_LABELS } from '#/components/compare/compare-table'
import { VerdictCard } from '#/components/compare/verdict-card'
import { scatterModels } from '#/components/dashboard/dashboard-data'
import { SearchSelect } from '#/components/search-select'
import { saveComparison } from '#/lib/saved'
import { modelOptionRanker } from '#/lib/search-rank'

export function CompareScreen({
  catalog,
  slugs,
  onChangeSlugs,
}: {
  catalog: CatalogSnapshot
  slugs: string[]
  onChangeSlugs: (slugs: string[]) => void
}) {
  const navigate = useNavigate()
  const bySlug = new Map(catalog.models.map((m) => [m.slug, m]))
  const slots = SLOT_LABELS.map((_, i) => bySlug.get(slugs[i] ?? '') ?? null)
  const active = slots
    .map((m, i) => ({ m, i }))
    .filter((x): x is { m: SnapshotModel; i: number } => x.m != null)
  const options = [...catalog.models].sort((a, b) => a.name.localeCompare(b.name))
  const modelRanker = useMemo(() => modelOptionRanker(catalog.models), [catalog.models])

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

  // Field-context scatter: the whole priced+ranked field, with the compared models labeled
  // so the pair/trio/quartet reads against the Pareto frontier, not in a vacuum.
  const selectedSlugs = useMemo(() => new Set(active.map(({ m }) => m.slug)), [active])
  const scatterPoints = useMemo(
    () =>
      scatterModels(catalog).map((m) => ({
        slug: m.slug,
        name: m.name,
        outputPrice: (m.price as { output: number }).output,
        index: m.index,
        open: m.open,
        labeled: selectedSlugs.has(m.slug),
      })),
    [catalog, selectedSlugs],
  )
  const scatterY = useMemo(() => {
    const w = fitYWindow(scatterPoints.map((p) => p.index))
    return w.yMin < 0 ? { ...w, yMin: 0, yTicks: w.yTicks.filter((t) => t >= 0) } : w
  }, [scatterPoints])
  const unplotted = active.filter(({ m }) => !scatterPoints.some((p) => p.slug === m.slug))

  const saveNameRef = useRef<HTMLInputElement>(null)
  const [hasSaveName, setHasSaveName] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [copied, setCopied] = useState(false)

  const setSlot = (i: number, slug: string) => {
    const next = SLOT_LABELS.map((_, j) => slugs[j] ?? '')
    next[i] = slug
    onChangeSlugs(next)
  }

  return (
    <div className="max-w-[1400px] animate-fadeup px-6 py-5 pb-12">
      <h1 className="text-lg font-semibold tracking-[-0.02em]">Compare models</h1>
      <div className="mt-0.5 text-xs text-mut">
        Up to four models side by side — specs, capabilities, every covered benchmark, provenance
        and field context. Best value per row is highlighted.
      </div>

      {/* selects + actions */}
      <div className="mt-4 flex flex-wrap items-end gap-2.5">
        {SLOT_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col gap-1">
            <span
              className="font-mono text-[9.5px] uppercase tracking-[0.06em]"
              style={{ color: SLOT_COLORS[i] }}
            >
              {label}
            </span>
            <SearchSelect
              value={slugs[i] ?? ''}
              onValueChange={(slug) => setSlot(i, slug)}
              options={[
                { value: '', label: '— none —' },
                // A slug already in another slot is excluded here — comparing a model
                // against itself is never the intent (fixes the accidental B=C pick).
                ...options
                  .filter((o) => o.slug === slugs[i] || !slugs.includes(o.slug))
                  .map((o) => ({ value: o.slug, label: `${o.name} — ${o.org}` })),
              ]}
              rankOptions={modelRanker}
              aria-label={label}
              placeholder={i < 2 ? 'Select…' : '+ add model'}
              searchPlaceholder="Search models…"
              testid={`compare-slot-${i}`}
              className="min-w-[200px]"
            />
          </div>
        ))}
        <div className="ml-auto flex items-end gap-1.5">
          {/* Uncontrolled + ref-read + no disabled semantics: hydration can reset a
              controlled input's DOM value if input lands before React attaches to this
              subtree, and any disabled/aria-disabled marker would let the click be
              blocked forever — the guard lives in the handler instead. */}
          <input
            ref={saveNameRef}
            type="text"
            defaultValue=""
            onInput={(e) => setHasSaveName(e.currentTarget.value.trim().length > 0)}
            placeholder="Name this comparison…"
            className="w-[160px] rounded-md border border-border bg-panel2 px-2 py-[5px] text-xs outline-none focus:border-acc"
            data-testid="save-name"
          />
          <button
            type="button"
            data-inactive={!hasSaveName || active.length === 0 ? '' : undefined}
            onClick={() => {
              const name = saveNameRef.current?.value.trim() ?? ''
              if (!name || active.length === 0) return
              saveComparison(name, slugs.filter(Boolean).join(','))
              if (saveNameRef.current) saveNameRef.current.value = ''
              setHasSaveName(false)
              setSavedFlash(true)
              setTimeout(() => setSavedFlash(false), 1500)
            }}
            className="cursor-pointer rounded-md border border-border bg-panel2 px-2.5 py-[5px] text-xs text-mut hover:text-text data-[inactive]:cursor-default data-[inactive]:opacity-50"
            data-testid="save-comparison"
          >
            {savedFlash ? 'Saved ✓' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator === 'undefined') return
              navigator.clipboard?.writeText(window.location.href).catch(() => {})
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="cursor-pointer rounded-md border border-border bg-panel2 px-2.5 py-[5px] text-xs text-mut hover:text-text"
            data-testid="copy-link"
          >
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
          <Link to="/saved" className="pb-[5px] text-[11.5px]">
            Saved →
          </Link>
        </div>
      </div>

      <div className="mt-[18px] grid grid-cols-1 items-start gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <CompareTable catalog={catalog} slots={slots} />

        <div className="flex min-w-0 flex-col gap-3.5">
          <VerdictCard catalog={catalog} slots={slots} colors={SLOT_COLORS} />

          {/* radar — honest + adaptive capability profile (D24) */}
          <div className="rounded-[10px] border border-border bg-card p-4">
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
                                  <span
                                    className="block h-[5px] rounded-sm"
                                    style={{
                                      width: `${Math.max(3, v)}%`,
                                      maxWidth: '120px',
                                      background: SLOT_COLORS[i],
                                    }}
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
                <Link
                  key={m.slug}
                  to="/models/$slug"
                  params={{ slug: m.slug }}
                  className="flex items-baseline gap-[7px] text-xs text-text no-underline hover:no-underline"
                >
                  <span
                    className="size-[9px] self-center rounded-[3px]"
                    style={{ background: SLOT_COLORS[i] }}
                  />
                  <span className="font-semibold hover:underline">{m.name}</span>
                  <span
                    className="font-mono text-[10px] text-dim"
                    title={`Tested on ${coverageOf(m)} of 6 capability categories`}
                  >
                    {coverageOf(m)}/6
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-mut">
                    {m.index.toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* field context — where the picks sit on the quality-vs-price field */}
          <div className="rounded-[10px] border border-border bg-card p-4">
            <div className="text-[13px] font-semibold">Field context</div>
            <div className="mt-px text-[11px] text-mut">
              Frontier Elo vs. output price across the priced field — compared models are labeled.
              Click a point: fills the first open slot, or opens the model's page when the table is
              full (or it's already in).
            </div>
            <QualityPriceScatter
              points={scatterPoints}
              yWindow={scatterY}
              onSelect={(slug) => {
                const free = slots.findIndex((s) => s == null)
                if (!selectedSlugs.has(slug) && free !== -1) setSlot(free, slug)
                else navigate({ to: '/models/$slug', params: { slug } })
              }}
            />
            {unplotted.length > 0 && (
              <div className="mt-1 text-[10px] leading-snug text-dim">
                {unplotted.map(({ m }) => m.name).join(' · ')} not plotted — no hosted API price or
                unrated.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-dim">
        Scores carry per-row provenance (self-reported marks are flagged) — see{' '}
        <Link to="/methodology">methodology</Link> · data as of {catalog.asOf}.
      </div>
    </div>
  )
}
