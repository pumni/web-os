import { expect, test } from "@playwright/test";

/**
 * Visual-regression contract for the design system. Screenshots the showcase
 * surface so token / component / glass drift is caught before merge.
 *
 * Determinism: `reducedMotion: "reduce"` makes the motion `Window` and all CSS
 * transitions settle instantly (it drives our own reduced-motion paths), and we
 * snapshot the `showcase-root` element so browser chrome / dev indicators stay
 * out of frame. Baselines are platform-specific (Playwright suffixes the OS) —
 * generate them in the CI runner, never commit Windows baselines for Linux CI.
 */
const ROOT = "showcase-root";

test.describe("design system visual regression", () => {
  test("light + default accent", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.goto("/design-system-preview");

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot("showcase-light.png", { animations: "disabled" });
  });

  test("dark + default accent", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.goto("/design-system-preview");

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot("showcase-dark.png", { animations: "disabled" });
  });

  test("light + violet accent", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.addInitScript(() => window.localStorage.setItem("pumni-accent", "violet"));
    await page.goto("/design-system-preview");

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot("showcase-violet.png", { animations: "disabled" });
  });

  test("light + rose accent", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
    await page.addInitScript(() => window.localStorage.setItem("pumni-accent", "rose"));
    await page.goto("/design-system-preview");

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot("showcase-rose.png", { animations: "disabled" });
  });

  test("dark + strong glass", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    await page.addInitScript(() => window.localStorage.setItem("pumni-glass", "strong"));
    await page.goto("/design-system-preview");

    const root = page.getByTestId(ROOT);
    await expect(root).toBeVisible();
    await expect(root).toHaveScreenshot("showcase-glass-strong.png", { animations: "disabled" });
  });
});
