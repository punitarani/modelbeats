import {
  benchmarkSchema,
  familySchema,
  hardwareProfileSchema,
  modelSchema,
  organizationSchema,
} from '@rankedmodel/shared'
import { getTableColumns } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { benchmarks, hardwareProfiles, modelFamilies, models, organizations } from './schema'

/**
 * Drift guard: the curated Zod schemas (what /data files contain) and the Drizzle tables
 * (what D1 stores) describe the same entities. Adding a curated field without a column —
 * or a column without curated backing — must fail here until the mapping below says how
 * the field is routed.
 */

type Table = Parameters<typeof getTableColumns>[0]

function checkDrift(opts: {
  zodKeys: string[]
  table: Table
  /** zodKey → drizzle property it maps to (renames / slug→FK resolutions). */
  mapped?: Record<string, string>
  /** zod fields that live in a different table (seeded elsewhere). */
  routedElsewhere?: string[]
  /** drizzle-only columns (ids, derived facets, bookkeeping). */
  dbExtras?: string[]
}) {
  const { zodKeys, table, mapped = {}, routedElsewhere = [], dbExtras = [] } = opts
  const dbKeys = Object.keys(getTableColumns(table))

  const unaccountedZod = zodKeys.filter(
    (k) => !dbKeys.includes(k) && !(k in mapped) && !routedElsewhere.includes(k),
  )
  const accountedDb = new Set([...zodKeys, ...Object.values(mapped), ...dbExtras])
  const unaccountedDb = dbKeys.filter((k) => !accountedDb.has(k))

  expect(unaccountedZod, 'curated fields with no D1 column mapping').toEqual([])
  expect(unaccountedDb, 'D1 columns with no curated backing or declared extra').toEqual([])
}

describe('curated schema ↔ drizzle schema drift', () => {
  it('models', () => {
    checkDrift({
      zodKeys: Object.keys(modelSchema.shape),
      table: models,
      mapped: {
        orgSlug: 'orgId',
        familySlug: 'familyId',
        predecessor: 'predecessorId',
        paramsB: 'paramsTotalB',
        activeParamsB: 'paramsActiveB',
        ctxK: 'contextLength',
      },
      routedElsewhere: ['price', 'tps4090'], // model_pricing / throughput_estimates
      dbExtras: [
        'id',
        'licenseUrl',
        'maxOutputTokens',
        // flat facet booleans derived from `capabilities` at seed (D7)
        'isReasoning',
        'supportsFunctionCalling',
        'supportsToolUse',
        'agentOptimized',
        'updatedAt',
      ],
    })
  })

  it('benchmarks', () => {
    checkDrift({
      zodKeys: Object.keys(benchmarkSchema.shape),
      table: benchmarks,
      dbExtras: ['id', 'isActive'],
    })
  })

  it('organizations', () => {
    checkDrift({
      zodKeys: Object.keys(organizationSchema.shape),
      table: organizations,
      dbExtras: ['id'],
    })
  })

  it('families', () => {
    checkDrift({
      zodKeys: Object.keys(familySchema.shape),
      table: modelFamilies,
      mapped: { orgSlug: 'orgId' },
      dbExtras: ['id'],
    })
  })

  it('hardware profiles', () => {
    checkDrift({
      zodKeys: Object.keys(hardwareProfileSchema.shape),
      table: hardwareProfiles,
      dbExtras: ['id'],
    })
  })
})
