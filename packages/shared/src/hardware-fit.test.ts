import { describe, expect, it } from 'vitest'
import { assessFit, isLocalDeployable, requiredGbQ4, sizeClass } from './hardware-fit'

/** Cases pinned to curated dataset values so UI assertions can reuse them. */
const gptOss20b = { openness: 'open-weights', vramQ4Gb: 13, paramsB: 21 } as const
const llama70b = { openness: 'open-weights', vramQ4Gb: 42, paramsB: 70 } as const
const kimiK25 = { openness: 'open-weights', vramQ4Gb: 580, paramsB: 1040 } as const
const claudeOpus = { openness: 'closed', vramQ4Gb: null, paramsB: null } as const

describe('requiredGbQ4', () => {
  it('uses curated VRAM × 1.08 overhead', () => {
    expect(requiredGbQ4(gptOss20b)).toBeCloseTo(14.04, 10) // 13 × 1.08
    expect(requiredGbQ4(llama70b)).toBeCloseTo(45.36, 10)
  })
  it('falls back to params × 4.5/8 × 1.08 when curated VRAM is missing', () => {
    expect(requiredGbQ4({ openness: 'open-weights', vramQ4Gb: null, paramsB: 21 })).toBeCloseTo(
      21 * (4.5 / 8) * 1.08,
      10,
    )
  })
  it('closed models are not locally deployable', () => {
    expect(isLocalDeployable(claudeOpus)).toBe(false)
    expect(requiredGbQ4(claudeOpus)).toBeNull()
  })
})

describe('assessFit verdicts (C2 thresholds)', () => {
  it('gpt-oss-20b on RTX 4070 Ti 16GB → fits-tight (ratio 0.8775) and boolean fits', () => {
    const fit = assessFit(gptOss20b, 16)
    expect(fit?.verdict).toBe('fits-tight')
    expect(fit?.fits).toBe(true)
  })
  it('gpt-oss-20b on 12GB → offload-partial (ratio 1.17), boolean excluded', () => {
    const fit = assessFit(gptOss20b, 12)
    expect(fit?.verdict).toBe('offload-partial')
    expect(fit?.fits).toBe(false)
  })
  it('llama-3.3-70b: RTX 5090 32GB → wont-run; M3 Max 96GB budget → fits-comfortably', () => {
    expect(assessFit(llama70b, 32)?.verdict).toBe('wont-run') // 45.36/32 = 1.42
    const m3max = assessFit(llama70b, 96)
    expect(m3max?.verdict).toBe('fits-comfortably') // 45.36/96 = 0.4725
    expect(m3max?.headroomGb).toBeCloseTo(50.64, 10)
  })
  it('kimi-k2.5 (580GB Q4) wont-run even on M3 Ultra 384GB budget', () => {
    expect(assessFit(kimiK25, 384)?.verdict).toBe('wont-run') // 626.4/384 = 1.63
  })
  it('closed model → null (no card, API-only path)', () => {
    expect(assessFit(claudeOpus, 96)).toBeNull()
  })
})

describe('sizeClass buckets (design select)', () => {
  it.each([
    [null, 'undisclosed'],
    [3, 's'],
    [14.9, 's'],
    [15, 'm'],
    [69.9, 'm'],
    [70, 'l'],
    [299, 'l'],
    [300, 'xl'],
    [1040, 'xl'],
  ] as const)('sizeClass(%o) → %s', (params, expected) => {
    expect(sizeClass(params)).toBe(expected)
  })
})
