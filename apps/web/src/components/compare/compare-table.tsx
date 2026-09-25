import {
  BENCHMARK_CATEGORIES,
  CAPABILITY_KEYS,
  CAPABILITY_LABELS,
  CATEGORY_LABELS,
  type CatalogSnapshot,
  fmtCtx,
  fmtDate,
  fmtParams,
  fmtScore,
  LICENSE_CLASS_SHORT,
  licenseClass,
  type SnapshotBenchmark,
  type SnapshotModel,
} from '@modelbeats/shared'
import { Link } from '@tanstack/react-router'
import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { InlineBar } from '#/components/charts/inline-bar'
import { normPct } from '#/components/charts/scales'
import { ModelTag } from '#/components/model-tag'

const CAP_ORDER = CAPABILITY_KEYS

export const SLOT_COLORS = ['var(--acc)', 'var(--open)', 'var(--closed)', 'var(--slotd)'] as const
export const SLOT_LABELS = ['Model A', 'Model B', 'Model C', 'Model D'] as const

const LABEL_W = 158
const FIELD_W = 92
const EMPTY: Set<number> = new Set()

type Kind = 'max' | 'min'

interface SpecDef {
  key: string
  label: string
  get: (m: SnapshotModel, ctx: Ctx) => string
  num?: (m: SnapshotModel, ctx: Ctx) => number | null
  kind?: Kind
  /** Rich cell content (links, chips); overrides the plain-text `get` rendering. */
  render?: (m: SnapshotModel, ctx: Ctx) => React.ReactNode
}

interface Ctx {
  catalog: CatalogSnapshot
  bySlug: Map<string, SnapshotModel>
  /** benchmarks where ≥2 selected models were scored — the win-counting field. */
  contested: SnapshotBenchmark[]
  asOfMs: number
  active: SnapshotModel[]
}

function monthsAgo(iso: string, asOfMs: number): number {
  return Math.max(0, Math.floor((asOfMs - Date.parse(`${iso}T00:00:00Z`)) / 2_629_800_000))
}

function blended(p: { input: number; output: number } | null): number | null {
  return p == null ? null : (3 * p.input + p.output) / 4
}

function fmtMoney(v: number): string {
  return `$${Number(v.toFixed(2))}`
}

function benchCount(m: SnapshotModel): number {
  let n = 0
  for (const v of Object.values(m.bench)) if (v != null) n++
  return n
}

function catCount(m: SnapshotModel): number {
  let n = 0
  for (const v of Object.values(m.categoryIdx)) if (v != null) n++
  return n
}

function wins(m: SnapshotModel, ctx: Ctx, others: SnapshotModel[]): number {
  let n = 0
  for (const b of ctx.contested) {
    const v = m.bench[b.slug]
    if (v == null) continue
    if (others.every((o) => (o.bench[b.slug] ?? Number.NEGATIVE_INFINITY) < v)) n++
  }
  return n
}

/** Indices tied at the extremum of a row's numeric values (empty when <2 models have data). */
function bestSet(
  slots: (SnapshotModel | null)[],
  num: (m: SnapshotModel) => number | null,
  kind: Kind,
): Set<number> {
  let best: number | null = null
  let covered = 0
  for (const m of slots) {
    if (!m) continue
    const v = num(m)
    if (v == null) continue
    covered++
    if (best == null || (kind === 'max' ? v > best : v < best)) best = v
  }
  const out = new Set<number>()
  if (covered < 2 || best == null) return out
  slots.forEach((m, i) => {
    if (m && num(m) === best) out.add(i)
  })
  return out
}

