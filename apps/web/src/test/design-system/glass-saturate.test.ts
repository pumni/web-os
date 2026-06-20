import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Drift guard for the engineered-glass vibrancy token (ADR-0012).
 *
 * Before the engineered-glass refactor, `glass.css` hard-coded `saturate(1.3)`
 * (the iOS/vibrancy pump) on every `glass-*` utility. That magic value could
 * silently come back in a future edit. The refactor tokenizes it once as
 * `--glass-saturate` (tokens.css) so the whole surface family shares one knob.
 *
 * This test asserts that `glass.css` never re-introduces a numeric `saturate(`
 * literal — every occurrence must read the `--glass-saturate` token. It mirrors
 * the regex-over-file pattern used by the other CSS-token guards in this folder.
 */
describe('glass vibrancy is tokenized', () => {
  const glassCss = readFileSync(path.join(repoRoot, 'packages/ui/src/styles/glass.css'), 'utf8');

  it('exposes the single --glass-saturate knob in tokens.css', () => {
    const tokensCss = readFileSync(
      path.join(repoRoot, 'packages/ui/src/styles/tokens.css'),
      'utf8',
    );
    expect(tokensCss).toMatch(/--glass-saturate:\s*[\d.]+/);
  });

  it('contains no hard-coded numeric saturate() literal in glass.css', () => {
    // `saturate(` immediately followed by a digit (e.g. saturate(1.3),
    // saturate(1)) is the banned form — a future magic vibrancy value.
    const literals = [...glassCss.matchAll(/saturate\(\s*\d/g)].map((m) => m[0]);
    expect(literals, `banned saturate() literals found: ${literals.join(', ')}`).toEqual([]);
  });

  it('uses --glass-saturate for every glass saturate() call', () => {
    // Every saturate() that remains must read the token (a nested `var(...)`
    // call), not a magic number. Match the full call form including the closing
    // paren so we don't get fooled by the nested var() parens.
    const allSaturate = [...glassCss.matchAll(/saturate\(\s*var\(([^)]+)\)\s*\)/g)].map(
      (m) => m[1]?.trim() ?? '',
    );
    expect(allSaturate.length, 'no saturate(var(...)) calls found in glass.css').toBeGreaterThan(0);
    for (const arg of allSaturate) {
      expect(arg).toBe('--glass-saturate');
    }
  });
});
