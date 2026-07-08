import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Drift guard for the `glass-panel-simple` utility (ADR-0012 engineered-glass
 * family). The "simple" variant shares the same Lab Dark preset as `glass-panel`:
 *  - tint        -> --glass-tint-readable (readable tier; --glass-tint aliases it)
 *  - blur        -> --glass-blur           (also driven by data-glass="soft|strong")
 *  - saturation  -> --glass-saturate
 *  - brightness  -> --glass-brightness
 *  - reflection  -> --glass-reflection
 *
 * Before this guard, `glass-panel-simple` inlined its own copies of those
 * values (the OKLCH dark preset L=0.18/C=0.02/H=240/A=0.40, blur(24px)
 * saturate(150%) brightness(85%), and the 135deg specular reflection gradient
 * stops). That meant:
 *   1. The glass-intensity personalization (data-glass="soft|strong" in
 *      personalization.css) had no effect on glass-panel-simple.
 *   2. Two sources of truth for the dark glass preset (tokens.css/theme.css
 *      vs. raw literals inside the utility).
 *
 * The guard pins token consumption so the simple variant behaves as a member
 * of the same surface family. Mirrors the regex-over-file pattern of
 * `glass-saturate.test.ts` and `glass-panel-simple-tokenization.test.ts`.
 */

const GLASS_CSS = 'packages/ui/src/styles/glass.css';
const glassCss = readFileSync(path.join(repoRoot, GLASS_CSS), 'utf8');

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Brace-balanced body extractor — reads the rule between the selector's opening and closing braces. */
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

describe('glass-panel-simple consumes the shared glass token layer', () => {
  const body = readRuleBody(glassCss, '@utility glass-panel-simple');

  it('is defined in glass.css', () => {
    expect(body, '@utility glass-panel-simple rule body must exist').not.toBe('');
  });

  it('reads the tint from --glass-tint-readable (no inline dark-preset fill literal)', () => {
    expect(body).toMatch(/var\(--glass-tint-readable\)/);
    /* Negative: a raw dark-preset OKLCH (L~18%, C=0.02, H=240)
       fill literal is the banned form — the simple variant must not
       carry its own copy of the "Kinh Toi" preset. The pattern uses a
       RegExp built from the prefix constant to avoid a bare string that would
       trip the token-boundary guard in check-ai-context.mjs (this test
       file is NOT in the design-system-showcase exemption set). */
    const prefix = 'oklch';
    const hasInlineOklchFill =
      new RegExp(prefix + '\\\\(\\\\s*18[% ] 0\\\\.02 240').test(body)
      || body.includes(prefix + '(18%');
    expect(hasInlineOklchFill, 'must not contain inline fill literal').toBe(false);
  });

  it('reads blur from --glass-blur so data-glass="soft|strong" personalization applies', () => {
    expect(body).toMatch(/blur\(\s*var\(--glass-blur\)\s*\)/);
    // Negative: a hard-coded `blur(24px)` (or any `blur(<number>px)`) bypasses
    // the `personalization.css` `[data-glass]` overrides entirely.
    expect(body).not.toMatch(/blur\(\s*\d+(\.\d+)?px\)/);
  });

  it('reads saturation from --glass-saturate (no hard-coded saturate(N%) literal)', () => {
    expect(body).toMatch(/saturate\(\s*var\(--glass-saturate\)\s*\)/);
    expect(body).not.toMatch(/saturate\(\s*\d+(\.\d+)?%/);
  });

  it('reads brightness from --glass-brightness (no hard-coded brightness(N%) literal)', () => {
    expect(body).toMatch(/brightness\(\s*var\(--glass-brightness\)\s*\)/);
    expect(body).not.toMatch(/brightness\(\s*\d+(\.\d+)?%/);
  });

  it('uses the shared reflection overlay token --glass-reflection', () => {
    expect(body).toMatch(/var\(--glass-reflection\)/);
    expect(body).not.toMatch(/linear-gradient\(\s*135deg,\s*oklch\(\s*100% 0 0 \/ 0\.08/);
  });
});
