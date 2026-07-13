import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('search', () => {
  test("'/' focuses the topbar, typing opens the dropdown, Enter navigates", async ({ page }) => {
    await gotoHydrated(page, '/rankings')
    await page.keyboard.press('/')
    await expect(page.getByTestId('topbar-search')).toBeFocused()
    await page.keyboard.type('llama 3.1 405b')
    await expect(page.getByTestId('search-dropdown')).toContainText('Llama 3.1 405B')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/models\/llama-3-1-405b$/)
  })

  test('Escape closes the dropdown', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.getByTestId('topbar-search').fill('qwen')
    await expect(page.getByTestId('search-dropdown')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('search-dropdown')).toHaveCount(0)
  })

  test('/search?q= SSRs grouped results', async ({ page }) => {
    await gotoHydrated(page, '/search?q=qwen')
    // real corpus: 37 models across the Qwen 1/1.5/2/2.5/3 series match "qwen" (name/org/family)
    await expect(page.getByTestId('search-summary')).toContainText('37 models')
    await expect(page.getByTestId('search-model')).toHaveCount(37)
  })
})
