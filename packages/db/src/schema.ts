import type {
  ArchClass,
  BenchmarkCategory,
  Capabilities,
  GpuKind,
  InferenceFramework,
  Modality,
  ModelStatus,
  Openness,
  ResultSource,
} from '@rankedmodel/shared'
import { index, integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

/**
 * D1 schema — ARCHITECTURE.md §4 with the §13 reconciliation deltas:
 * D2 (benchmarks carry curated norm bounds), D7 (flat facet booleans + full capabilities
 * JSON), D8 (`curated` provenance), D9 (predecessor lineage), D15 (context stored as
 * absolute tokens here; curated files use K-tokens).
 */

export const organizations = sqliteTable('organizations', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').$type<'lab' | 'company' | 'community'>().notNull().default('company'),
  country: text('country'),
  url: text('url'),
  description: text('description'),
})

export const modelFamilies = sqliteTable('model_families', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  orgId: integer('org_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
})

export const models = sqliteTable(
  'models',
  {
    id: integer('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    orgId: integer('org_id')
      .notNull()
      .references(() => organizations.id),
    familyId: integer('family_id')
      .notNull()
      .references(() => modelFamilies.id),
    name: text('name').notNull(),
    releaseDate: text('release_date').notNull(), // YYYY-MM-DD
    status: text('status').$type<ModelStatus>().notNull().default('released'),
    /** Version lineage (D9): the model this one succeeds within its family. */
    predecessorId: integer('predecessor_id'),
    openness: text('openness').$type<Openness>().notNull(),
    license: text('license').notNull(),
    licenseUrl: text('license_url'),
    paramsTotalB: real('params_total_b'), // null = undisclosed
    paramsActiveB: real('params_active_b'), // MoE active params
    archClass: text('arch_class').$type<ArchClass>().notNull(),
    archDisplay: text('arch_display').notNull(),
    contextLength: integer('context_length').notNull(), // absolute tokens (curated K × 1000)
    maxOutputTokens: integer('max_output_tokens'),
    modalities: text('modalities', { mode: 'json' }).$type<Modality[]>().notNull(),
    langCount: integer('lang_count'),
    /** Flat facet booleans (D7) — cheap explorer filtering/indexing. */
    isReasoning: integer('is_reasoning', { mode: 'boolean' }).notNull().default(false),
    supportsFunctionCalling: integer('supports_function_calling', { mode: 'boolean' })
      .notNull()
      .default(false),
    supportsToolUse: integer('supports_tool_use', { mode: 'boolean' }).notNull().default(false),
    agentOptimized: integer('agent_optimized', { mode: 'boolean' }).notNull().default(false),
    /** Full 6-key capability set (incl. coding/vision) for the detail view (D7). */
    capabilities: text('capabilities', { mode: 'json' }).$type<Capabilities>().notNull(),
    apiAvailable: integer('api_available', { mode: 'boolean' }).notNull().default(false),
    links: text('links', { mode: 'json' })
      .$type<{ hf?: string; gh?: string; docs?: string }>()
      .notNull()
      .default({}),
    note: text('note').notNull(),
    /** Display list of quantization methods; normalized rows live in `quantizations`. */
    quants: text('quants', { mode: 'json' }).$type<string[]>().notNull().default([]),
    vramQ4Gb: real('vram_q4_gb'),
    vramFp16Gb: real('vram_fp16_gb'),
    tpsNote: text('tps_note'),
    /** Reasoning-effort/compute-tier label (e.g. "High", "Max"); null = no such axis. */
    effortLabel: text('effort_label'),
    isDefaultConfig: integer('is_default_config', { mode: 'boolean' }).notNull().default(true),
    isBestConfig: integer('is_best_config', { mode: 'boolean' }).notNull().default(true),
    updatedAt: text('updated_at').notNull().default(''),
  },
  (t) => [
    index('idx_models_release_date').on(t.releaseDate),
    index('idx_models_org').on(t.orgId),
    index('idx_models_family').on(t.familyId),
  ],
)

export const benchmarks = sqliteTable('benchmarks', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').$type<BenchmarkCategory>().notNull(),
  unit: text('unit').notNull(),
  description: text('description').notNull(),
  methodologyUrl: text('methodology_url'),
  /** Curated normalization bounds (D2) — the index formula's denominator. */
  normMin: real('norm_min').notNull(),
  normMax: real('norm_max').notNull(),
  higherIsBetter: integer('higher_is_better', { mode: 'boolean' }).notNull().default(true),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
})

