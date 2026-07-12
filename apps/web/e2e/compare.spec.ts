import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('compare', () => {
  test('deep link renders two columns, radar polygons and legend', async ({ page }) => {
    await gotoHydrated(page, '/compare?m=claude-opus-4-8,deepseek-v4-5')
    const legend = page.getByTestId('compare-legend')
    await expect(legend).toContainText('Claude Opus 4.8')
    await expect(legend).toContainText('87.9')
    await expect(legend).toContainText('DeepSeek V4.5')
    await expect(legend).toContainText('83.7')
    // 4 rings + 2 series polygons
    await expect(page.getByTestId('compare-radar').locator('polygon')).toHaveCount(6)
  })

  test('best-value highlighting favors the right cells', async ({ page }) => {
    await gotoHydrated(page, '/compare?m=claude-opus-4-8,deepseek-v4-5')
    const idxRow = page.getByTestId('spec-index-score')
    await expect(idxRow.locator('span').nth(1)).toHaveCSS('font-weight', '600') // opus 87.9
    const priceRow = page.getByTestId('spec-price-out-m')
    await expect(priceRow.locator('span').nth(2)).toHaveCSS('font-weight', '600') // deepseek $1.3
  })

  test('changing slot C updates the URL', async ({ page }) => {
    await gotoHydrated(page, '/compare?m=claude-opus-4-8,deepseek-v4-5')
    await page.getByTestId('compare-slot-2').selectOption('glm-5-2')
    await expect(page).toHaveURL(/m=claude-opus-4-8(%2C|,)deepseek-v4-5(%2C|,)glm-5-2/)
    await expect(page.getByTestId('compare-radar').locator('polygon')).toHaveCount(7)
  })

  test('save → appears on /saved → open restores → delete removes', async ({ page }) => {
    await gotoHydrated(page, '/compare?m=kimi-k2-5,glm-5-2')
    await page.getByTestId('save-name').fill('agentic duo')
    await page.getByTestId('save-comparison').click()
    await gotoHydrated(page, '/saved')
    const row = page.getByTestId('saved-list').getByText('agentic duo')
    await expect(row).toBeVisible()
    await page.getByRole('link', { name: 'Open' }).click()
    await expect(page).toHaveURL(/m=kimi-k2-5(%2C|,)glm-5-2/)
    await gotoHydrated(page, '/saved')
    await page.getByRole('button', { name: 'Delete agentic duo' }).click()
    await page.reload()
    await expect(page.getByTestId('saved-list')).toContainText('Nothing saved yet.')
  })
})
