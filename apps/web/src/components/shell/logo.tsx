/**
 * RankedModel brand mark (user-supplied artwork, 2026-07-12): a ranked list —
 * leader dot beside the top bar, then descending bars. Renders in currentColor;
 * the same geometry is baked into public/favicon.svg + favicon.ico.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 720 496" fill="currentColor" aria-hidden="true" className={className}>
      <rect width="124" height="124" rx="32" />
      <rect x="168" width="552" height="124" rx="32" />
      <rect x="168" y="186" width="424" height="124" rx="32" />
      <rect x="168" y="372" width="312" height="124" rx="32" />
    </svg>
  )
}
