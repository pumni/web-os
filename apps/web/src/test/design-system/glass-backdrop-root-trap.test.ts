import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Backdrop-root trap guard (glass performance discipline; MDN backdrop-filter §
 * "Backdrop root", https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter).
 *
 * `backdrop-filter` only paints content *behind* the nearest backdrop root —
 * an ancestor that establishes a boundary: an element with `opacity < 1`,
 * `mask*`, `clip-path`, `mix-blend-mode != normal`, `filter != none`, or
 * `will-change` on any of those.
 *
 * MDN calls this "a common source of confusion when `backdrop-filter` appears
 * to have no visible effect despite being correctly applied" — if a glass
 * surface sits under a fade-in wrapper that uses `opacity`, blur only sees
 * inside that wrapper, not the page behind it, and glassmorphism silently
 * breaks.
 *
 * Pumni's overlay architecture is asserted by this focused guard: every
 * glass-utility consumer — Dialog/Sheet/AlertDialog/CommandPalette/Popover/
 * DropdownMenu/ContextMenu — places the glass utility *directly* on the
 * portaled content element as a sibling of the scrim (`DialogPortal` holds
 * `<DialogOverlay />` and `<DialogPrimitive.Content>` side-by-side). The
 * enter/exit `opacity` is delivered via tw-animate-css data-attribute keyframes
 * (`data-[state=open]:fade-in-0`, etc.) on the glass element itself — which is
 * already a backdrop root by virtue of owning its own `backdrop-filter`, so
 * the fade never poaches a descendant's backdrop.
 *
 * This guard pins that architecture in place. It is NOT a &&
 *   (b) the glass-utility consumer components put the glass element as a
 *       sibling (never a descendant) of an opacity/mix-blend-mode animated
 *       ancestor.
 *
 * (1) is enforced via CSS string scan of glass.css + _overlay-variants.ts:
 *     no class containing `glass-` may set `mix-blend-mode`, and no `glass-*`
 *     utility's body may carry a top-level `opacity` declaration with value
 *     `< 1`.
 *
 * (2) is enforced by reading the overlay component TSX files and asserting the
 *     THREE supplies no ancestor opacity stack, the equivalent for an
 *     arbitrary consumer — that work belongs to the skill's UX review, not
 *     here.
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';
const OVERLAY_VARIANTS = 'packages/ui/src/components/overlay/_overlay-variants.ts';

const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');
const overlayVariants = readFileSync(path.join(repoRoot, OVERLAY_VARIANTS), 'utf8');

function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extract the body of an `@utility <name> { ... }` block from glass.css.
 * Brace-balanced to skip nested `&::before` / `@media` blocks.
 */
