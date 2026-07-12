import { describe, expect, it } from 'vitest'
import {
  benchmarkSchema,
  familySchema,
  hardwareProfileSchema,
  modelSchema,
  organizationSchema,
  resultRowSchema,
  slugSchema,
} from './index'

const validModel = {
  slug: 'gpt-oss-20b',
  name: 'GPT-OSS-20B',
  orgSlug: 'openai',
  familySlug: 'gpt-oss',
  releaseDate: '2025-08-05',
  openness: 'open-weights',
  license: 'Apache 2.0',
  paramsB: 21,
  activeParamsB: 3.6,
  archClass: 'moe',
  archDisplay: 'MoE',
  ctxK: 128,
  modalities: ['text'],
  langCount: 14,
  capabilities: {
    reasoning: true,
    coding: true,
    vision: false,
    functionCalling: true,
    toolUse: true,
    agentic: false,
  },
  apiAvailable: false,
  price: null,
  links: { hf: 'openai/gpt-oss-20b', gh: 'openai/gpt-oss' },
  note: 'Runs on a single 16GB consumer GPU at MXFP4.',
  quants: ['MXFP4', 'GGUF Q4', 'GGUF Q8'],
  vramQ4Gb: 13,
  vramFp16Gb: 44,
  tps4090: 118,
  tpsNote: null,
}

describe('slugSchema', () => {
  it('accepts kebab-case with digits', () => {
    for (const s of ['claude-opus-4-8', 'qwen3-7-max', 'm3max', 'a100']) {
      expect(slugSchema.safeParse(s).success).toBe(true)
    }
  })
  it('rejects uppercase, underscores, and leading/trailing hyphens', () => {
    for (const s of ['Claude', 'gpt_5', '-x', 'x-', 'a--b', '']) {
      expect(slugSchema.safeParse(s).success).toBe(false)
    }
  })
})

describe('modelSchema', () => {
  it('parses a realistic open model and applies defaults', () => {
    const parsed = modelSchema.parse(validModel)
    expect(parsed.status).toBe('released') // default
    expect(parsed.predecessor).toBeNull() // default
  })
  it('rejects a bad openness enum', () => {
    expect(modelSchema.safeParse({ ...validModel, openness: 'open' }).success).toBe(false)
  })
  it('rejects a malformed release date', () => {
    expect(modelSchema.safeParse({ ...validModel, releaseDate: '2025-13-40' }).success).toBe(false)
  })
})

describe('benchmarkSchema', () => {
  const arena = {
    slug: 'arena',
    name: 'Arena Elo',
    category: 'human-preference',
    unit: 'Elo',
    description: 'Blind pairwise human votes.',
    normMin: 1150,
    normMax: 1520,
  }
  it('parses with default higherIsBetter=true', () => {
    expect(benchmarkSchema.parse(arena).higherIsBetter).toBe(true)
  })
  it('rejects inverted normalization bounds', () => {
    expect(benchmarkSchema.safeParse({ ...arena, normMin: 1520, normMax: 1150 }).success).toBe(
      false,
    )
  })
})

describe('row schemas', () => {
  it('organization defaults type to company', () => {
    expect(organizationSchema.parse({ slug: 'openai', name: 'OpenAI' }).type).toBe('company')
  })
  it('family requires an org', () => {
    expect(familySchema.safeParse({ slug: 'gpt-5', name: 'GPT-5' }).success).toBe(false)
  })
  it('hardware profile parses (Mac budgets are pre-discounted usable GB)', () => {
    const m3max = hardwareProfileSchema.parse({
      slug: 'm3max',
      name: 'M3 Max 128GB',
      kind: 'mac',
      vramGb: 96,
    })
    expect(m3max.vramGb).toBe(96)
  })
  it('result row rejects unknown provenance', () => {
    expect(
      resultRowSchema.safeParse({ modelSlug: 'gpt-5', score: 74.9, source: 'guessed' }).success,
    ).toBe(false)
  })
})
