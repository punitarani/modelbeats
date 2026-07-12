import { SCATTER, scatterX, scatterY } from './scales'

export interface ScatterPoint {
  slug: string
  name: string
  outputPrice: number
  elo: number
  open: boolean
  labeled?: boolean
}

/** Quality-vs-price scatter (design dashboard, viewBox 720×320, log-x). */
export function QualityPriceScatter({
  points,
  onSelect,
}: {
  points: ScatterPoint[]
  onSelect?: (slug: string) => void
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG chart with interactive child links — role=img would make them presentational and <fieldset> is not an SVG element
    <svg
      viewBox={SCATTER.viewBox}
      className="mt-2 block h-auto w-full"
      role="group"
      aria-label="Arena Elo against output price (log scale)"
    >
      {SCATTER.yTicks.map((elo) => {
        const y = scatterY(elo)
        return (
          <g key={elo}>
            <line
              x1={SCATTER.left}
              x2={SCATTER.right}
              y1={y.toFixed(1)}
              y2={y.toFixed(1)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={SCATTER.left - 6}
              y={(y + 3).toFixed(1)}
              textAnchor="end"
              fontSize="10"
              fill="var(--dim)"
              fontFamily="var(--font-mono)"
            >
              {elo}
            </text>
          </g>
        )
      })}
      {SCATTER.xTicks.map((price) => (
        <text
          key={price}
          x={scatterX(price).toFixed(1)}
          y="314"
          textAnchor="middle"
          fontSize="10"
          fill="var(--dim)"
          fontFamily="var(--font-mono)"
        >
          ${price}
        </text>
      ))}
      {points.map((p) => {
        const shared = {
          cx: scatterX(p.outputPrice).toFixed(1),
          cy: scatterY(p.elo).toFixed(1),
          r: 5,
          fill: p.open ? 'var(--open)' : 'var(--closed)',
          fillOpacity: 0.75,
          stroke: 'var(--bg)',
          strokeWidth: 1,
          'data-testid': 'scatter-point',
        }
        const label = `${p.name} — ${p.elo} Elo · $${p.outputPrice}/M out`
        return onSelect ? (
          // SVG <a>: real link semantics; click is intercepted for SPA navigation.
          <a
            key={p.slug}
            href={`/models/${p.slug}`}
            aria-label={label}
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              onSelect(p.slug)
            }}
          >
            <circle {...shared}>
              <title>{label}</title>
            </circle>
          </a>
        ) : (
          <circle key={p.slug} {...shared}>
            <title>{label}</title>
          </circle>
        )
      })}
      {points
        .filter((p) => p.labeled)
        .map((p) => (
          <text
            key={`label-${p.slug}`}
            x={(scatterX(p.outputPrice) + 8).toFixed(1)}
            y={(scatterY(p.elo) + 3).toFixed(1)}
            fontSize="10"
            fill="var(--mut)"
          >
            {p.name}
          </text>
        ))}
    </svg>
  )
}
