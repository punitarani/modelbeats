import { expect, test } from '@playwright/test'

test.describe('rankings', () => {
  test('default view: 55 rows sorted by index, opus first', async ({ page }) => {
    await page.goto('/rankings')
    await expect(page.getByTestId('rankings-meta')).toContainText('55 models · sorted by Index')
    const first = page.getByTestId('ranking-row').first()
    await expect(first).toContainText('Claude Opus 4.8')
    await expect(first).toContainText('87.9')
  })

  test('column sort click mutates URL and reorders rows', async ({ page }) => {
    await page.goto('/rankings')
    await page.getByTestId('sort-lcb').click()
    await expect(page).toHaveURL(/sort=-lcb/)
    // LCB leader is Gemini 3.1 Pro (87.3), displacing opus
    await expect(page.getByTestId('ranking-row').first()).toContainText('Gemini 3.1 Pro')
    // second click flips to ascending
    await page.getByTestId('sort-lcb').click()
    await expect(page).toHaveURL(/sort=lcb/)
  })

  test('deep link SSRs pre-sorted + pre-filtered (URL is the state)', async ({ request }) => {
    const res = await request.get('/rankings?sort=-aime&open=open')
    const html = await res.text()
    // inspect only the first rendered row (dehydrated query state contains everything)
    const firstRow = html.slice(
      html.indexOf('data-testid="ranking-row"'),
      html.indexOf('data-testid="ranking-row"') + 400,
    )
    expect(firstRow).toContain('DeepSeek V4.5') // open-weights AIME leader (98.0)
    expect(firstRow).not.toContain('Claude Opus') // closed models filtered server-side
  })

  test('org filter narrows rows', async ({ page }) => {
    await page.goto('/rankings')
    await page.getByTestId('rankings-org').selectOption('anthropic')
    await expect(page).toHaveURL(/org=anthropic/)
    await expect(page.getByTestId('rankings-meta')).toContainText('6 models')
  })

  test('category param filters benchmark columns; bogus category 404s', async ({ page }) => {
    await page.goto('/rankings/coding')
    await expect(page.getByTestId('sort-swe')).toBeVisible()
    await expect(page.getByTestId('sort-mmlu')).not.toBeVisible()
    const res = await page.goto('/rankings/astrology')
    expect(res?.status()).toBe(404)
  })
})
