import { RADAR_AXES } from '@rankedmodel/shared'
import { radarAxisMeta, radarPolygonPoints, radarRings } from './scales'

export interface RadarSeries {
  /** Six axis values in RADAR_AXES order, 0–1. */
  values: number[]
  color: string
}

/** Six-axis capability radar (design compare view, viewBox 280×260). */
export function Radar({ series }: { series: RadarSeries[] }) {
  return (
    <svg
      viewBox="0 0 280 260"
      className="mt-1.5 block h-auto w-full"
      role="img"
      aria-label="Capability radar"
    >
      {radarRings().map((pts) => (
        <polygon key={pts} points={pts} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {RADAR_AXES.map((axis, i) => {
        const m = radarAxisMeta(i)
        return (
          <g key={axis.key}>
            <line x1="140" y1="126" x2={m.x2} y2={m.y2} stroke="var(--border)" strokeWidth="1" />
            <text
              x={m.lx}
              y={m.ly}
              textAnchor={m.anchor}
              fontSize="9.5"
              fill="var(--dim)"
              fontFamily="var(--font-mono)"
            >
              {axis.key}
            </text>
          </g>
        )
      })}
      {series.map((s, i) => (
        <polygon
          // biome-ignore lint/suspicious/noArrayIndexKey: series order is the identity (A/B/C slots)
          key={i}
          points={radarPolygonPoints(s.values)}
          fill={s.color}
          fillOpacity="0.14"
          stroke={s.color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
