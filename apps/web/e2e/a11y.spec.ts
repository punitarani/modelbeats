import { expect, test } from '@playwright/test'
import { axeScan } from './axe'
import { gotoHydrated } from './helpers'

const ROUTES = [
  '/',
  '/?tab=releases',
  '/?tab=bench',
  '/rankings',
  '/models',
  '/models/gpt-5-6',
  '/models/gpt-oss-20b-medium',
  '/compare?m=gpt-5-2,deepseek-v3-1-thinking',
  '/hardware',
  '/benchmarks',
  '/benchmarks/swe-bench',
  '/organizations/anthropic',
  '/families/claude-4',
  '/methodology',
  '/search?q=qwen',
  '/saved',
]

for (const route of ROUTES) {
  for (const theme of ['dark', 'light'] as const) {
    test(`axe clean: ${route} [${theme}]`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('rankedmodel.theme', t), theme)
      await gotoHydrated(page, route)
      const violations = await axeScan(page)
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.length} nodes (${v.nodes[0]?.target}`),
      ).toEqual([])
    })
  }
}

test('keyboard: rankings sort buttons are tabbable and Enter-operable', async ({ page }) => {
  await gotoHydrated(page, '/rankings')
  await page.getByTestId('sort-gpqa').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/sort=-gpqa/)
})
