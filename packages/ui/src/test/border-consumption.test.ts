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
 * Mirrors the read-the-CSS + literal-regex pattern used by glass contrast/performance guards.
 *
 * What this guard pins:
 *
 * 1. The closed three-token hairline set (`--border`, `--input`, `--glass-edge`)
 *    is defined exactly once per theme (no duplicate that could drift).
 * 2. `surface-raised` (the solid-card elevation utility) is structural-only —
 *    elevation shadow, NO specular rim. It does NOT read `--surface-rim-top`
 *    (solid dropped the rim by ADR-0020), `--glass-shadow-edge`, or
 *    `--glass-edge` (all glass-only). `--surface-rim-top` is still defined for
 *    the glass utilities that consume it (`glass-bar`, `glass-titlebar`).
 * 3. `glass-panel` / `glass-window` use asymmetric borders (`--glass-edge-top/bottom`)
 *    as their structural hairline (never `--border`) and carry the full rim pair
 *    (`--glass-inset-bezel-top` + `--glass-shadow-edge`).
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';
const THEME_CSS = 'packages/ui/src/styles/theme.css';
const EFFECTS_CSS = 'packages/ui/src/styles/effects.css';

const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');
const themeCss = readFileSync(path.join(repoRoot, THEME_CSS), 'utf8');
const effectsCss = readFileSync(path.join(repoRoot, EFFECTS_CSS), 'utf8');

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

describe('the structural hairline set is closed and defined once', () => {
  // ADR-0019: exactly three hairline tokens (--border, --input, --glass-edge),
  // each defined exactly once, carrying both themes via light-dark().
  it('defines each hairline token exactly once in :root using light-dark()', () => {
    const rootBody = readRuleBody(themeCss, ':root');
    const darkBody = readRuleBody(themeCss, '.dark');

    for (const token of ['--border', '--input', '--glass-edge', '--surface-rim-top']) {
      expect(
        countTokenDefinitions(rootBody, token),
        `:root must define ${token} exactly once`,
      ).toBe(1);

      expect(
        countTokenDefinitions(darkBody, token),
        `.dark must NOT override ${token} (it uses light-dark())`,
      ).toBe(0);

      const valMatch = rootBody.match(new RegExp(`${token}:\\s*([^;]+);`));
      expect(valMatch?.[1], `${token} must carry both themes via light-dark()`).toContain(
        'light-dark(',
      );
    }
  });
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
  // The floating-glass utilities. Their visible edge is the masked 1px gradient
  // bevel ring (&::before) running --glass-edge-top (a light specular light-catch)
  // → --glass-edge-bottom (a faint contact shadow). The rim is a light effect,
  // not an APCA-gated contrast boundary. Per-side border colours are retired:
  // they paint hard diagonal colour seams on rounded corners. The element keeps
  // a TRANSPARENT metric border so box metrics are stable and a11y fallbacks can
  // re-colour it; it must NOT fall back to the dark --border, which would make
  // glass read like a solid card.
  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s paints its edge as the masked gradient bevel ring', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must keep the transparent metric border`).toMatch(
      /border:\s*1px\s+solid\s+var\(--glass-border-resolved,\s*transparent\)/,
    );
    expect(body, `${_label} ring must run conic-gradient symmetric model`).toMatch(
      /conic-gradient\(\s*from\s+0deg,\s*var\(--glass-edge-top\)\s+0deg,\s*var\(--glass-edge-side\)\s+80deg,\s*var\(--glass-edge-side\)\s+100deg,\s*var\(--glass-edge-bottom\)\s+180deg,\s*var\(--glass-edge-side\)\s+260deg,\s*var\(--glass-edge-side\)\s+280deg,\s*var\(--glass-edge-top\)\s+360deg\s*\)/,
    );
    expect(body, `${_label} ring must be masked to a 1px hairline`).toMatch(
      /mask-composite:\s*exclude/,
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
  ])('%s carries the glass top rim (--glass-inset-bezel-top)', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must inset the glass top bezel`).toMatch(
      /inset\s+0\s+1px\s+0\s+0\s+var\(--glass-inset-bezel-top\)/,
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

describe('CardSpotlight @property registration', () => {
  // The radial-gradient that consumes --spot-x / --spot-y lives on the
  // element's ::before pseudo-element — a separate box in the CSS box tree.
  // With `inherits: false` the ::before only ever sees the registration's
  // initial-value (50%/50%), so the spotlight is stuck at the card center
  // regardless of `pointermove`. `inherits: true` is therefore required for
  // the cursor-tracking effect to work at all. Verified by a Playwright repro
  // in apps/web/e2e/spotlight-inherits.spec.ts.

  function readPropertyBlock(name: string): string {
    const body = readRuleBody(effectsCss, `@property ${name}`);
    if (!body) throw new Error(`@property ${name} not found in effects.css`);
    return body;
  }

  it.each(['--spot-x', '--spot-y'])('%s has syntax <length-percentage>', (name) => {
    expect(readPropertyBlock(name)).toMatch(/syntax:\s*['"]<length-percentage>['"]/);
  });

  it.each(['--spot-x', '--spot-y'])('%s has initial-value 50%', (name) => {
    expect(readPropertyBlock(name)).toMatch(/initial-value:\s*50%/);
  });

  it.each(['--spot-x', '--spot-y'])(
    '%s inherits (required so ::before can read the live cursor coords)',
    (name) => {
      // Regression guard: an earlier version of this rule shipped `inherits:
      // false`, which caused the spotlight to sit frozen at the card center
      // even though the JS kept updating the vars. The fix is `inherits: true`.
      expect(
        readPropertyBlock(name),
        `${name} must inherit so the ::before consumer sees pointermove updates`,
      ).toMatch(/\binherits:\s*true\b/);
      expect(readPropertyBlock(name)).not.toMatch(/\binherits:\s*false\b/);
    },
  );
});
