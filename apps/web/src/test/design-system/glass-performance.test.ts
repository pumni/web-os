import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Performance drift guards for the glassmorphism layer (ADR-0014 perf discipline).
 *
 * `backdrop-filter` forces a separate backdrop render pass (WebKit engine note,
 * W3C fxtf #53). Two rules keep that cost bounded:
 *
 * 1. Never animate `backdrop-filter`. Animating the blur radius or saturation
 *    re-runs the backdrop pass every frame — the single most expensive thing a
 *    glass layer can do. Overlays animate `opacity` + `transform` only
 *    (`_overlay-variants.ts`); this guard locks that in for `glass.css` so a
 *    future `transition: backdrop-filter ...` can't sneak in.
 * 2. Scope `will-change`. Held on static glass, `will-change: transform` makes
 *    the browser reserve an extra GPU buffer per panel indefinitely. Base glass
 *    composites correctly via the cheap `translateZ(0)` promotion; `will-change`
 *    is reserved for overlays actively animating (`[data-state=open|closed]`)
 *    and reset under `prefers-reduced-transparency`.
 *
 * Stacked-glass depth (≤2 layers) is a doc/skill rule, NOT a CSS or test guard:
 * each glass element forces a separate backdrop render pass, so a third nested
 * layer compounds the per-pixel blur cost and tanks FPS on mid-tier mobiles.
 * It is not asserted here because parsing JSX nesting depth with regex is too
 * brittle (siblings read as depth, and the design-system showcase legitimately
 * renders many glass surfaces side-by-side). The skill prose is the seam.
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';

const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Parse the stripped CSS into top-level rules (selector { body }) and
 * `@media` blocks (which are returned as single rules with the full
 * `@media ... { ... }` body intact). Handles brace-balanced nesting so that
 * nested rules (`&:hover`, `&[data-state='open']`) stay within their parent.
 */
function parseRules(css: string): { selector: string; body: string }[] {
  const stripped = stripComments(css);
  const rules: { selector: string; body: string }[] = [];
  let i = 0;

  while (i < stripped.length) {
    // Skip whitespace and standalone closing braces (end of nested blocks).
    while (i < stripped.length && /\s/.test(stripped[i]!)) i++;
    if (i >= stripped.length) break;

    // The selector is everything up to the next `{`.
    const openBrace = stripped.indexOf('{', i);
    if (openBrace === -1) break;

    const selector = stripped.slice(i, openBrace).trim();
    i = openBrace + 1;

    // Brace-balanced body.
    let depth = 1;
    const bodyStart = i;
    while (i < stripped.length && depth > 0) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}') depth--;
      i++;
    }

    if (selector && depth === 0) {
      rules.push({ selector, body: stripped.slice(bodyStart, i - 1) });
    }
  }

  return rules;
}

describe('glass surfaces never animate backdrop-filter', () => {
  // Any `transition` whose property list includes `backdrop-filter` (with or
  // without the `-webkit-` prefix) is the banned form — it re-runs the backdrop
  // pass every animation frame.
  it('has no transition that targets backdrop-filter', () => {
    const stripped = stripComments(glassCss);
    const transitions = [...stripped.matchAll(/transition\s*:\s*([^;]+);/g)].map(
      (m) => m[1] ?? '',
    );

    const offenders = transitions.filter((t) => /backdrop-filter/i.test(t));
    expect(
      offenders,
      `transitions animating backdrop-filter (banned): ${offenders.join(' | ')}`,
    ).toEqual([]);
  });

  // A `@keyframes` block that animates `backdrop-filter` is the other banned
  // form — it re-runs the backdrop pass on every frame of the keyframe loop.
  it('has no @keyframes block that animates backdrop-filter', () => {
    const stripped = stripComments(glassCss);
    const keyframeBlocks = [...stripped.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\n\}/g)].map(
      (m) => m[1] ?? '',
    );

    const offenders = keyframeBlocks.filter((body) => /backdrop-filter\s*:/i.test(body));
    expect(
      offenders,
      `@keyframes animating backdrop-filter (banned): ${offenders.join(' | ')}`,
    ).toEqual([]);
  });
});

describe('will-change is scoped to animating overlays, not static glass', () => {
  const rules = parseRules(glassCss);

  it('base glass-panel / glass-window do NOT hold will-change', () => {
    // The static `@utility` blocks must rely on `translateZ(0)` for layer
    // promotion, not on a permanent `will-change` reservation.
    const panelRule = rules.find((r) => r.selector === '@utility glass-panel');
    const windowRule = rules.find((r) => r.selector === '@utility glass-window');

    expect(panelRule, '@utility glass-panel base rule must exist').toBeTruthy();
    expect(windowRule, '@utility glass-window base rule must exist').toBeTruthy();
    expect(
      panelRule?.body,
      'glass-panel must not set will-change in its base block',
    ).not.toMatch(/will-change\s*:/);
    expect(
      windowRule?.body,
      'glass-window must not set will-change in its base block',
    ).not.toMatch(/will-change\s*:/);
  });

  it('every will-change declaration lives in an animating-overlay or fallback rule', () => {
    // Allowed homes for `will-change`:
    //  - selectors keyed on Radix `[data-state=` (overlay open/close window)
    //  - the `prefers-reduced-transparency` reset (`will-change: auto`)
    // Anything else is a leak (a static glass surface reserving a GPU buffer).
    const allowed = (selector: string, body: string) =>
      /\[data-state/i.test(selector) ||
      (/@media\s*\(prefers-reduced-transparency/i.test(selector) &&
        /will-change:\s*auto/.test(body));

    const offenders = rules
      .filter((r) => /will-change\s*:/.test(r.body))
      .filter((r) => !allowed(r.selector, r.body))
      .map((r) => r.selector);

    expect(
      offenders,
      `will-change found outside overlay/fallback rules: ${offenders.join(' | ')}`,
    ).toEqual([]);
  });
});
