import { useState } from 'react'
import { RADAR, radarAxisMeta, radarPoint, radarPolygonPoints, radarRings } from './scales'

export interface RadarSeries {
  /** One value per axis, in `axes` order, 0–1. `null` = untested (omitted from the polygon). */
  values: (number | null)[]
  color: string
}

export interface RadarTooltipRow {
  color: string
  name: string
  /** e.g. "GPQA 94.6 · HLE 47.2", or "Untested". */
  text: string
}
/** Per-axis hover breakdown (aligned to `axes`), so the radar can be interrogated (D24). */
export interface RadarAxisTooltip {
  title: string
  rows: RadarTooltipRow[]
}

/**
 * Adaptive capability radar (D24): renders exactly the axes passed in — the compare view supplies
 * only the categories at least one model covers, so untested axes are never drawn as a
 * collapsed-to-zero dent. Within a shown axis, a series with no data there skips its vertex and
 * gets a hollow "untested here" rim marker instead of a false zero.
 */
export function Radar({
  axes,
  series,
  tooltips,
}: {
  axes: readonly { key: string }[]
  series: RadarSeries[]
  tooltips?: RadarAxisTooltip[]
}) {
  const n = axes.length
  const [hover, setHover] = useState<number | null>(null)
  const tip = hover != null ? tooltips?.[hover] : undefined

  return (
    <div className="relative mt-1.5">
      <svg
        viewBox="0 0 280 260"
        className="block h-auto w-full"
        role="img"
        aria-label="Capability radar"
      >
        <title>Capability radar across {axes.map((a) => a.key).join(', ')}</title>
        {radarRings(n).map((pts) => (
          <polygon key={pts} points={pts} fill="none" stroke="var(--border)" strokeWidth="1" />
        ))}
        {axes.map((axis, i) => {
          const m = radarAxisMeta(i, n)
          const active = hover === i
          return (
            <g key={axis.key}>
              <line
                x1="140"
                y1="126"
                x2={m.x2}
                y2={m.y2}
                stroke={active ? 'var(--dim)' : 'var(--border)'}
                strokeWidth="1"
              />
              <text
                x={m.lx}
                y={m.ly}
                textAnchor={m.anchor}
                fontSize="9.5"
                fill={active ? 'var(--text)' : 'var(--dim)'}
                fontFamily="var(--font-mono)"
              >
                {axis.key}
              </text>
            </g>
          )
        })}
        {/* untested markers: a series with no data on a shown axis gets a hollow rim ring, not a 0 */}
        {series.map((s, si) =>
          s.values.map((v, i) =>
            v == null ? (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: axis index is the identity here
                key={`${si}-${i}`}
                cx={radarPoint(i, 1, n).x.toFixed(1)}
                cy={radarPoint(i, 1, n).y.toFixed(1)}
                r="3.2"
                fill="none"
                stroke={s.color}
                strokeWidth="1.4"
                strokeDasharray="2 1.6"
                opacity="0.85"
              />
            ) : null,
          ),
        )}
        {series.map((s, si) => (
          <polygon
            // biome-ignore lint/suspicious/noArrayIndexKey: series order is the identity (A/B/C slots)
            key={si}
            points={radarPolygonPoints(s.values, n)}
            fill={s.color}
            fillOpacity="0.14"
            stroke={s.color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        ))}
        {/* covered-vertex dots keep values legible and degenerate (1–2 point) series visible */}
        {series.map((s, si) =>
          s.values.map((v, i) =>
            v == null ? null : (
              <circle
                // biome-ignore lint/suspicious/noArrayIndexKey: axis index is the identity here
                key={`${si}-${i}`}
                cx={radarPoint(i, v, n).x.toFixed(1)}
                cy={radarPoint(i, v, n).y.toFixed(1)}
                r="2"
                fill={s.color}
              />
            ),
          ),
        )}
      </svg>
      {/* HTML hover/focus targets over each axis label — real buttons, so keyboard users can Tab to
          the same breakdown a mouse reveals (the data also lives in the benchmarks table). */}
      {tooltips != null &&
        axes.map((axis, i) => {
          const m = radarAxisMeta(i, n)
          return (
            <button
              key={axis.key}
              type="button"
              aria-label={`${axis.key} capability details`}
              className="absolute size-8 cursor-help rounded-full"
              style={{
                left: `${(m.lxNum / 280) * 100}%`,
                top: `${(m.lyNum / 260) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          )
        })}
      {tip != null && hover != null && <RadarTooltip tip={tip} axisIndex={hover} axisCount={n} />}
    </div>
  )
}

/** Hover breakdown, positioned inward from its axis label so it never clips outside the chart. */
function RadarTooltip({
  tip,
  axisIndex,
  axisCount,
}: {
  tip: RadarAxisTooltip
  axisIndex: number
  axisCount: number
}) {
  const m = radarAxisMeta(axisIndex, axisCount)
  // viewBox is 280×260; place the panel at the label point and translate toward the center.
  const tx = m.anchor === 'start' ? '-100%' : m.anchor === 'end' ? '0%' : '-50%'
  const ty = m.lyNum < RADAR.cy ? '0%' : '-100%'
  return (
    <div
      className="pointer-events-none absolute z-10 w-max max-w-[200px] rounded-md border border-border bg-panel2 px-2.5 py-1.5 shadow-lg"
      style={{
        left: `${(m.lxNum / 280) * 100}%`,
        top: `${(m.lyNum / 260) * 100}%`,
        transform: `translate(${tx}, ${ty})`,
      }}
    >
      <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.06em] text-mut">
        {tip.title}
      </div>
      <div className="flex flex-col gap-[3px]">
        {tip.rows.map((r) => (
          <div key={r.name} className="flex items-baseline gap-1.5 text-[11px] leading-snug">
            <span
              className="size-[7px] shrink-0 translate-y-[1px] rounded-[2px]"
              style={{ background: r.color }}
            />
            <span className="font-semibold">{r.name}</span>
            <span className="text-mut">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
