/**
 * Hardware-fit engine (contract C2) — the flagship-wedge math. Pure functions used
 * identically by the explorer facet, model-detail "Run it locally" card, and /hardware.
 *
 * The design's boolean rule is `vramQ4 × 1.08 ≤ gpu.vram`; production adds graded
 * verdicts on top. `capacityGb` is the profile's usable budget — Mac profiles are
 * already unified-memory-discounted in curated data, so never discount again here.
 */

/** Headroom factor on top of weights VRAM (KV cache + runtime overhead). */
export const FIT_OVERHEAD = 1.08
/** Effective bits/param for a Q4 GGUF-class quant, used only when curated VRAM is missing. */
export const Q4_BITS = 4.5

export const FIT_VERDICTS = [
  'fits-comfortably',
  'fits-tight',
  'offload-partial',
  'wont-run',
] as const
export type FitVerdict = (typeof FIT_VERDICTS)[number]

export const FIT_VERDICT_LABELS: Record<FitVerdict, string> = {
  'fits-comfortably': 'fits comfortably',
  'fits-tight': 'fits (tight)',
  'offload-partial': 'partial offload',
  'wont-run': "won't run",
}

export interface FitModelInput {
  openness: 'open-weights' | 'open-source' | 'closed'
  /** Curated Q4 VRAM in GB (ground truth — beats the formula). */
  vramQ4Gb: number | null
  paramsB: number | null
}

/** True when the model can be deployed locally at all (open with known/estimable size). */
export function isLocalDeployable(m: FitModelInput): boolean {
  return m.openness !== 'closed' && (m.vramQ4Gb != null || m.paramsB != null)
}

/**
 * Required GB at Q4 including overhead: curated vramQ4 × 1.08, falling back to
 * paramsB × (4.5/8) × 1.08 when no curated figure exists. Null = not deployable.
 */
export function requiredGbQ4(m: FitModelInput): number | null {
  if (!isLocalDeployable(m)) return null
  const weightsGb = m.vramQ4Gb ?? (m.paramsB as number) * (Q4_BITS / 8)
  return weightsGb * FIT_OVERHEAD
}

export interface FitResult {
  verdict: FitVerdict
  /** Design-parity boolean (`ratio ≤ 1.0`) — explorer facet + fits-on chips. */
  fits: boolean
  requiredGb: number
  capacityGb: number
  /** required / capacity; < 1 means it fits with room. */
  ratio: number
  /** capacity − required (negative = over budget). */
  headroomGb: number
}

export function fitVerdict(requiredGb: number, capacityGb: number): FitVerdict {
  const ratio = requiredGb / capacityGb
  if (ratio <= 0.8) return 'fits-comfortably'
  if (ratio <= 1.0) return 'fits-tight'
  if (ratio <= 1.3) return 'offload-partial'
  return 'wont-run'
}

/** Full fit assessment of a model against a memory budget. Null = not locally deployable. */
export function assessFit(m: FitModelInput, capacityGb: number): FitResult | null {
  const requiredGb = requiredGbQ4(m)
  if (requiredGb == null) return null
  const ratio = requiredGb / capacityGb
  return {
    verdict: fitVerdict(requiredGb, capacityGb),
    fits: ratio <= 1.0,
    requiredGb,
    capacityGb,
    ratio,
    headroomGb: capacityGb - requiredGb,
  }
}

export const SIZE_CLASSES = ['s', 'm', 'l', 'xl', 'undisclosed'] as const
export type SizeClass = (typeof SIZE_CLASSES)[number]

export const SIZE_CLASS_LABELS: Record<SizeClass, string> = {
  s: '< 15B — laptop class',
  m: '15–70B — single GPU',
  l: '70–300B — workstation',
  xl: '> 300B — cluster',
  undisclosed: 'Undisclosed (closed)',
}

/** The explorer's size-class buckets, exactly as the design's select defines them. */
export function sizeClass(paramsB: number | null): SizeClass {
  if (paramsB == null) return 'undisclosed'
  if (paramsB < 15) return 's'
  if (paramsB < 70) return 'm'
  if (paramsB < 300) return 'l'
  return 'xl'
}
