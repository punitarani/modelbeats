import { sparklinePoints, sparklineX, sparklineY } from './scales'

export interface SparklineDot {
  value: number
  label: string
  active?: boolean
}

/** Family index-progression sparkline (design model-detail card, viewBox 280×64). */
export function Sparkline({ dots }: { dots: SparklineDot[] }) {
  const values = dots.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return (
    <svg
      viewBox="0 0 280 64"
      className="mt-2.5 block h-auto w-full"
      role="img"
      aria-label="Index progression"
    >
      <polyline
        points={sparklinePoints(values)}
        fill="none"
        stroke="var(--acc)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {dots.map((d, i) => (
        <circle
          key={d.label}
          cx={sparklineX(i, dots.length).toFixed(1)}
          cy={sparklineY(d.value, min, max).toFixed(1)}
          r={d.active ? 4 : 2.5}
          fill={d.active ? 'var(--acc)' : 'var(--mut)'}
          stroke="var(--card)"
          strokeWidth="1.5"
        >
          <title>{d.label}</title>
        </circle>
      ))}
    </svg>
  )
}