const SPEC_SECTIONS: { title: string; rows: SpecDef[] }[] = [
  {
    title: 'Overview',
    rows: [
      {
        key: 'elo-rating',
        label: 'Frontier Elo',
        get: (m) => (Object.keys(m.bench).length > 0 ? m.index.toFixed(1) : '—'),
        num: (m) => (Object.keys(m.bench).length > 0 ? m.index : null),
        kind: 'max',
      },
      {
        key: 'rank',
        label: 'Overall rank',
        get: (m) => (m.ranked && m.rank != null ? `#${m.rank}` : 'unrated'),
        num: (m) => (m.ranked ? m.rank : null),
        kind: 'min',
      },
      {
        key: 'bench-coverage',
        label: 'Benchmarks tested',
        get: (m, c) => `${benchCount(m)} / ${c.catalog.benchmarks.length}`,
        num: benchCount,
        kind: 'max',
      },
      {
        key: 'cat-coverage',
        label: 'Categories covered',
        get: (m) => `${catCount(m)}/7`,
        num: catCount,
        kind: 'max',
      },
      {
        key: 'bench-wins',
        label: 'Benchmark wins',
        get: (m, c) => {
          const others = c.active.filter((o) => o.slug !== m.slug)
          return others.length ? String(wins(m, c, others)) : '—'
        },
        num: (m, c) => {
          const others = c.active.filter((o) => o.slug !== m.slug)
          return others.length ? wins(m, c, others) : null
        },
        kind: 'max',
      },
      {
        key: 'value',
        label: 'Elo per $ out',
        get: (m) => (m.price ? String(Math.round(m.index / m.price.output)) : '—'),
        num: (m) => (m.price && m.index > 0 ? m.index / m.price.output : null),
        kind: 'max',
      },
    ],
  },
  {
    title: 'Specifications',
    rows: [
      { key: 'organization', label: 'Organization', get: (m) => m.org },
      { key: 'family', label: 'Family', get: (m) => m.family },
      {
        key: 'released',
        label: 'Released',
        get: (m, c) => {
          const mo = monthsAgo(m.date, c.asOfMs)
          return mo > 0 ? `${fmtDate(m.date)} · ${mo}mo ago` : fmtDate(m.date)
        },
        num: (m) => Date.parse(`${m.date}T00:00:00Z`),
        kind: 'max',
      },
      {
        key: 'status',
        label: 'Status',
        get: (m) =>
          `${m.status}${m.effortLabel ? ` · ${m.effortLabel}` : ''}${m.isDefaultConfig ? '' : ' · variant'}`,
      },
      {
        key: 'succeeds',
        label: 'Succeeds',
        get: (m, c) => (m.predecessor ? (c.bySlug.get(m.predecessor)?.name ?? m.predecessor) : '—'),
      },
      {
        key: 'weights',
        label: 'Weights',
        get: (m) =>
          m.openness === 'closed'
            ? 'Closed'
            : m.openness === 'open-source'
              ? 'Open source'
              : 'Open weights',
      },
      {
        key: 'license',
        label: 'License',
        get: (m) => `${m.license} · ${LICENSE_CLASS_SHORT[licenseClass(m.license, m.openness)]}`,
      },
      { key: 'architecture', label: 'Architecture', get: (m) => m.arch },
      {
        key: 'parameters',
        label: 'Parameters',
        get: (m) => (m.params == null ? 'undisclosed' : fmtParams(m.params, m.active)),
        num: (m) => m.params,
        kind: 'max',
      },
      {
        key: 'context',
        label: 'Context',
        get: (m) => fmtCtx(m.ctxK),
        num: (m) => m.ctxK,
        kind: 'max',
      },
      { key: 'modalities', label: 'Modalities', get: (m) => m.modalities.join(' · ') },
      {
        key: 'languages',
        label: 'Languages',
        get: (m) => (m.langCount ? `${m.langCount}+` : '—'),
        num: (m) => m.langCount,
        kind: 'max',
      },
      { key: 'api', label: 'Hosted API', get: (m) => (m.apiAvailable ? 'Yes' : '—') },
    ],
  },
  {
    title: 'Price & deployment',
    rows: [
      {
        key: 'price-in-m',
        label: 'Price in /M',
        get: (m) => (m.price ? `$${m.price.input}` : '—'),
        num: (m) => m.price?.input ?? null,
        kind: 'min',
      },
      {
        key: 'price-out-m',
        label: 'Price out /M',
        get: (m) => (m.price ? `$${m.price.output}` : '—'),
        num: (m) => m.price?.output ?? null,
        kind: 'min',
      },
      {
        key: 'price-blended',
        label: 'Blended 3:1 /M',
        get: (m) => {
          const v = blended(m.price)
          return v == null ? '—' : fmtMoney(v)
        },
        num: (m) => blended(m.price),
        kind: 'min',
      },
      {
        key: 'vram-q4',
        label: 'VRAM @ Q4',
        get: (m) => (m.vramQ4 != null ? `${m.vramQ4} GB` : '—'),
        num: (m) => m.vramQ4,
        kind: 'min',
      },
      {
        key: 'vram-fp16',
        label: 'VRAM @ FP16',
        get: (m) => (m.vramFp16 != null ? `${m.vramFp16} GB` : '—'),
        num: (m) => m.vramFp16,
        kind: 'min',
      },
      {
        key: 'smallest-gpu',
        label: 'Smallest GPU (Q4)',
        get: (m, c) => {
          if (m.vramQ4 == null) return m.open ? '—' : 'API only'
          const fit = c.catalog.gpus
            .filter((g) => g.vramGb >= (m.vramQ4 as number) * 1.08)
            .sort((a, b) => a.vramGb - b.vramGb)[0]
          return fit ? fit.name : 'No single GPU'
        },
        num: (m, c) => {
          if (m.vramQ4 == null) return null
          const fit = c.catalog.gpus
            .filter((g) => g.vramGb >= (m.vramQ4 as number) * 1.08)
            .sort((a, b) => a.vramGb - b.vramGb)[0]
          return fit ? fit.vramGb : null
        },
        kind: 'min',
      },
      {
        key: 'tps-4090',
        label: '~tok/s RTX 4090',
        get: (m) => (m.tps4090 != null ? `~${m.tps4090}` : '—'),
        num: (m) => m.tps4090,
        kind: 'max',
      },
      {
        key: 'quants',
        label: 'Quantizations',
        get: (m) => (m.quants.length ? m.quants.join(' · ') : '—'),
      },
      {
        key: 'links',
        label: 'Links',
        get: (m) =>
          [
            m.links.hf ? 'HuggingFace' : null,
            m.links.gh ? 'GitHub' : null,
            m.links.docs ? 'Docs' : null,
          ]
            .filter(Boolean)
            .join(' · ') || '—',
        render: (m) => {
          const links: { kind: string; href: string }[] = []
          if (m.links.hf) links.push({ kind: 'HF', href: `https://huggingface.co/${m.links.hf}` })
          if (m.links.gh) links.push({ kind: 'GH', href: `https://github.com/${m.links.gh}` })
          if (m.links.docs)
            // docs entries mix bare hosts and full URLs in the corpus — only prepend when bare.
            links.push({
              kind: 'DOCS',
              href: /^https?:\/\//.test(m.links.docs) ? m.links.docs : `https://${m.links.docs}`,
            })
          if (links.length === 0) return '—'
          return (
            <span className="flex flex-wrap gap-1">
              {links.map((l) => (
                <a
                  key={l.kind}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-border px-[5px] py-px font-mono text-[9px] text-mut hover:border-acc hover:text-acc hover:no-underline"
                >
                  {l.kind}
                </a>
              ))}
            </span>
          )
        },
      },
    ],
  },
]

