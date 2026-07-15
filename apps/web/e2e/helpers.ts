import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page, Response } from '@playwright/test'

const DATA_ROOT = join(import.meta.dirname, '..', '..', '..', 'data')

/**
 * Real dataset counts, read straight off the generated `/data` tree (not the design's old
 * fixed numbers) so count-relative assertions track whatever corpus is currently generated
 * instead of a hardcoded snapshot size.
 */
export function datasetCounts() {
  const countJsonFiles = (dir: string) => {
    let n = 0
    for (const entry of readdirSync(join(DATA_ROOT, dir), { withFileTypes: true })) {
      if (entry.isDirectory()) n += countJsonFiles(join(dir, entry.name))
      else if (entry.name.endsWith('.json')) n += 1
    }
    return n
  }
  const meta = JSON.parse(readFileSync(join(DATA_ROOT, 'meta.json'), 'utf8'))
  return {
    models: countJsonFiles('models'),
    organizations: countJsonFiles('organizations'),
    families: countJsonFiles('families'),
    benchmarks: countJsonFiles('benchmarks'),
    asOf: meta.asOf as string,
  }
}

/**
 * A model's current Elo rating/rank off the committed derived scores (not a hardcoded
 * literal) — so a rank-position assertion tracks whatever the corpus currently produces
 * instead of breaking every time an unrelated model's data shifts that model's position.
 */
export function modelScore(slug: string): { index: number; rank: number | null } {
  const scores = JSON.parse(readFileSync(join(DATA_ROOT, 'derived', 'scores.json'), 'utf8'))
  const m = (
    scores.models as { slug: string; overallIndex: number; rankOverall: number | null }[]
  ).find((x) => x.slug === slug)
  if (!m) throw new Error(`no derived score for '${slug}' — is it still in the corpus?`)
  return { index: m.overallIndex, rank: m.rankOverall }
}

/**
 * goto + wait for the app's hydration marker. Under parallel load, interacting with
 * SSR'd controls before React attaches handlers silently does nothing — every spec
 * that clicks/selects must go through this. Returns the navigation response so status
 * assertions keep working.
 */
export async function gotoHydrated(page: Page, url: string): Promise<Response | null> {
  const response = await page.goto(url)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
  return response
}

/**
 * Pick an option in a shadcn Select/Combobox (popup listbox, not a native <select>,
 * so page.selectOption does not apply): open via the trigger's testid, then click the
 * option by its exact visible label. Both picker variants render role="option" items
 * in a portal, so one helper covers them.
 */
export async function pickOption(page: Page, testid: string, optionLabel: string) {
  await page.getByTestId(testid).click()
  await page.getByRole('option', { name: optionLabel, exact: true }).click()
}
