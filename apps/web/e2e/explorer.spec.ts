import { expect, test } from '@playwright/test'
import { gotoHydrated, pickOption } from './helpers'

test.describe('model explorer', () => {
  test('default grid shows all 55 models', async ({ page }) => {
    await gotoHydrated(page, '/models')
    await expect(page.getByTestId('explorer-count')).toHaveText('55 models')
    await expect(page.getByTestId('explorer-card')).toHaveCount(55)
  })

  test('runs-on-my-hardware facet applies the curated 1.08× rule', async ({ page }) => {
    await gotoHydrated(page, '/models')
    await pickOption(page, 'explorer-gpu', 'RTX 4090 24GB')
    await expect(page).toHaveURL(/gpu=rtx4090/)
    // 13×1.08 = 14.04 ≤ 24 keeps GPT-OSS-20B; 66×1.08 > 24 drops GPT-OSS-120B
    await expect(page.getByTestId('explorer-card').filter({ hasText: 'GPT-OSS-20B' })).toHaveCount(
      1,
    )
    await expect(page.getByTestId('explorer-card').filter({ hasText: 'GPT-OSS-120B' })).toHaveCount(
      0,
    )
  })

  test('deep-linked facets restore on load (URL round-trip)', async ({ page }) => {
    await gotoHydrated(page, '/models?open=open&size=s&caps=reason')
    await expect(page.getByTestId('explorer-count')).toHaveText('3 models') // qwen3-8b, smollm3-3b, phi-4-reasoning
    await expect(page.getByTestId('cap-reason')).toHaveAttribute('aria-pressed', 'true')
  })

  test('cheapest-API sort puts Llama 3.1 8B first ($0.08/M out)', async ({ page }) => {
    await gotoHydrated(page, '/models')
    await pickOption(page, 'explorer-sort', 'Cheapest API')
    await expect(page).toHaveURL(/sort=cheap/)
    await expect(page.getByTestId('explorer-card').first()).toContainText('Llama 3.1 8B')
  })

  test('reset clears facets back to clean URL', async ({ page }) => {
    await gotoHydrated(page, '/models?open=open&size=s&caps=reason')
    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(page).toHaveURL(/\/models$/)
    await expect(page.getByTestId('explorer-count')).toHaveText('55 models')
  })
})
