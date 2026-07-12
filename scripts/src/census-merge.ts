import { readFile, writeFile } from 'node:fs/promises'

/**
 * Offline census aggregator (P1). Reads a census workflow's journal.jsonl (one JSON line per
 * completed agent, each `{ type:'result', result:{ models:[...] } }`), deterministically dedups
 * the union of all agents' rows into a canonical work-list, and writes corpus/census.json.
 *
 * The census is intentionally a SUPERSET: recall first. Deep-research (P2) canonicalizes finely
 * per family, so mild over-inclusion here is safe; under-inclusion (a missed model) is not.
 *
 * Usage: bun scripts/src/census-merge.ts <journal.jsonl> [outFile=corpus/census.json]
 */

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

interface RawModel {
  name: string
  org: string
  family: string
  approxDate: string
  openness: string
  paramsB: number | null
  sourceUrls?: string[]
}

/** Canonicalize obvious org display-name variants; conservative (keep genuinely distinct orgs). */
const ORG_ALIASES: Record<string, string> = {
  'meta ai': 'Meta',
  'meta ai (fair)': 'Meta',
  'meta platforms': 'Meta',
  facebook: 'Meta',
  'facebook ai research': 'Meta',
  'fair (meta)': 'Meta',
  deepmind: 'Google DeepMind',
  'google research': 'Google',
  'google brain': 'Google',
  'google ai': 'Google',
  thudm: 'Zhipu AI',
  'tsinghua university (thudm)': 'Zhipu AI',
  zhipu: 'Zhipu AI',
  'zhipu ai (thudm)': 'Zhipu AI',
  qwen: 'Alibaba',
  'alibaba cloud': 'Alibaba',
  'alibaba (qwen)': 'Alibaba',
  'alibaba damo academy': 'Alibaba',
  'x ai': 'xAI',
  'x.ai': 'xAI',
  'mistral': 'Mistral AI',
  'allen institute for ai': 'Allen Institute for AI (AI2)',
  ai2: 'Allen Institute for AI (AI2)',
  'allen ai': 'Allen Institute for AI (AI2)',
  'microsoft research': 'Microsoft',
  'microsoft (wizardlm)': 'Microsoft',
  'technology innovation institute': 'TII',
  'technology innovation institute (tii)': 'TII',
  'tii (uae)': 'TII',
  'hugging face h4': 'Hugging Face',
  huggingface: 'Hugging Face',
  '01 ai': '01.AI',
  '01-ai': '01.AI',
  'nvidia corporation': 'NVIDIA',
  'shanghai ai laboratory': 'InternLM (Shanghai AI Lab)',
  'shanghai ai lab': 'InternLM (Shanghai AI Lab)',
  internlm: 'InternLM (Shanghai AI Lab)',
  'lg ai': 'LG AI Research',
  'stability ai (stablelm)': 'Stability AI',
  'moonshot': 'Moonshot AI',
  'moonshot ai (kimi)': 'Moonshot AI',
}

const canonOrg = (org: string): string => {
  const k = org.trim().toLowerCase()
  return ORG_ALIASES[k] ?? org.trim()
}

/** Normalize a model name into a dedup key: strip parentheticals, punctuation, snapshot dates. */
const normName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parenthetical notes
    .replace(/\b\d{4}[-/]\d{2}([-/]\d{2})?\b/g, ' ') // drop embedded dates
    .replace(/\b(preview|latest|beta|alpha|snapshot)\b/g, ' ')
    .replace(/[^a-z0-9.]+/g, ' ')
    .replace(/\s*(\d+(?:\.\d+)?)\s*b\b/g, ' $1b ') // normalize "8 B" → "8b"
    .replace(/\s+/g, ' ')
    .trim()

const yearOf = (d: string): string => (/^\d{4}/.test(d) ? d.slice(0, 4) : 'unknown')

const OPENNESS = new Set(['open-weights', 'open-source', 'closed', 'unknown'])

interface CensusEntry {
  name: string
  org: string
  orgSlug: string
  family: string
  approxDate: string
  openness: string
  paramsB: number | null
  aliases: string[]
  sourceUrls: string[]
}

