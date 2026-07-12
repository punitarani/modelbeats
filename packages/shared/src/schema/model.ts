import { z } from 'zod'
import { ARCH_CLASSES, MODALITIES, MODEL_STATUS, OPENNESS } from '../enums'
import { isoDateSchema, slugSchema } from './common'

export const capabilitiesSchema = z.object({
  reasoning: z.boolean(),
  coding: z.boolean(),
  vision: z.boolean(),
  functionCalling: z.boolean(),
  toolUse: z.boolean(),
  agentic: z.boolean(),
})

export const priceSchema = z.object({
  /** USD per million input tokens. */
  input: z.number().positive(),
  /** USD per million output tokens. */
  output: z.number().positive(),
})

export const modelLinksSchema = z.object({
  hf: z.string().min(1).optional(),
  gh: z.string().min(1).optional(),
  docs: z.string().min(1).optional(),
})

/** One curated file per model: data/models/{orgSlug}/{slug}.json */
export const modelSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
  orgSlug: slugSchema,
  familySlug: slugSchema,
  releaseDate: isoDateSchema,
  status: z.enum(MODEL_STATUS).default('released'),
  /** Version lineage (D9): slug of the model this one succeeds, within the same family. */
  predecessor: slugSchema.nullable().default(null),
  openness: z.enum(OPENNESS),
  license: z.string().min(1),
  /** Total parameters in billions; null = undisclosed (closed models). */
  paramsB: z.number().positive().nullable(),
  /** Active (MoE) parameters in billions; null for dense/undisclosed. */
  activeParamsB: z.number().positive().nullable(),
  /** Normalized architecture class + the display string the design shows verbatim. */
  archClass: z.enum(ARCH_CLASSES),
  archDisplay: z.string().min(1),
  /** Context window in K tokens, exactly as the design stores it (D15): 400 = 400K, 2000 = 2M. */
  ctxK: z.number().positive(),
  modalities: z.array(z.enum(MODALITIES)).min(1),
  /** Count of supported languages (the design dataset tracks a count, not ISO codes). */
  langCount: z.number().int().positive().nullable(),
  capabilities: capabilitiesSchema,
  apiAvailable: z.boolean(),
  /** USD per Mtok via first-party API; null = no hosted API. */
  price: priceSchema.nullable(),
  links: modelLinksSchema.default({}),
  note: z.string().min(1),
  /** Quantization methods available for local deployment (display order preserved). */
  quants: z.array(z.string().min(1)).default([]),
  /** Curated VRAM requirements in GB (C2: curated beats formula). Null when not local-deployable. */
  vramQ4Gb: z.number().positive().nullable(),
  vramFp16Gb: z.number().positive().nullable(),
  /** Measured tokens/sec on an RTX 4090 (Q4, llama.cpp) where known. */
  tps4090: z.number().positive().nullable(),
  /** Free-text throughput note when tps4090 doesn't apply (multi-GPU/Mac setups). */
  tpsNote: z.string().nullable(),
})

export type Model = z.infer<typeof modelSchema>
export type Capabilities = z.infer<typeof capabilitiesSchema>
export type Price = z.infer<typeof priceSchema>
