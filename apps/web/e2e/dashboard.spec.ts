import { expect, test } from '@playwright/test'
import { datasetCounts, gotoHydrated, pickOption } from './helpers'

test.describe('dashboard overview', () => {
  test('stat strip reflects the real catalog', async ({ page }) => {
    const { models, organizations } = datasetCounts()
    await gotoHydrated(page, '/')
    const cards = page.getByTestId('stat-card')
    await expect(cards).toHaveCount(4)
    await expect(cards.nth(0)).toContainText(String(models))
    await expect(cards.nth(0)).toContainText(`${organizations} organizations`)
    // real data quirk: the top-by-index closed AND open models both happen to lack an Arena
    // score, so the open-closed Elo gap is undefined ('—'), not a number — this is the
    // documented C1 behavior (sparse coverage), not a bug.
    await expect(cards.nth(3)).toContainText('—')
    await expect(cards.nth(3)).toContainText('OLMo 3-Think 32B leads open')
  })

  test('scatter plots every priced+arena model, movers show lineage gains', async ({ page }) => {
    await gotoHydrated(page, '/')
    // only 6 of the 463 models carry both a price and an Arena score in the real corpus
    await expect(page.getByTestId('scatter-point')).toHaveCount(6)
    const movers = page.getByTestId('movers')
    await expect(movers).toContainText('Doubao-Seed-1.6')
    await expect(movers).toContainText('+96')
  })

  test('scatter tooltip appears on hover and on keyboard focus', async ({ page }) => {
    await gotoHydrated(page, '/')
    const point = page.locator('a[aria-label^="Gemini 3.1 Flash-Lite —"]')
    await point.hover()
    const tip = page.getByTestId('chart-tip')
    await expect(tip).toBeVisible()
    await expect(tip).toContainText('Gemini 3.1 Flash-Lite')
    await expect(tip).toContainText('Elo')
    await page.mouse.move(0, 0)
    await expect(tip).toHaveCount(0)
    // keyboard parity: the same details on focus (dataviz interaction rule)
    await point.focus()
    await expect(page.getByTestId('chart-tip')).toContainText('Gemini 3.1 Flash-Lite')
  })

  test('arena rail is ordered and quick compare navigates', async ({ page }) => {
    await gotoHydrated(page, '/')
    const rail = page.getByTestId('arena-rail')
    // real global Arena Elo leader across all 463 models
    await expect(rail).toContainText('Gemini 3.1 Flash-Lite')
    await expect(rail).toContainText('1432')
    await pickOption(page, 'qc-b', 'Llama 3.1 405B — Meta')
    await page.getByTestId('qc-go').click()
    // quick-compare slot A defaults to the #1-by-index model (Doubao-Seed-1.6)
    await expect(page).toHaveURL(/m=doubao-seed-1-6(%2C|,)llama-3-1-405b/)
  })
})

test.describe('dashboard releases + bench tabs', () => {
  test('tab switch mutates the URL without a reload', async ({ page }) => {
    const { benchmarks } = datasetCounts()
    await gotoHydrated(page, '/')
    await page.getByRole('button', { name: 'Releases' }).click()
    await expect(page).toHaveURL(/\?tab=releases/)
    await expect(page.getByTestId('release-feed')).toBeVisible()
    // dot color + note + INDEX column present
    await expect(page.getByTestId('release-feed')).toContainText('INDEX')
    await page.getByRole('button', { name: 'Benchmarks' }).click()
    await expect(page).toHaveURL(/\?tab=bench/)
    await expect(page.getByTestId('bench-card')).toHaveCount(benchmarks)
  })

  test('open-vs-closed frontier degrades gracefully when neither leader has an Arena score', async ({
    page,
  }) => {
    // Same real-data quirk as the stat strip: the top-by-index closed (Doubao-Seed-1.6) and
    // open (OLMo 3-Think 32B) models are both sparse-coverage models with no Arena result, so
    // the frontier widget has nothing to plot and the gap sentence is empty — verifying this
    // renders as an empty, not broken, state.
    await gotoHydrated(page, '/?tab=releases')
    await expect(page.getByTestId('frontier')).toHaveText('')
    await expect(page.getByTestId('gap-note')).toHaveText('')
  })

  test('/timeline folds into the releases tab (D6)', async ({ page }) => {
    await page.goto('/timeline')
    await expect(page).toHaveURL(/\/\?tab=releases/)
    await expect(page.getByTestId('release-feed')).toBeVisible()
  })
})
