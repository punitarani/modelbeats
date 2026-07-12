import { expect, test } from '@playwright/test'
import { gotoHydrated } from './helpers'

test.describe('model detail', () => {
  test('open model shows the Run-it-locally card matching the fit engine', async ({ page }) => {
    await gotoHydrated(page, '/models/gpt-oss-20b')
    await expect(page.getByTestId('vram-q4')).toHaveText('13 GB')
    // 13×1.08 = 14.04: fits RTX 4070 Ti 16GB, not RTX 3060 12GB
    const chips = page.getByTestId('fits-chips')
    await expect(chips).toContainText('RTX 4070 Ti 16GB')
    await expect(chips).not.toContainText('RTX 3060 12GB')
    await expect(page.getByTestId('tps-line')).toHaveText('~118 tok/s on RTX 4090 (Q4, llama.cpp)')
    await expect(page.getByText('MXFP4 · GGUF Q4 · GGUF Q8')).toBeVisible()
  })

  test('Phi-4 Reasoning Plus shows two enabled and four disabled capability icons', async ({
    page,
  }) => {
    await gotoHydrated(page, '/models/phi-4-reasoning')
    await expect(page.getByTestId('capability-reasoning').locator('svg.lucide-check')).toHaveCount(
      1,
    )
    await expect(page.getByTestId('capability-coding').locator('svg.lucide-check')).toHaveCount(1)
    await expect(page.getByTestId('capability-vision').locator('svg.lucide-x')).toHaveCount(1)
    await expect(
      page.getByTestId('capability-functionCalling').locator('svg.lucide-x'),
    ).toHaveCount(1)
    await expect(page.getByTestId('capability-toolUse').locator('svg.lucide-x')).toHaveCount(1)
    await expect(page.getByTestId('capability-agentic').locator('svg.lucide-x')).toHaveCount(1)
  })

  test('closed model shows the API-only pricing card + index rank', async ({ page }) => {
    await gotoHydrated(page, '/models/claude-opus-4-8')
    await expect(page.getByTestId('model-index')).toHaveText('87.9')
    await expect(page.getByText('Index · rank #1')).toBeVisible()
    await expect(page.getByTestId('price-in')).toHaveText('$15')
    await expect(page.getByTestId('price-out')).toHaveText('$75')
    // benchmark row: arena 1510, field best = this model
    await expect(page.getByTestId('bench-arena')).toContainText('1510')
    await expect(page.getByTestId('bench-arena')).toContainText('best: this model')
    // family card lists the Claude 4 members
    await expect(page.getByTestId('family-list').getByRole('link')).toHaveCount(5)
  })

  test('compare button lands on compare with both models loaded', async ({ page }) => {
    await gotoHydrated(page, '/models/claude-opus-4-8')
    await page.getByTestId('compare-this').click()
    // opus+deepseek is the compare default pair, so stripSearchParams yields a bare URL
    await expect(page).toHaveURL(/\/compare$/)
    const legend = page.getByTestId('compare-legend')
    await expect(legend).toContainText('Claude Opus 4.8')
    await expect(legend).toContainText('DeepSeek V4.5')
  })

  test('unknown model slug 404s with the designed copy', async ({ page }) => {
    const res = await gotoHydrated(page, '/models/not-a-real-model')
    expect(res?.status()).toBe(404)
    await expect(page.getByText('Model not found.')).toBeVisible()
  })
})