export const benchmarkResults = sqliteTable(
  'benchmark_results',
  {
    id: integer('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    benchmarkId: integer('benchmark_id')
      .notNull()
      .references(() => benchmarks.id),
    score: real('score').notNull(),
    /** Derived at publish (C1 norm), never hand-edited. */
    scoreNormalized: real('score_normalized'),
    evaluatedAt: text('evaluated_at'),
    source: text('source').$type<ResultSource>().notNull(),
    sourceUrl: text('source_url'),
    settings: text('settings', { mode: 'json' }).$type<Record<string, unknown>>(),
    isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
    notes: text('notes'),
  },
  (t) => [
    unique('uq_result_model_benchmark_source').on(t.modelId, t.benchmarkId, t.source),
    index('idx_results_benchmark_score').on(t.benchmarkId, t.score),
    index('idx_results_model').on(t.modelId),
  ],
)

export const quantizations = sqliteTable(
  'quantizations',
  {
    id: integer('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    method: text('method').notNull(), // 'GGUF Q4' | 'MXFP4' | 'AWQ' | 'FP8' | ...
    bits: real('bits'),
    diskSizeGb: real('disk_size_gb'),
    /** Curated ground truth beats the formula (C2). */
    minVramGb: real('min_vram_gb'),
    minRamGb: real('min_ram_gb'),
    qualityNote: text('quality_note'),
    downloadUrl: text('download_url'),
  },
  (t) => [unique('uq_quant_model_method').on(t.modelId, t.method)],
)

export const hardwareProfiles = sqliteTable('hardware_profiles', {
  id: integer('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  kind: text('kind').$type<GpuKind>().notNull(),
  /** Usable memory budget in GB — Mac values are already unified-memory-discounted. */
  vramGb: real('vram_gb').notNull(),
  notes: text('notes'),
})

export const throughputEstimates = sqliteTable(
  'throughput_estimates',
  {
    id: integer('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    quantizationId: integer('quantization_id')
      .notNull()
      .references(() => quantizations.id),
    hardwareId: integer('hardware_id')
      .notNull()
      .references(() => hardwareProfiles.id),
    framework: text('framework').$type<InferenceFramework>().notNull(),
    tokensPerSec: real('tokens_per_sec').notNull(),
    contextTested: integer('context_tested'),
    source: text('source'),
    sourceUrl: text('source_url'),
  },
  (t) => [
    unique('uq_throughput').on(t.quantizationId, t.hardwareId, t.framework),
    index('idx_throughput_hardware').on(t.hardwareId),
  ],
)

export const modelPricing = sqliteTable(
  'model_pricing',
  {
    id: integer('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    provider: text('provider').notNull(),
    inputPerMtok: real('input_per_mtok').notNull(),
    outputPerMtok: real('output_per_mtok').notNull(),
    /** Seeded with the model's release date when the curated row has no explicit date. */
    effectiveDate: text('effective_date').notNull(),
  },
  (t) => [unique('uq_pricing').on(t.modelId, t.provider, t.effectiveDate)],
)

/** Derived at publish time (C1) — never hand-edited. */
export const modelScores = sqliteTable('model_scores', {
  modelId: integer('model_id')
    .primaryKey()
    .references(() => models.id),
  overallIndex: real('overall_index').notNull(),
  rankOverall: integer('rank_overall').notNull(),
  /** Populates from the 2nd publish onward (D9). */
  rankDelta30d: integer('rank_delta_30d'),
  humanPreferenceIndex: real('human_preference_index'),
  knowledgeIndex: real('knowledge_index'),
  reasoningIndex: real('reasoning_index'),
  codingIndex: real('coding_index'),
  mathIndex: real('math_index'),
  visionIndex: real('vision_index'),
  agentsIndex: real('agents_index'),
  /** Raw Arena Elo convenience copy for dashboard widgets. */
  arenaElo: real('arena_elo'),
  computedAt: text('computed_at').notNull(),
})

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(), // 'data_version' | 'published_at' | 'as_of' | 'as_of_iso'
  value: text('value').notNull(),
})