type BenchFilter = 'all' | 'shared' | 'solo'

const FILTER_LABELS: Record<BenchFilter, string> = {
  all: 'All tested',
  shared: 'Shared',
  solo: 'One-sided',
}

/**
 * The compare spec sheet: one continuous table — sticky model header, overview/scoring,
 * full specs, capabilities, then benchmarks grouped by category. Best value per row is
 * highlighted in the winner's slot color; benchmark cells also carry the gap to the leader
 * and a provenance flag for non-independent sources.
 */
export function CompareTable({
  catalog,
  slots,
}: {
  catalog: CatalogSnapshot
  /** Fixed slot array — nulls render as empty cells so columns never shift. */
  slots: (SnapshotModel | null)[]
}) {
  const active = slots
    .map((m, i) => ({ m, i }))
    .filter((x): x is { m: SnapshotModel; i: number } => x.m != null)
  const slotCount = slots.length
  const cols = `${LABEL_W}px repeat(${slotCount}, minmax(0,1fr))`
  const benchCols = `${LABEL_W}px repeat(${slotCount}, minmax(0,1fr)) ${FIELD_W}px`
  const bySlug = useMemo(() => new Map(catalog.models.map((m) => [m.slug, m])), [catalog.models])
  const asOfMs = Date.parse(`${catalog.asOfIso}T00:00:00Z`)
  const ctx: Ctx = {
    catalog,
    bySlug,
    contested: catalog.benchmarks.filter(
      (b) => active.filter(({ m }) => m.bench[b.slug] != null).length >= 2,
    ),
    asOfMs,
    active: active.map(({ m }) => m),
  }

  const [filter, setFilter] = useState<BenchFilter>('all')
  const benchUnion = useMemo(
    () => catalog.benchmarks.filter((b) => active.some(({ m }) => m.bench[b.slug] != null)),
    [catalog.benchmarks, active],
  )
  const coveredN = (b: SnapshotBenchmark) =>
    active.filter(({ m }) => m.bench[b.slug] != null).length
  const sharedRows = benchUnion.filter((b) => coveredN(b) === active.length)
  const soloRows = benchUnion.filter((b) => coveredN(b) === 1)
  const shown = filter === 'shared' ? sharedRows : filter === 'solo' ? soloRows : benchUnion
  const groups = BENCHMARK_CATEGORIES.map((cat) => ({
    cat,
    rows: shown.filter((b) => b.category === cat),
  })).filter((g) => g.rows.length > 0)
  const catLabel = (cap: string) => CAPABILITY_LABELS[cap as keyof typeof CAPABILITY_LABELS] ?? cap

  // Field-best lookup for the displayed benchmark rows only (context column): who holds
  // the tracked record, and by how much the compared set trails/leads it.
  const fieldBest = useMemo(() => {
    const out = new Map<string, { name: string; score: number }>()
    for (const b of shown) {
      let best: { name: string; score: number } | null = null
      for (const m of catalog.models) {
        const v = m.bench[b.slug]
        if (v != null && (best == null || v > best.score)) best = { name: m.name, score: v }
      }
      if (best) out.set(b.slug, best)
    }
    return out
  }, [shown, catalog.models])

  const cellBase = 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px]'

  const specRow = (d: SpecDef) => {
    const best = d.kind && d.num ? bestSet(slots, (m) => d.num?.(m, ctx) ?? null, d.kind) : EMPTY
    return (
      <div
        key={d.key}
        className="grid items-baseline gap-2 border-t border-border px-4 py-[7px] text-xs"
        style={{ gridTemplateColumns: cols }}
        data-testid={`spec-${d.key}`}
      >
        <span className="text-[11.5px] text-mut">{d.label}</span>
        {slots.map((m, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
            key={i}
            title={m ? d.get(m, ctx) : ''}
            className={cellBase}
            style={{
              color: best.has(i) ? SLOT_COLORS[i] : 'var(--text)',
              fontWeight: best.has(i) ? 600 : 400,
            }}
          >
            {m ? (d.render ? d.render(m, ctx) : d.get(m, ctx)) : ''}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div
      // overflow-hidden/clip both clip children at the rounded corners, but only clip
      // avoids creating a scroll container — a scroll-container ancestor would break
      // the sticky model header's vertical stick below.
      className="overflow-clip rounded-[10px] border border-border bg-card"
      data-testid="compare-table"
    >
      {/* overflow-x-auto would create a scroll container and kill the sticky header's
          vertical stick, so at ≥xl (where the table fits anyway) we clip instead —
          clip is not a scroll container and sticky keeps working against the page. */}
      <div className="overflow-x-auto xl:overflow-x-clip">
        <div
          style={{
            minWidth: LABEL_W + slotCount * 150 + FIELD_W + 8 * (slotCount + 1) + 32,
          }}
        >
          {/* sticky model header */}
          <div
            className="sticky top-[54px] z-10 grid items-center gap-2 border-b border-border2 bg-card px-4 pb-2.5 pt-3"
            style={{ gridTemplateColumns: cols }}
            data-testid="compare-colhead"
          >
            <span />
            {slots.map((m, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
              <div key={i} className="min-w-0">
                {m == null ? (
                  <span className="text-[11px] text-dim">empty slot</span>
                ) : (
                  <>
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className="size-[9px] flex-none rounded-[3px]"
                        style={{ background: SLOT_COLORS[i] }}
                      />
                      <Link
                        to="/models/$slug"
                        params={{ slug: m.slug }}
                        className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold text-text hover:text-acc hover:no-underline"
                        title={m.name}
                      >
                        {m.name}
                      </Link>
                      <ModelTag open={m.open} />
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-1.5 pl-[15px]">
                      <span className="font-mono text-[11px] font-semibold">
                        {Object.keys(m.bench).length > 0 ? m.index.toFixed(1) : '—'}
                      </span>
                      <span className="font-mono text-[9.5px] text-dim">
                        {m.ranked && m.rank != null ? `#${m.rank}` : 'unrated'} · {m.org}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {active.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11.5px] text-mut">
              Select at least one model to compare.
            </div>
          ) : (
            <>
              {SPEC_SECTIONS.map((sec) => (
                <div key={sec.title}>
                  <SectionHead label={sec.title} />
                  {sec.rows.map(specRow)}
                </div>
              ))}

              {/* capabilities matrix */}
              <SectionHead label="Capabilities" />
              {CAP_ORDER.map((cap) => (
                <div
                  key={cap}
                  className="grid items-center gap-2 border-t border-border px-4 py-[7px] text-xs"
                  style={{ gridTemplateColumns: cols }}
                  data-testid={`cap-${cap}`}
                >
                  <span className="text-[11.5px] text-mut">{catLabel(cap)}</span>
                  {slots.map((m, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
                    <span key={i} className="min-w-0">
                      {m == null ? (
                        ''
                      ) : m.caps[cap] ? (
                        <Check
                          aria-label={`${m.name} supports ${cap}`}
                          className="size-3.5"
                          strokeWidth={2.25}
                          style={{ color: SLOT_COLORS[i] }}
                        />
                      ) : (
                        <X
                          aria-label={`${m.name} lacks ${cap}`}
                          className="size-3.5 text-dim"
                          strokeWidth={1.75}
                        />
                      )}
                    </span>
                  ))}
                </div>
              ))}

              {/* benchmarks — grouped by category, coverage-filtered (D20 union rule kept) */}
              <div className="flex flex-wrap items-center gap-2 border-t border-border2 bg-panel2 px-4 py-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-dim">
                  Benchmarks
                </span>
                {active.length > 1 && (
                  <span className="ml-auto flex items-center gap-1">
                    {(Object.keys(FILTER_LABELS) as BenchFilter[]).map((f) => {
                      const n =
                        f === 'shared'
                          ? sharedRows.length
                          : f === 'solo'
                            ? soloRows.length
                            : benchUnion.length
                      const on = filter === f
                      return (
                        <button
                          key={f}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setFilter(f)}
                          data-testid={`bench-filter-${f}`}
                          className={`cursor-pointer rounded-[5px] border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.05em] ${
                            on
                              ? 'border-border2 bg-card text-text'
                              : 'border-transparent text-dim hover:text-mut'
                          }`}
                        >
                          {FILTER_LABELS[f]} {n}
                        </button>
                      )
                    })}
                  </span>
                )}
              </div>
              {shown.length === 0 ? (
                <div className="border-t border-border px-4 py-3 text-[11.5px] text-mut">
                  {filter === 'shared'
                    ? 'No benchmarks every selected model was scored on.'
                    : filter === 'solo'
                      ? 'No one-sided results — every covered benchmark is shared.'
                      : 'No shared benchmark results across the selected models.'}
                </div>
              ) : (
                groups.map((g) => {
                  const catBest = bestSet(slots, (m) => m.categoryIdx[g.cat] ?? null, 'max')
                  return (
                    <div key={g.cat}>
                      <div
                        className="grid items-center gap-2 border-t border-border bg-panel px-4 py-[7px]"
                        style={{ gridTemplateColumns: benchCols }}
                        data-testid={`cat-${g.cat}`}
                      >
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.07em] text-mut">
                          {CATEGORY_LABELS[g.cat]}
                          <span className="ml-1.5 text-dim">{g.rows.length}</span>
                        </span>
                        {slots.map((m, i) => {
                          const v = m?.categoryIdx[g.cat]
                          return (
                            // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
                            <span key={i} className="min-w-0">
                              <span
                                className="font-mono text-[10.5px]"
                                style={{
                                  color: catBest.has(i) ? SLOT_COLORS[i] : 'var(--mut)',
                                  fontWeight: catBest.has(i) ? 600 : 400,
                                }}
                              >
                                {v == null ? '—' : v.toFixed(1)}
                              </span>
                              <InlineBar
                                pct={v ?? 0}
                                color={SLOT_COLORS[i]}
                                className="mt-[3px] max-w-[100px]"
                              />
                            </span>
                          )
                        })}
                        <span className="text-right font-mono text-[9px] uppercase text-dim">
                          field best
                        </span>
                      </div>
                      {g.rows.map((b) => {
                        const best = bestSet(slots, (m) => m.bench[b.slug] ?? null, 'max')
                        const bestV = active.reduce<number | null>((acc, { m }) => {
                          const v = m.bench[b.slug]
                          return v != null && (acc == null || v > acc) ? v : acc
                        }, null)
                        const fb = fieldBest.get(b.slug)
                        return (
                          <div
                            key={b.slug}
                            className="grid items-center gap-2 border-t border-border px-4 py-2 text-xs"
                            style={{ gridTemplateColumns: benchCols }}
                            data-testid={`bench-${b.slug}`}
                          >
                            <span className="min-w-0">
                              <Link
                                to="/benchmarks/$slug"
                                params={{ slug: b.slug }}
                                className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-mut hover:text-acc"
                                title={`${b.name} — ${b.description}`}
                              >
                                {b.name}
                              </Link>
                            </span>
                            {slots.map((m, i) => {
                              const v = m?.bench[b.slug]
                              const src = m?.benchSources[b.slug]
                              const delta =
                                v != null && bestV != null && !best.has(i) && best.size > 0
                                  ? bestV - v
                                  : null
                              return (
                                // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
                                <span key={i} className="min-w-0">
                                  <span className="flex items-baseline gap-1 overflow-hidden">
                                    <span
                                      className="overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11.5px]"
                                      style={{
                                        color: best.has(i) ? SLOT_COLORS[i] : 'var(--text)',
                                        fontWeight: best.has(i) ? 600 : 400,
                                      }}
                                    >
                                      {m == null ? '' : v == null ? '—' : fmtScore(v, b.unit)}
                                    </span>
                                    {delta != null && (
                                      <span className="flex-none font-mono text-[9px] text-dim">
                                        −{fmtScore(delta, b.unit)}
                                      </span>
                                    )}
                                    {src != null && src !== 'independent' && (
                                      <span
                                        className="flex-none font-mono text-[8.5px] uppercase text-dim"
                                        title={`Source: ${src}`}
                                      >
                                        {src === 'self-reported' ? 'self' : src}
                                      </span>
                                    )}
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
                            <span
                              className="text-right font-mono text-[10px] text-dim"
                              title={fb ? `Field best: ${fb.name}` : ''}
                            >
                              {fb ? fmtScore(fb.score, b.unit) : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}

              {/* editorial notes */}
              <SectionHead label="Notes" />
              <div
                className="grid gap-2 border-t border-border px-4 py-2.5"
                style={{ gridTemplateColumns: cols }}
              >
                <span className="text-[11.5px] text-mut">Curation note</span>
                {slots.map((m, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed slot columns
                  <span key={i} className="min-w-0 text-[10.5px] leading-[1.5] text-mut">
                    {m?.note ?? ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="border-t border-border2 bg-panel2 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.07em] text-dim">
      {label}
    </div>
  )
}
