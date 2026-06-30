import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Drift guard for the border-consumption contract (ADR-0019).
 *
 * ADR-0019 codifies that "border" is THREE concepts — structural hairline,
 * specular rim, status tint — and that the solid vs glass hairline flows must
 * never cross. The risk: a future edit silently swaps the dark `--border` into a
 * glass utility, or the white `--glass-edge` into `surface-raised`, inverting
 * the colour semantics. Nothing in the rendered UI screams "wrong" fast enough
 * to catch it in review — `--glass-edge` on a solid card still "looks like a
 * border" — so this test pins the wiring.
 *
 * Mirrors the read-the-CSS + literal-regex pattern of `glass-rim.test.ts`.
 *
 * What this guard pins:
 *
 * 1. The closed three-token hairline set (`--border`, `--input`, `--glass-edge`)
 *    is defined exactly once per theme (no duplicate that could drift).
 * 2. `surface-raised` (the solid-card elevation utility) is structural-only —
 *    elevation shadow, NO specular rim. It does NOT read `--surface-rim-top`
 *    (solid dropped the rim by ADR-0020), `--glass-shadow-edge`, or
 *    `--glass-edge` (all glass-only). `--surface-rim-top` is still defined for
 *    the glass utilities that consume it.
 * 3. `glass-panel` / `glass-window` use `--glass-edge` as their structural
 *    hairline (never `--border`) and carry the full rim pair
 *    (`--surface-rim-top` + `--glass-shadow-edge`).
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';
const THEME_CSS = 'packages/ui/src/styles/theme.css';

const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');
const themeCss = readFileSync(path.join(repoRoot, THEME_CSS), 'utf8');

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extracts the body of the first rule whose selector matches `selector`.
 * `selector` is a LITERAL (e.g. `:root`, `.dark`, `@utility glass-panel`);
 * escaping is applied once here so callers pass the raw form. Body is
 * brace-balanced to handle rules with nested braces.
 */
function readRuleBody(css: string, selector: string): string {
  const stripped = stripComments(css);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startMatch = stripped.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{`, 'm'));
  if (startMatch?.index == null) return '';
  const openIdx = startMatch.index + startMatch[0].lastIndexOf('{');
  let depth = 0;
  for (let i = openIdx; i < stripped.length; i++) {
    if (stripped[i] === '{') depth++;
    else if (stripped[i] === '}') {
      depth--;
      if (depth === 0) return stripped.slice(openIdx + 1, i);
    }
  }
  return '';
}

/** Counts occurrences of a token *definition* (`--name:`) inside a rule body. */
function countTokenDefinitions(body: string, token: string): number {
  const matches = body.match(new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`, 'g'));
  return matches ? matches.length : 0;
}

describe('the structural hairline set is closed and defined once per theme', () => {
  // ADR-0019: exactly three hairline tokens (--border, --input, --glass-edge),
  // each defined exactly once in :root and once in .dark. A duplicate would be
  // a second source of truth that can drift (the same one-concept-two-tokens
  // failure ADR-0018 was opened to find).
  it.each([':root', '.dark'])('%s defines each hairline token exactly once', (selector) => {
    const body = readRuleBody(themeCss, selector);

    expect(
      countTokenDefinitions(body, '--border'),
      `${selector} must define --border exactly once`,
    ).toBe(1);
    expect(
      countTokenDefinitions(body, '--input'),
      `${selector} must define --input exactly once`,
    ).toBe(1);
    expect(
      countTokenDefinitions(body, '--glass-edge'),
      `${selector} must define --glass-edge exactly once`,
    ).toBe(1);
  });

  it.each([':root', '.dark'])(
    '%s defines the glass top rim once (--surface-rim-top, glass-only since ADR-0020)',
    (selector) => {
      const body = readRuleBody(themeCss, selector);
      expect(
        countTokenDefinitions(body, '--surface-rim-top'),
        `${selector} must define --surface-rim-top exactly once`,
      ).toBe(1);
    },
  );
});

describe('surface-raised (solid) stays on the solid hairline flow', () => {
  // The solid-card elevation utility. It is structural-only (ADR-0020): elevation
  // shadow, no specular rim. The specular top rim (--surface-rim-top) was dropped
  // from solid by ADR-0020 (amending ADR-0018's shared seam) so solid surfaces
  // read as structural (`--border` + elevation) while glass owns the specular
  // rim vocabulary. This guard pins that separation — a future edit that re-adds
  // the rim to surface-raised would silently blur the solid/glass boundary.
  it('does NOT carry the specular top rim (solid is structural-only)', () => {
    const body = readRuleBody(themeCss, '@utility surface-raised');

    expect(
      body,
      'surface-raised must not inset the specular top rim (ADR-0020 — solid is structural-only)',
    ).not.toMatch(/--surface-rim-top/);
  });

  it('does NOT read the glass-only bottom rim (--glass-shadow-edge)', () => {
    const body = readRuleBody(themeCss, '@utility surface-raised');

    expect(body, 'surface-raised must not pull the glass bottom rim into solid cards').not.toMatch(
      /--glass-shadow-edge/,
    );
  });

  it('does NOT read --glass-edge as a structural hairline', () => {
    const body = readRuleBody(themeCss, '@utility surface-raised');

    expect(body, 'surface-raised must not borrow the glass structural hairline').not.toMatch(
      /--glass-edge\b/,
    );
  });
});

describe('glass-panel / glass-window stay on the glass hairline flow', () => {
  // The floating-glass utilities. Their structural hairline is the white
  // --glass-edge (specular); they must NOT fall back to the dark --border,
  // which would invert the colour semantics and silently make glass read like a
  // solid card. They also carry the full rim pair (ADR-0018 seam + bottom).
  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s uses --glass-edge as its structural hairline', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must border with var(--glass-edge)`).toMatch(
      /border:\s*1px\s+solid\s+var\(--glass-edge\)/,
    );
  });

  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s does NOT use --border as its structural hairline', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    // `--border` may appear inside a11y fallback selectors, but never as the
    // base `border:` declaration of the utility body itself.
    expect(body, `${_label} must not use the solid --border token as its hairline`).not.toMatch(
      /border:\s*1px\s+solid\s+var\(--border\)/,
    );
  });

  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s carries the glass top rim (--surface-rim-top)', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must inset the glass top rim`).toMatch(
      /inset\s+0\s+1px\s+0\s+0\s+var\(--surface-rim-top\)/,
    );
  });

  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s carries the glass-only bottom rim', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must inset the glass bottom rim`).toMatch(
      /inset\s+0\s+-1px\s+0\s+0\s+var\(--glass-shadow-edge\)/,
    );
  });
});