async function main() {
  const journalPath = process.argv[2]
  const outFile = process.argv[3] ?? 'corpus/census.json'
  if (!journalPath) throw new Error('usage: census-merge <journal.jsonl> [out]')

  const lines = (await readFile(journalPath, 'utf8')).split('\n').filter((l) => l.trim())
  const raw: RawModel[] = []
  let resultLines = 0
  for (const line of lines) {
    let o: { type?: string; result?: { models?: RawModel[] } }
    try {
      o = JSON.parse(line)
    } catch {
      continue
    }
    if (o.type !== 'result') continue
    resultLines++
    const models = o.result?.models
    if (Array.isArray(models))
      for (const m of models) {
        if (!m?.name || !m?.org) continue
        // Scope: GPT-3 (June 2020) onward. Drop anything we can date before 2020.
        if (/^\d{4}/.test(m.approxDate) && m.approxDate.slice(0, 4) < '2020') continue
        raw.push(m)
      }
  }

  // Dedup by (orgSlug, normalized name). Merge: earliest precise date, disclosed params win,
  // union source URLs, collect aliases.
  const byKey = new Map<string, CensusEntry>()
  for (const m of raw) {
    const org = canonOrg(m.org)
    const orgSlug = slugify(org)
    const key = `${orgSlug}::${normName(m.name)}`
    const openness = OPENNESS.has(m.openness) ? m.openness : 'unknown'
    const urls = (m.sourceUrls ?? []).filter((u) => typeof u === 'string' && u.startsWith('http'))
    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, {
        name: m.name.trim(),
        org,
        orgSlug,
        family: m.family?.trim() || m.name.trim(),
        approxDate: m.approxDate,
        openness,
        paramsB: typeof m.paramsB === 'number' ? m.paramsB : null,
        aliases: [],
        sourceUrls: [...new Set(urls)],
      })
    } else {
      if (m.name.trim() !== existing.name && !existing.aliases.includes(m.name.trim())) {
        existing.aliases.push(m.name.trim())
      }
      // more precise date wins (longer string = more precise; earlier wins on ties)
      if (m.approxDate && (m.approxDate.length > existing.approxDate.length || (m.approxDate.length === existing.approxDate.length && m.approxDate < existing.approxDate))) {
        existing.approxDate = m.approxDate
      }
      if (existing.paramsB == null && typeof m.paramsB === 'number') existing.paramsB = m.paramsB
      if (existing.openness === 'unknown' && openness !== 'unknown') existing.openness = openness
      existing.sourceUrls = [...new Set([...existing.sourceUrls, ...urls])].slice(0, 5)
    }
  }

  const models = [...byKey.values()].sort(
    (a, b) => a.orgSlug.localeCompare(b.orgSlug) || a.approxDate.localeCompare(b.approxDate) || a.name.localeCompare(b.name),
  )

  // ---- stats ----
  const byOrg = new Map<string, number>()
  const byYear = new Map<string, number>()
  const byOpen = new Map<string, number>()
  for (const m of models) {
    byOrg.set(m.org, (byOrg.get(m.org) ?? 0) + 1)
    byYear.set(yearOf(m.approxDate), (byYear.get(yearOf(m.approxDate)) ?? 0) + 1)
    byOpen.set(m.openness, (byOpen.get(m.openness) ?? 0) + 1)
  }
  const stats = {
    resultLines,
    rawRows: raw.length,
    canonical: models.length,
    orgs: byOrg.size,
    byOpenness: Object.fromEntries([...byOpen.entries()].sort((a, b) => b[1] - a[1])),
    byYear: Object.fromEntries([...byYear.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
    topOrgs: Object.fromEntries([...byOrg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)),
  }

  await writeFile(outFile, `${JSON.stringify({ stats, models }, null, 2)}\n`)
  console.log(`census: ${raw.length} raw → ${models.length} canonical models across ${byOrg.size} orgs (from ${resultLines} agents)`)
  console.log(`openness: ${JSON.stringify(stats.byOpenness)}`)
  console.log(`by year: ${JSON.stringify(stats.byYear)}`)
  console.log(`top orgs: ${[...byOrg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([o, n]) => `${o}(${n})`).join(', ')}`)
}

main()
