import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('dashboard overview', () => {
  test('stat strip reflects the real catalog', async ({ page }) => {
    await gotoHydrated(page, '/')
    const cards = page.getByTestId('stat-card')
    await expect(cards).toHaveCount(4)
    await expect(cards.nth(0)).toContainText('55')
    await expect(cards.nth(0)).toContainText('19 organizations')
    await expect(cards.nth(3)).toContainText('Elo')
  })

  test('scatter plots every priced+arena model, movers show lineage gains', async ({ page }) => {
    await gotoHydrated(page, '/')
    // 49 priced models all carry arena scores in the curated set
    await expect(page.getByTestId('scatter-point')).toHaveCount(49)
    const movers = page.getByTestId('movers')
    await expect(movers).toContainText('Qwen3.7 Max')
    await expect(movers).toContainText('+39.6')
  })

  test('arena rail is ordered and quick compare navigates', async ({ page }) => {
    await gotoHydrated(page, '/')
    const rail = page.getByTestId('arena-rail')
    await expect(rail).toContainText('Claude Opus 4.8')
    await expect(rail).toContainText('1510')
    await page.getByTestId('qc-b').selectOption('glm-5-2')
    await page.getByTestId('qc-go').click()
    await expect(page).toHaveURL(/m=claude-opus-4-8(%2C|,)glm-5-2/)
  })
})
