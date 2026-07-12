import type { Page, Response } from '@playwright/test'

/**
 * goto + wait for the app's hydration marker. Under parallel load, interacting with
 * SSR'd controls before React attaches handlers silently does nothing — every spec
 * that clicks/selects must go through this. Returns the navigation response so status
 * assertions keep working.
 */
export async function gotoHydrated(page: Page, url: string): Promise<Response | null> {
  const response = await page.goto(url)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
  return response
}

/**
 * Pick an option in a shadcn Select/Combobox (popup listbox, not a native <select>,
 * so page.selectOption does not apply): open via the trigger's testid, then click the
 * option by its exact visible label. Both picker variants render role="option" items
 * in a portal, so one helper covers them.
 */
export async function pickOption(page: Page, testid: string, optionLabel: string) {
  await page.getByTestId(testid).click()
  await page.getByRole('option', { name: optionLabel, exact: true }).click()
}
