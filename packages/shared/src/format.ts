import type { Price } from './schema/model'

/**
 * Display formatters — semantics copied verbatim from the design prototype (C6)
 * so rendered strings match the design pixel-for-pixel.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `70B` · `400B·17Ba` (MoE active) · `—` (undisclosed). */
export function fmtParams(paramsB: number | null, activeParamsB: number | null = null): string {
  if (paramsB == null) return '—'
  return activeParamsB ? `${paramsB}B·${activeParamsB}Ba` : `${paramsB}B`
}

/** Context in K tokens → `128K`, `2M` (≥ 1000K). */
export function fmtCtx(ctxK: number): string {
  return ctxK >= 1000 ? `${ctxK / 1000}M` : `${ctxK}K`
}

/** `$2.5/$20` · `weights` (open, no hosted API) · `—` (closed, no price). */
export function fmtPrice(price: Price | null, open: boolean): string {
  if (price) return `$${price.input}/$${price.output}`
  return open ? 'weights' : '—'
}

/** `May 2026` — or with `long`: `May 14, 2026`. Input is YYYY-MM-DD. */
export function fmtDate(isoDate: string, long = false): string {
  const [y, mo, day] = isoDate.split('-')
  const month = MONTHS[Number(mo) - 1] ?? '?'
  return long ? `${month} ${Number(day)}, ${y}` : `${month} ${y}`
}
