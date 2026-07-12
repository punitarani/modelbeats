import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('app shell', () => {
  test('renders sidebar with real catalog stats', async ({ page }) => {
    await gotoHydrated(page, '/')
    await expect(page.getByText('RankedModel').first()).toBeVisible()
    await expect(page.getByTestId('footer-stats')).toContainText('55 models · 19 orgs')
  })

  test('sidebar navigation drives the topbar title', async ({ page }) => {
    await gotoHydrated(page, '/')
    await page.locator('aside').getByRole('link', { name: 'Rankings' }).click()
    await expect(page).toHaveURL(/\/rankings$/)
    await expect(page.getByTestId('page-title')).toHaveText('Global Rankings')
  })

  test('theme defaults dark, toggles, and persists across reload', async ({ page }) => {
    await gotoHydrated(page, '/')
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
    await page.getByTestId('theme-toggle').click()
    await expect(html).not.toHaveClass(/dark/)
    await page.reload()
    await expect(html).not.toHaveClass(/dark/) // localStorage persisted 'light'
    await page.getByTestId('theme-toggle').click()
    await expect(html).toHaveClass(/dark/)
  })

  test('unknown URL returns HTTP 404 with the designed copy', async ({ page }) => {
    const response = await gotoHydrated(page, '/definitely-not-a-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Page not found.')).toBeVisible()
  })

  test('SSR delivers content before hydration (catalog visible in raw HTML)', async ({
    request,
  }) => {
    const res = await request.get('/debug/catalog')
    expect(res.status()).toBe(200)
    const html = await res.text()
    // React SSR splits interpolations with comment nodes — strip tags/comments first.
    const text = html.replaceAll(/<[^>]+>/g, '')
    expect(text).toContain('55 models')
  })
})
