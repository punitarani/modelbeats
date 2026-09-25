import { type CatalogSnapshot, fmtDate, RADAR_AXES, type SnapshotModel } from '@modelbeats/shared'
import { useMemo } from 'react'

/**
 * Head-to-head verdict: the compact answer the rest of the page elaborates on — who leads
 * the rating, who wins the covered categories, the record on benchmarks all models share,
 * and the price/recency/local-deployment picks. Only lines with a real answer render.
 */
export function VerdictCard({
  catalog,
  slots,
  colors,
}: {
  catalog: CatalogSnapshot
  slots: (SnapshotModel | null)[]
  colors: readonly string[]
}) {
  const active = slots
    .map((m, i) => ({ m, i }))
    .filter((x): x is { m: SnapshotModel; i: number } => x.m != null)

  const lines = useMemo(() => {
    const out: { label: string; text: string; slot: number | null }[] = []
    if (active.length === 0) return out

    // Elo leader + margin over the runner-up (only models with any scores rate).
    const scored = active
      .filter(({ m }) => Object.keys(m.bench).length > 0)
      .sort((a, b) => b.m.index - a.m.index)
    if (scored.length >= 2) {
      const gap = scored[0].m.index - scored[1].m.index
      out.push({
        label: 'Rating leader',
        text: `${scored[0].m.name} · +${gap.toFixed(1)} Elo`,
        slot: scored[0].i,
      })
    } else if (scored.length === 1) {
      out.push({ label: 'Rating leader', text: scored[0].m.name, slot: scored[0].i })
    }

    // Category record: who leads each covered radar category (ties count for all tied).
    const tally = new Map<number, number>()
    let catPlayed = 0
    for (const a of RADAR_AXES) {
      const entries = active
        .map(({ m, i }) => ({ i, v: m.categoryIdx[a.category] }))
        .filter((e): e is { i: number; v: number } => e.v != null)
      if (entries.length < 2) continue
      catPlayed++
      const top = Math.max(...entries.map((e) => e.v))
      for (const e of entries.filter((e) => e.v === top)) tally.set(e.i, (tally.get(e.i) ?? 0) + 1)
    }
    if (catPlayed > 0) {
      const text = [...tally.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([i, n]) => `${slots[i]?.name ?? '?'} ${n}`)
        .join(' · ')
      out.push({
        label: 'Category leads',
        text: `${text} (of ${catPlayed})`,
        slot: [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      })
    }

    // Shared-benchmark record: strict wins on benchmarks every selected model has.
    if (active.length >= 2) {
      const shared = catalog.benchmarks.filter((b) =>
        active.every(({ m }) => m.bench[b.slug] != null),
      )
      if (shared.length > 0) {
        const rec = new Map<number, number>()
        let ties = 0
        for (const b of shared) {
          const vals = active.map(({ m, i }) => ({ i, v: m.bench[b.slug] as number }))
          const top = Math.max(...vals.map((e) => e.v))
          const winners = vals.filter((e) => e.v === top)
          if (winners.length === 1) rec.set(winners[0].i, (rec.get(winners[0].i) ?? 0) + 1)
          else ties++
        }
        const text =
          [...rec.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([i, n]) => `${slots[i]?.name ?? '?'} ${n}`)
            .join(' · ') || 'all tied'
        out.push({
          label: `Shared benches (${shared.length})`,
          text: `${text}${ties ? ` · ${ties} tied` : ''}`,
          slot: null,
        })
      } else {
        out.push({
          label: 'Shared benches',
          text: 'none — disjoint coverage, compare with care',
          slot: null,
        })
      }
    }

    // Cheapest by 3:1 blended price.
    const priced = active
      .map(({ m, i }) => ({ m, i, b: m.price ? (3 * m.price.input + m.price.output) / 4 : null }))
      .filter((e): e is { m: SnapshotModel; i: number; b: number } => e.b != null)
    if (priced.length >= 2) {
      const lo = priced.reduce((a, b) => (a.b <= b.b ? a : b))
      const hi = priced.reduce((a, b) => (a.b >= b.b ? a : b))
      const mult = hi.b / lo.b
      out.push({
        label: 'Cheapest',
        text:
          mult > 1.05
            ? `${lo.m.name} · ${mult >= 10 ? mult.toFixed(0) : mult.toFixed(1)}× cheaper`
            : `${lo.m.name} · roughly even`,
        slot: lo.i,
      })
    } else if (priced.length === 1) {
      out.push({ label: 'Cheapest', text: `${priced[0].m.name} (only priced)`, slot: priced[0].i })
    }

    // Newest release + gap to the oldest compared model.
    const dated = [...active].sort((a, b) => b.m.date.localeCompare(a.m.date))
    if (dated.length >= 2 && dated[0].m.date !== dated[dated.length - 1].m.date) {
      const gapMs = Date.parse(dated[0].m.date) - Date.parse(dated[dated.length - 1].m.date)
      const mo = Math.floor(gapMs / 2_629_800_000)
      out.push({
        label: 'Newest',
        text: `${dated[0].m.name} · ${fmtDate(dated[0].m.date)}${mo > 0 ? ` · ${mo}mo newer` : ''}`,
        slot: dated[0].i,
      })
    }

    // Local deployment: which slots can actually run on your hardware (curated Q4 VRAM).
    const local = active.filter(({ m }) => m.vramQ4 != null)
    if (local.length > 0) {
      const smallest = [...local].sort((a, b) => (a.m.vramQ4 as number) - (b.m.vramQ4 as number))[0]
      out.push({
        label: 'Runs locally',
        text:
          local.length === active.length
            ? `all — lightest: ${smallest.m.name} (${smallest.m.vramQ4} GB)`
            : `${local.map(({ m }) => m.name).join(' · ')}`,
        slot: null,
      })
    }

    // Value pick: highest Elo per output dollar among priced models.
    if (priced.length >= 2) {
      const value = [...priced].sort(
        (a, b) =>
          b.m.index / (b.m.price as { output: number }).output -
          a.m.index / (a.m.price as { output: number }).output,
      )[0]
      out.push({
        label: 'Best value',
        text: `${value.m.name} · ${Math.round(value.m.index / (value.m.price as { output: number }).output)} Elo/$`,
        slot: value.i,
      })
    }
    return out
  }, [active, catalog.benchmarks, slots])

  return (
    <div
      className="rounded-[10px] border border-border bg-card px-4 py-3.5"
      data-testid="compare-verdict"
    >
      <div className="text-[13px] font-semibold">Head to head</div>
      <div className="mt-px text-[11px] text-mut">
        The short answer across rating, categories, shared benchmarks and cost
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {lines.length === 0 && (
          <div className="text-[11.5px] text-mut">Select models to see the verdict.</div>
        )}
        {lines.map((l) => (
          <div key={l.label} className="flex items-baseline gap-2.5 text-xs">
            <span className="w-[108px] flex-none font-mono text-[9.5px] uppercase tracking-[0.05em] text-dim">
              {l.label}
            </span>
            <span className="flex min-w-0 items-baseline gap-1.5 text-[11.5px]">
              {l.slot != null && (
                <span
                  className="size-[7px] flex-none translate-y-[-1px] rounded-[2px]"
                  style={{ background: colors[l.slot] }}
                />
              )}
              <span className="min-w-0">{l.text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
