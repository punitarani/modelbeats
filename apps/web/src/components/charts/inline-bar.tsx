/** The design's ubiquitous 3px normalized bar (tables, cards, cells). */
export function InlineBar({
  pct,
  color = 'var(--acc)',
  height = 3,
  className = '',
}: {
  pct: number
  color?: string
  height?: number
  className?: string
}) {
  return (
    <span
      className={`block overflow-hidden rounded-sm bg-bar ${className}`}
      style={{ height }}
      aria-hidden="true"
    >
      <span className="block h-full" style={{ background: color, width: `${pct}%` }} />
    </span>
  )
}
