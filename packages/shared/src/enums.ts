/** Shared vocabulary for the curated dataset, D1 schema, and UI. See docs/DECISIONS.md. */

export const BENCHMARK_CATEGORIES = [
  'human-preference',
  'knowledge',
  'reasoning',
  'coding',
  'math',
  'vision',
  'agents',
] as const
export type BenchmarkCategory = (typeof BENCHMARK_CATEGORIES)[number]

/** Display labels exactly as the design renders them (uppercase applied via CSS). */
export const CATEGORY_LABELS: Record<BenchmarkCategory, string> = {
  'human-preference': 'Human preference',
  knowledge: 'Knowledge',
  reasoning: 'Reasoning',
  coding: 'Coding',
  math: 'Math',
  vision: 'Vision',
  agents: 'Agents',
}

export const OPENNESS = ['open-weights', 'open-source', 'closed'] as const
export type Openness = (typeof OPENNESS)[number]

export const MODEL_STATUS = ['released', 'preview', 'deprecated'] as const
export type ModelStatus = (typeof MODEL_STATUS)[number]

/** Result provenance (D8): v1 seed data is `curated`; the schema supports the full set. */
export const RESULT_SOURCES = [
  'curated',
  'self-reported',
  'independent',
  'arena',
  'admin-run',
] as const
export type ResultSource = (typeof RESULT_SOURCES)[number]

export const ARCH_CLASSES = ['dense', 'moe', 'ssm', 'hybrid'] as const
export type ArchClass = (typeof ARCH_CLASSES)[number]

export const MODALITIES = ['text', 'vision', 'audio', 'video'] as const
export type Modality = (typeof MODALITIES)[number]

/** Hardware profile kinds as curated in the design dataset. */
export const GPU_KINDS = ['consumer', 'mac', 'datacenter'] as const
export type GpuKind = (typeof GPU_KINDS)[number]

export const INFERENCE_FRAMEWORKS = ['llama.cpp', 'vLLM', 'MLX', 'ollama', 'exllamav2'] as const
export type InferenceFramework = (typeof INFERENCE_FRAMEWORKS)[number]

/** The six capability chips from the design's model-detail view (D7). */
export const CAPABILITY_KEYS = [
  'reasoning',
  'coding',
  'vision',
  'functionCalling',
  'toolUse',
  'agentic',
] as const
export type CapabilityKey = (typeof CAPABILITY_KEYS)[number]

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  reasoning: 'Reasoning',
  coding: 'Coding',
  vision: 'Vision',
  functionCalling: 'Function calling',
  toolUse: 'Tool use',
  agentic: 'Agentic',
}

/** Explorer facet chips (5 of the 6 — the design's filter rail omits `coding`). */
export const FILTERABLE_CAPABILITIES = [
  'reasoning',
  'vision',
  'functionCalling',
  'toolUse',
  'agentic',
] as const satisfies readonly CapabilityKey[]
