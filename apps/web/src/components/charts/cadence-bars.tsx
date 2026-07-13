import { useEffect, useRef } from 'react'
import { cadenceHeight } from './scales'

export interface Quarter {
  label: string
  count: number
  latest?: boolean
}

/** Minimum per-bar width (px) so quarter labels stay legible however many quarters exist. */
const MIN_BAR_WIDTH = 30

/**
 * Release-cadence quarter bars (design dashboard releases tab). Real history now spans
 * 25+ quarters (2020-2026) rather than the design's handful, so bars get a fixed minimum
 * width and the row scrolls horizontally instead of over-compressing; it auto-scrolls to
 * the most recent quarter on mount.
 */
export function CadenceBars({ quarters }: { quarters: Quarter[] }) {
  const max = Math.max(1, ...quarters.map((q) => q.count))
  const scrollRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <section
      ref={scrollRef}
      className="mt-3.5 h-[90px] overflow-x-auto"
      aria-label="Release cadence by quarter"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region must be focusable (axe)
      tabIndex={0}
    >
      <div
        className="flex h-full items-end gap-[5px]"
        style={{ minWidth: quarters.length * (MIN_BAR_WIDTH + 5) }}
      >
        {quarters.map((q) => (
          <div
            key={q.label}
            className="flex flex-1 flex-col items-center gap-1"
            style={{ minWidth: MIN_BAR_WIDTH }}
          >
            <div className="font-mono text-[9.5px] text-mut">{q.count}</div>
            <div
              className="w-full rounded-t-[3px]"
              style={{
                height: cadenceHeight(q.count, max),
                background: q.latest ? 'var(--acc)' : 'var(--border2)',
              }}
            />
            <div className="whitespace-nowrap font-mono text-[8.5px] text-dim">{q.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
