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
