import { expect, test } from '@playwright/test'
import { datasetCounts, gotoHydrated } from './helpers'

test('methodology publishes the exact formulas and current dataset facts', async ({ page }) => {
  const { models, asOf } = datasetCounts()
  await gotoHydrated(page, '/methodology')
  await expect(page.getByText('norm(b, v) = clamp((v − b.min)')).toBeVisible()
  await expect(page.getByText('index = mean(0.53, 0.71) × 100 = 61.8')).toBeVisible()
  await expect(page.getByText('ratio ≤ 0.8')).toBeVisible()
  // real corpus is a mix of self-reported/independent/arena sources, never collapsed
  await expect(page.getByText(/mix of/)).toBeVisible()
  await expect(page.getByText(new RegExp(`${models} models, as of ${asOf}`))).toBeVisible()
})
