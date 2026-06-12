import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression guard for a silent, high-impact build bug: Tailwind v4 only
 * auto-detects sources inside this app, so `@pumni/ui` component classes
 * (glass-panel, Card layout, dropdown/search animations, …) are purged unless
 * `globals.css` explicitly registers the package source via `@source`.
 *
 * If this test fails, the UI package will render unstyled. The fix is to keep
 * an `@source` directive pointing at `packages/ui/src` in globals.css. Any new
 * workspace package that emits Tailwind classes needs its own `@source` too.
 */
describe("tailwind @source coverage", () => {
  const globals = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");

  it("registers the @pumni/ui package source so its classes are not purged", () => {
    const sources = [...globals.matchAll(/@source\s+["']([^"']+)["']/g)].map((m) => m[1] ?? "");
    expect(sources.some((s) => /packages\/ui\/src/.test(s))).toBe(true);
  });
});
