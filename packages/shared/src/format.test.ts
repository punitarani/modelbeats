import { describe, expect, it } from 'vitest'
import { fmtCtx, fmtDate, fmtParams, fmtPrice } from './format'

// Expected strings transcribed from the design prototype's rendering of llm-data.js.
describe('fmtParams', () => {
  it.each([
    [null, null, '—'], // closed/undisclosed (gpt-5-5, claude-opus-4-8)
    [70, null, '70B'], // llama-3-3-70b
    [32.8, null, '32.8B'], // qwen3-32b
    [400, 17, '400B·17Ba'], // llama-4-maverick (MoE)
    [1040, 32, '1040B·32Ba'], // kimi-k2-5
  ])('fmtParams(%o, %o) → %s', (params, active, expected) => {
    expect(fmtParams(params, active)).toBe(expected)
  })
})

describe('fmtCtx', () => {
  it.each([
    [16, '16K'], // phi-4
    [128, '128K'],
    [400, '400K'], // gpt-5-5
    [1000, '1M'], // gemini-3-pro
    [2000, '2M'], // grok-4-2
    [10000, '10M'], // llama-4-scout
  ])('fmtCtx(%d) → %s', (ctxK, expected) => {
    expect(fmtCtx(ctxK)).toBe(expected)
  })
})

describe('fmtPrice', () => {
  it('formats input/output prices without trailing zeros, like the design', () => {
    expect(fmtPrice({ input: 21, output: 168 }, false)).toBe('$21/$168')
    expect(fmtPrice({ input: 0.15, output: 0.6 }, true)).toBe('$0.15/$0.6')
    expect(fmtPrice({ input: 2.5, output: 20 }, false)).toBe('$2.5/$20')
  })
  it('open model without a hosted API shows `weights`', () => {
    expect(fmtPrice(null, true)).toBe('weights') // gpt-oss-20b, phi-4
  })
  it('closed model without a price shows an em dash', () => {
    expect(fmtPrice(null, false)).toBe('—')
  })
})

describe('fmtDate', () => {
  it('short form: `May 2026`', () => {
    expect(fmtDate('2026-05-14')).toBe('May 2026')
    expect(fmtDate('2024-12-06')).toBe('Dec 2024')
  })
  it('long form drops leading zero on the day: `May 14, 2026`', () => {
    expect(fmtDate('2026-05-14', true)).toBe('May 14, 2026')
    expect(fmtDate('2025-08-05', true)).toBe('Aug 5, 2025')
  })
})
