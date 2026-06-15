import { expect, test } from '@playwright/test';

/**
 * Visual-regression contract for the design system. Screenshots the showcase
 * surface so token / component / surface drift is caught before merge.
 *
 * Determinism: `reducedMotion: "reduce"` makes the motion `Window` and all CSS
 * transitions settle instantly (it drives our own reduced-motion paths), and we
 * snapshot the `showcase-root` element so browser chrome / dev indicators stay
 * out of frame. Baselines are platform-specific (Playwright suffixes the OS) —
 * generate them in the CI runner, never commit Windows baselines for Linux CI.
 */
const ROOT = 'showcase-root';

test.describe('design system visual regression', () => {
  test('light + default accent', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.goto('/design-system-preview');

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('showcase-light.png', { animations: 'disabled' });
  });

  test('dark + default accent', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.goto('/design-system-preview');

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('showcase-dark.png', { animations: 'disabled' });
  });

  test('light + violet accent', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.addInitScript(() => window.localStorage.setItem('pumni-accent', 'violet'));
    await page.goto('/design-system-preview');

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('showcase-violet.png', { animations: 'disabled' });
  });

  test('light + rose accent', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
    await page.addInitScript(() => window.localStorage.setItem('pumni-accent', 'rose'));
    await page.goto('/design-system-preview');

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('showcase-rose.png', { animations: 'disabled' });
  });

  test('dark + strong surface intensity', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    // Current storage key remains `pumni-glass`; this test name uses product language.
    await page.addInitScript(() => window.localStorage.setItem('pumni-glass', 'strong'));
    await page.goto('/design-system-preview');

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot('showcase-glass-strong.png', { animations: 'disabled' });
  });

  /**
   * Z-index regression: Select inside Dialog (§1 of layering-interaction-2026-upgrade).
   *
   * Bug: SelectContent was z-overlay (900) — below modal at z-modal (1000).
   * Fix: SelectContent is now z-popover (1050) — above the dialog panel.
   *
   * This test opens the dialog, clicks the Select trigger, and asserts the
   * dropdown options are visible. If the z-index regresses to 900, Radix still
   * mounts the listbox but it is painted behind the dialog panel and
   * `toBeVisible()` fails because it checks CSS visibility / opacity / pointer-events
   * (Radix uses visibility:hidden on closed state, so this assertion is meaningful).
   */
  test('z-index: select dropdown is visible inside a dialog (§1 regression lock)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
    await page.goto('/design-system-preview');

    // Open the dialog that contains the z-layering demo Select
    await page.getByRole('button', { name: 'Trigger Dialog' }).click();
    await expect(page.getByRole('dialog', { name: 'Overlay Dialog Surface' })).toBeVisible();

    // Open the Select inside the dialog — the listbox must render ABOVE the modal panel
    await page.getByRole('combobox', { name: /priority/i }).click();

    // The option list must be visible; if z-popover < z-modal this fails
    const option = page.getByRole('option', { name: 'High' });
    await expect(option).toBeVisible();

    // Verify it also has z-index above the modal (computed style check)
    const selectContent = page.locator("[data-slot='select-content']");
    await expect(selectContent).toBeVisible();
    const zIndex = await selectContent.evaluate((el) => window.getComputedStyle(el).zIndex);
    // z-popover = 1050, which is > z-modal = 1000
    expect(Number(zIndex)).toBeGreaterThan(1000);
  });
});
