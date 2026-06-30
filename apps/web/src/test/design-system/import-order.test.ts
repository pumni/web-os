import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Guards the load-bearing source ORDER of the `@pumni/ui` style imports in the
 * app's `globals.css`.
 *
 * The token cascade is order-dependent and the dependency is invisible at a
 * glance:
 *  - `brand.css` must precede `theme.css` — the semantic layer resolves
 *    `--primary`/`--ring` through `var(--brand-*)`, so the brand inputs must be
 *    defined first (the same assumption `glass-contrast.test.ts` already bakes
 *    into its token resolver: "brand.css is read before theme.css").
 *  - `personalization.css` must follow `theme.css` — its `[data-accent]` rules
 *    tie on specificity with `:root`/`.dark` and win only on source order.
 *  - every other `@pumni/ui` style sheet (glass/motion/desktop/…) reads semantic
 *    tokens, so it must come after `theme.css`.
 *
 * A refactor that reorders these imports compiles fine but silently breaks the
 * brand cascade. This test makes the ordering explicit and enforced.
 */

const globals = readFileSync(path.join(repoRoot, 'apps/web/src/app/globals.css'), 'utf8');

/** The `@pumni/ui/styles/<name>.css` imports in source order. */
const importedStyles = [...globals.matchAll(/@import\s+'@pumni\/ui\/styles\/([\w-]+)\.css'/g)].map(
  (match) => match[1]!,
);

const orderOf = (name: string) => {
  const index = importedStyles.indexOf(name);
  expect(index, `globals.css does not import @pumni/ui/styles/${name}.css`).toBeGreaterThanOrEqual(
    0,
  );
  return index;
};

describe('globals.css @pumni/ui style import order', () => {
  it('loads the critical token cascade as tokens → brand → theme → personalization', () => {
    const tokens = orderOf('tokens');
    const brand = orderOf('brand');
    const theme = orderOf('theme');
    const personalization = orderOf('personalization');

    expect(tokens, 'tokens.css must be imported before brand.css').toBeLessThan(brand);
    expect(brand, 'brand.css must be imported before theme.css').toBeLessThan(theme);
    expect(theme, 'theme.css must be imported before personalization.css').toBeLessThan(
      personalization,
    );
  });

  it('imports every other @pumni/ui style sheet after theme.css (they read semantic tokens)', () => {
    const theme = orderOf('theme');
    const tierFiles = new Set(['tokens', 'brand', 'theme']);

    for (const [index, name] of importedStyles.entries()) {
      if (tierFiles.has(name)) continue;
      expect(index, `${name}.css must be imported after theme.css`).toBeGreaterThan(theme);
    }
  });
});
