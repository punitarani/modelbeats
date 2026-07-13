import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('organization + family hubs', () => {
  test('/organizations/anthropic lists its 19 models with cadence', async ({ page }) => {
    await gotoHydrated(page, '/organizations/anthropic')
    await expect(page.getByTestId('org-meta')).toContainText('19 tracked models · 7 families')
    await expect(page.getByTestId('org-model-row')).toHaveCount(19)
    // rows sort by release date desc — Claude Opus 4.6 (2026-02-05) is Anthropic's newest
    await expect(page.getByTestId('org-model-row').first()).toContainText('Claude Opus 4.6')
  })

  test('/families/claude-4 shows progression and succession deltas', async ({ page }) => {
    await gotoHydrated(page, '/families/claude-4')
    await expect(page.getByTestId('family-member')).toHaveCount(9)
    await expect(page.getByTestId('family-sparkline').getByTestId('spark-dot')).toHaveCount(9)
    // lineage now prefers the canonical config over effort variants: 4.6 succeeds Opus 4.5
    // (the default tier), not the unbenchmarked "(Medium)" config that produced a phantom delta
    const opus46 = page.getByTestId('family-member').filter({ hasText: 'Claude Opus 4.6' })
    await expect(opus46).toContainText('succeeds Claude Opus 4.5')
    await expect(opus46).toContainText('+0.6')
  })

  test('model → family: the back affordance returns to the model, not the parent', async ({
    page,
  }) => {
    await gotoHydrated(page, '/models/claude-opus-4-6')
    await page.getByRole('link', { name: 'Claude 4 family' }).click()
    await expect(page).toHaveURL(/\/families\/claude-4$/)
    // with in-app history the top-left link is a true Back to the origin page
    await page.getByRole('link', { name: 'Back', exact: true }).click()
    await expect(page).toHaveURL(/\/models\/claude-opus-4-6$/)
  })

  test('family hub on direct load falls back to the parent org link', async ({ page }) => {
    await gotoHydrated(page, '/families/claude-4')
    await page.getByRole('link', { name: 'Anthropic', exact: true }).click()
    await expect(page).toHaveURL(/\/organizations\/anthropic$/)
  })

  test('unknown org/family 404', async ({ page }) => {
    expect((await page.goto('/organizations/nonexistent'))?.status()).toBe(404)
    expect((await page.goto('/families/nonexistent'))?.status()).toBe(404)
  })
})
