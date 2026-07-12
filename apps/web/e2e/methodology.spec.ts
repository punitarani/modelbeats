import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test('methodology publishes the exact formulas and current dataset facts', async ({ page }) => {
  await gotoHydrated(page, '/methodology')
  await expect(page.getByText('norm(b, v) = clamp((v − b.min)')).toBeVisible()
  await expect(page.getByText('index = mean(0.50, 0.25) × 100 = 37.5')).toBeVisible()
  await expect(page.getByText('ratio ≤ 0.8')).toBeVisible()
  await expect(page.getByText(/entirely\s+curated/)).toBeVisible()
  await expect(page.getByText(/55 models, as of July 11, 2026/)).toBeVisible()
})
