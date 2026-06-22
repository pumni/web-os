import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Drift guard for the glassmorphism luminous edge pair (ADR-0014).
 *
 * ADR-0014 added a bottom shadow-edge (`--glass-shadow-edge`) to pair with the
 * top highlight (`--surface-rim-top`, unified across glass + solid by ADR-0018)
 * so a glass panel reads as a real
 * volumetric cut surface — light catches the top, shadow settles on the bottom.
 * The pair is delivered as two `inset` box-shadows layered behind the drop
 * shadow. Both rims are specular (ungated by APCA); the real delineator is the
 * drop shadow, but the rim pair is what makes the glass look *lit*.
 *
 * A future edit could silently drop the bottom rim (leaving only the top
 * highlight, which still "looks fine" but reads flat), or rename the token.
 * This guard pins the pair in place. Mirrors the pattern of
 * `glass-saturate.test.ts`.
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

describe('the glass rim pair is tokenized', () => {
  it('exposes --glass-shadow-edge in both :root and .dark', () => {
    const lightBody = readRuleBody(themeCss, ':root');
    const darkBody = readRuleBody(themeCss, '.dark');

    expect(lightBody, 'light mode must define --glass-shadow-edge').toMatch(
      /--glass-shadow-edge:\s*oklch\(/,
    );
    expect(darkBody, 'dark mode must define --glass-shadow-edge').toMatch(
      /--glass-shadow-edge:\s*oklch\(/,
    );
  });

  it('keeps the shadow-edge darker on light surfaces and stronger on dark', () => {
    // Pin the direction so a future edit can't invert it (which would flatten
    // the volumetric read in one theme). `[^)/]*` stops before the `/` so the
    // regex correctly captures the alpha after it.
    const lightMatch = readRuleBody(themeCss, ':root').match(
      /--glass-shadow-edge:\s*oklch\([^)/]*\/\s*([\d.]+)\)/,
    );
    const darkMatch = readRuleBody(themeCss, '.dark').match(
      /--glass-shadow-edge:\s*oklch\([^)/]*\/\s*([\d.]+)\)/,
    );

    const lightAlpha = lightMatch ? Number(lightMatch[1]) : NaN;
    const darkAlpha = darkMatch ? Number(darkMatch[1]) : NaN;

    expect(lightAlpha, 'light shadow-edge alpha must be defined').not.toBeNaN();
    expect(darkAlpha, 'dark shadow-edge alpha must be defined').not.toBeNaN();
    expect(darkAlpha, 'dark rim must be stronger than light').toBeGreaterThan(lightAlpha);
  });
});

describe('glass-panel / glass-window carry the full rim pair', () => {
  // Both floating-panel classes must carry BOTH insets — a top highlight AND a
  // bottom shadow-edge — so the cut-glass read is consistent across Card glass,
  // Dialog/Sheet/Popover overlays, and OS windows.
  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s has the top highlight inset', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must inset the top highlight`).toMatch(
      /inset\s+0\s+1px\s+0\s+0\s+var\(--surface-rim-top\)/,
    );
  });

  it.each([
    ['glass-panel', '@utility glass-panel'],
    ['glass-window', '@utility glass-window'],
  ])('%s has the bottom shadow-edge inset', (_label, selector) => {
    const body = readRuleBody(glassCss, selector);

    expect(body, `${_label} must inset the bottom shadow-edge`).toMatch(
      /inset\s+0\s+-1px\s+0\s+0\s+var\(--glass-shadow-edge\)/,
    );
  });
});
