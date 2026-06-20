import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Drift guard for the glassmorphism inner sheen (ADR-0014).
 *
 * The inner diagonal sheen is the layer that lets the reusable glass read as
 * modern glassmorphism — a faint white light catching the upper-left of the
 * panel. ADR-0014 ships it as a `--glass-sheen` token layered over the gated
 * `--glass-tint` via `background-image: linear-gradient(135deg, ...)`. The APCA
 * gate composites only `--glass-tint`, so the sheen never weakens readability —
 * but that also means the sheen is invisible to the contrast test, so it needs
 * its own drift guard: a future edit could silently drop the sheen, rename the
 * token, or spread it onto shell chrome that should stay flat.
 *
 * This test mirrors the regex-over-file pattern of `glass-saturate.test.ts`.
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';
const THEME_CSS = 'packages/ui/src/styles/theme.css';

const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');
const themeCss = readFileSync(path.join(repoRoot, THEME_CSS), 'utf8');

/** Removes CSS comments so they can't satisfy or trip the assertions. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Extracts the body of the first rule whose selector matches `selector`.
 * `selector` is treated as a LITERAL (e.g. `:root`, `.dark`, `.glass-panel`,
 * `@utility glass-panel`) — escaping is applied once, here, so callers pass the
 * raw form. The body is brace-balanced so rules containing nested braces
 * (`@media`, `&:hover { }`) match correctly; `[^}]*` would stop at the first
 * inner `}`.
 */
function readRuleBody(css: string, selector: string): string {
  const stripped = stripComments(css);
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the selector, then a brace-balanced body.
  const startMatch = stripped.match(
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{`, 'm'),
  );
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

describe('glassmorphism inner sheen is tokenized', () => {
  it('exposes --glass-sheen in both :root and .dark in theme.css', () => {
    const lightBody = readRuleBody(themeCss, ':root');
    const darkBody = readRuleBody(themeCss, '.dark');

    expect(
      lightBody,
      'light mode must define --glass-sheen',
    ).toMatch(/--glass-sheen:\s*oklch\(/);
    expect(
      darkBody,
      'dark mode must define --glass-sheen',
    ).toMatch(/--glass-sheen:\s*oklch\(/);
  });

  it('keeps the sheen faint (alpha ≤ 0.12) so it never competes with content', () => {
    // The sheen is a decorative highlight, not a fill. If a future edit raises
    // its alpha, it will start to lift the tint's perceived lightness and could
    // silently weaken the APCA margin recorded in glass-contrast.test.ts.
    for (const match of themeCss.matchAll(/--glass-sheen:\s*oklch\([^)]*\/\s*([\d.]+)\)/g)) {
      const alpha = Number(match[1]);
      expect(alpha, `sheen alpha ${alpha} must stay ≤ 0.12`).toBeLessThanOrEqual(0.12);
    }
  });
});

describe('glass-panel / glass-window carry the sheen', () => {
  // Tailwind v4 serialises `@utility glass-panel { ... }` to a `.glass-panel`
  // rule in the compiled output, but the raw source keeps the `@utility` form.
  // Match on the `@utility` selector so the guard works against source.
  const panelBody = readRuleBody(glassCss, '@utility glass-panel');
  const windowBody = readRuleBody(glassCss, '@utility glass-window');

  it('layers the sheen as a 135deg diagonal background-image', () => {
    const sheenGradient = /background-image:\s*linear-gradient\(\s*135deg,\s*var\(--glass-sheen\),\s*transparent\s+42%\s*\)/;

    expect(
      panelBody,
      'glass-panel must layer the sheen via background-image',
    ).toMatch(sheenGradient);
    expect(
      windowBody,
      'glass-window must layer the sheen via background-image',
    ).toMatch(sheenGradient);
  });
});

describe('shell chrome stays flat — no sheen on bars / titlebar', () => {
  // Shell chrome (topbar, dock rail, sidebar, window titlebar) must read as a
  // single flush surface that meets the viewport edge. The diagonal sheen
  // belongs only to the floating "cut glass" panels/windows — putting it on a
  // bar would read as a stray highlight seam along the chrome.
  it.each([
    ['.glass-bar', '\\.glass-bar\\b'],
    ['.glass-bar-bordered', '\\.glass-bar-bordered'],
    ['.glass-bar-edge-r', '\\.glass-bar-edge-r'],
    ['.glass-bar-edge-b', '\\.glass-bar-edge-b'],
    ['.glass-titlebar', '\\.glass-titlebar'],
  ])('%s does not carry the sheen', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);
    expect(
      body,
      `${_label} must not set --glass-sheen`,
    ).not.toMatch(/--glass-sheen/);
  });
});

describe('a11y fallbacks neutralise the sheen', () => {
  // The opaque fallbacks use the `background:` shorthand, which resets
  // `background-image: none` for free — so those blocks are safe by construction.
  // The two `prefers-contrast: more` paths only override `--glass-tint` and
  // `border-color`, so they MUST also explicitly drop `background-image: none`,
  // otherwise the sheen would survive as visual noise over the raised tint.
  it('drops background-image under prefers-contrast: more', () => {
    // The contrast block targets all 7 glass classes; read its full span by
    // matching the whole @media block body instead of a single selector.
    const stripped = stripComments(glassCss);
    const mediaMatch = stripped.match(
      /@media\s*\(prefers-contrast:\s*more\)\s*\{(?<body>[\s\S]*?)\}\s*(?=@media|\.glass-a11y|@utility|@keyframes|$)/,
    );
    const mediaBody = mediaMatch?.groups?.body ?? '';

    expect(
      mediaBody,
      'prefers-contrast: more must reset background-image: none',
    ).toMatch(/background-image:\s*none/);
  });

  it('drops background-image in the contrast a11y-preview path', () => {
    const stripped = stripComments(glassCss);
    const previewMatch = stripped.match(
      /\.glass-a11y-preview\[data-contrast='more'\][\s\S]*?\{(?<body>[\s\S]*?)\}\s*(?=\.glass-a11y|@media|@utility|$)/,
    );
    const previewBody = previewMatch?.groups?.body ?? '';

    expect(
      previewBody,
      'contrast a11y-preview must reset background-image: none',
    ).toMatch(/background-image:\s*none/);
  });
});