function readUtilityBody(css: string, name: string): string {
  const stripped = stripComments(css);
  const re = new RegExp(`@utility\\s+${name}\\s*\\{`, 'm');
  const startMatch = stripped.match(re);
  if (!startMatch?.index) return '';
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

const GLASS_UTILITIES = [
  'glass-panel',
  'glass-window',
  'glass-bar',
  'glass-bar-bordered',
  'glass-bar-edge-r',
  'glass-bar-edge-b',
  'glass-bar-scroll-b',
  'overlay-scrim',
] as const;

describe('glass surfaces do not self-poach their own backdrop (MDN backdrop-root trap)', () => {
  // The glass element owning its own backdrop-filter is already a backdrop
  // root. The danger is when a CSS rule *on the glass utility itself* sets
  // `opacity < 1` or `mix-blend-mode` in a way that compounds the trap for
  // descendants — particularly the `mix-blend-mode: overlay` declared on
  // the `glass-panel-simple::after` pseudo-element (which IS safe because
  // ::after carries no backdrop-filter, but is easy to misread and copy into
  // a real child).
  it.each(GLASS_UTILITIES)('%s utility body has no top-level opacity < 1', (name) => {
    const body = readUtilityBody(glassCss, name);
    expect(body, `@utility ${name} must be defined`).not.toBe('');

    // A bare `opacity: 0.5;` (or `opacity: 50%`) in the utility body makes
    // the element a backdrop root — any descendant backdrop-filter would
    // only see content within this element, not the page behind it.
    // We do allow `opacity` inside `::before`/`::after` selectors — those
    // are pseudo-elements (separate boxes), not ancestors.
    // To respect that: search only outside nested `&::`-style blocks.
    // Strip the nested blocks first.
    let outer = body;
    let prev: string;
    do {
      prev = outer;
      // Replace `&::before { ... }` and any `@media { ... }` leaves with a
      // marker so their opacity declarations don't count.
      outer = outer.replace(/(&?:+:[a-z-]+\s*\{)([^{}]*)\}/g, '$1...}');
      outer = outer.replace(/(@media[^{]*\{)([^{}]*)\}/g, '$1...}');
    } while (outer !== prev);

    const opacityHits = [...outer.matchAll(/\bopacity\s*:\s*([^;]+);/g)];
    for (const m of opacityHits) {
      const value = (m[1] ?? '').trim();
      // `1` and `100%` are fine (no backdrop-root). `< 1` is the trap.
      const numeric = value.endsWith('%') ? Number(value.slice(0, -1)) / 100 : Number(value);
      expect(
        Number.isNaN(numeric) || numeric >= 1,
        `@utility ${name} top-level opacity < 1 (backdrop-root trap): "${m[0]}"`,
      ).toBe(true);
    }
  });

  it('no glass utility sets `mix-blend-mode` in its top-level body', () => {
    // mix-blend-mode != normal forces the element to become a backdrop root
    // (MDN backdrop-filter backdrop-root list). Glass-panel-simple declares
    // mix-blend-mode: overlay on its `::after` pseudo (the grain overlay) —
    // that is safe because ::after has no backdrop-filter of its own. We
    // assert the rule stays on a `::after`/`::before` selector, never on the
    // utility element itself.
    for (const name of GLASS_UTILITIES) {
      const body = readUtilityBody(glassCss, name);
      // Strip nested pseudo-element blocks and check their bodies separately
      // below; we want the OUTER block (the utility itself) to not declare it.
      let outer = body;
      let prev: string;
      do {
        prev = outer;
        // Match `&::name { ... }` (incl. nested normal cases) and inline-replace.
        const nestedRe = /(&?:+:[a-z-]+\s*\{)([^{}]*)\}/g;
        outer = outer.replace(nestedRe, '$1...}');
        const mediaRe = /(@media[^{]*\{)([^{}]*)\}/g;
        outer = outer.replace(mediaRe, '$1...}');
      } while (outer !== prev);

      expect(
        outer,
        `@utility ${name} must not declare mix-blend-mode on the utility element`,
      ).not.toMatch(/\bmix-blend-mode\s*:/);
    }
  });

  it('glass pseudo-element mix-blend-mode is allowed only when the pseudo has no backdrop-filter', () => {
    // glass-panel-simple::after uses `mix-blend-mode: overlay` for the grain
    // layer. ::after is a separate box; it does not establish a backdrop root
    // for ::after's own backdrop-filter because ::after carries no
    // backdrop-filter. If a future edit adds to the same
    // pseudo-element that declares mix-blend-mode, the pseudo becomes the
    // trap. We pin that mix-blend-mode and never co-occur on
    // the same pseudo in glass.css.
    const stripped = stripComments(glassCss);

    // Find each`&::name { ... }` (nested inside glass utilities).
    const pseudoRe = /&(:+:[a-z-]+)\s*\{([^{}]*)\}/g;
    const pseudoMatches = [...stripped.matchAll(pseudoRe)];
    for (const m of pseudoMatches) {
      const pseudoBody = m[2] ?? '';
      const hasMixBlend = /\bmix-blend-mode\s*:/.test(pseudoBody);
      const hasBackdrop = /backdrop-filter\s*:/.test(pseudoBody);
      expect(
        !(hasMixBlend && hasBackdrop),
        `glass.css pseudo ${m[1]} has BOTH mix-blend-mode and backdrop-filter (backdrop-root self-trap)`,
      ).toBe(true);
    }
  });
});

describe('overlay motion keeps opacity on the glass element itself, not on an ancestor', () => {
  // tw-animate-css delivers `data-[state=open]:fade-in-0` etc. directly on
  // the element it is added to. OVERLAY_ANIMATION is composed into the SAME
  // className string as `glass-panel` on every overlay consumer, so the
  // fade `opacity` and the `backdrop-filter` are on the same element — the
  // glass element becomes the only backdrop root in play, which is fine.
  // The risk to guard against: a future "wrap the panel in an opacity-fade
  // container" refactor in the overlay variants module that would push the
  // fade onto an ancestor wrapper (silent backdrop-filter breakage).
  it('OVERLAY_ANIMATION is a flat utility-string (no wrapping element)', () => {
    // We assert that OVERLAY_ANIMATION is exported as a string literal (not a
    // JSX fragment, not a motion variant object), and that it does not
    // reference `opacity` via inline `style:` or wrapper class.
    expect(overlayVariants).toMatch(/export\s+const\s+OVERLAY_ANIMATION\s*=\s*['"`]/);
    // The vocabulary stays the tw-animate-css `fade-in-0`/`fade-out-0` family
    // — they animate the element they sit on, not a wrapping ancestor.
    expect(overlayVariants).toMatch(/fade-in-0/);
    expect(overlayVariants).toMatch(/fade-out-0/);
    // No inline `opacity:` token (would be a hand-rolled wrapper alternative).
    expect(overlayVariants).not.toMatch(/\bstyle\s*:\s*\{\s*opacity/);
  });
});
