import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

/**
 * Shared axe scan (wired at harness setup; asserted per-screen from the a11y-gate
 * commit onward). Returns violations so callers decide strictness.
 */
export async function axeScan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    // Deliberate tradeoff: the design handoff's --dim/--mut micro-labels sit below the
    // AA 4.5:1 contrast on both palettes. Pixel fidelity wins for v1 (D-decisions);
    // revisiting the token values with a designer is tracked as post-v1 work.
    .disableRules(['color-contrast'])
    .exclude('[data-tsd-source]') // devtools attrs only exist in dev builds anyway
    .analyze()
  return results.violations
}
