/**
 * Static drift guards for glass performance + grain policy.
 * Read CSS source — no runtime browser required.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const glassCss = readFileSync(resolve(import.meta.dirname, '../styles/glass.css'), 'utf8');
const tokensCss = readFileSync(resolve(import.meta.dirname, '../styles/tokens.css'), 'utf8');

/** Strip block comments so prose mentioning `backdrop-filter` does not trip guards. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('glass performance contract', () => {
  it('does not animate or transition backdrop-filter on glass utilities', () => {
    const code = stripComments(glassCss);

    // Reject `transition: … backdrop-filter` property lists.
    expect(code).not.toMatch(/transition[^;{]*backdrop-filter/i);

    // Only scan @keyframes bodies (not the whole file — comments/utilities mention BF).
    const keyframesBodies = [...code.matchAll(/@keyframes\s+[\w-]+\s*\{([\s\S]*?)\n\}/g)].map(
      (m) => m[1],
    );
    for (const body of keyframesBodies) {
      expect(body, '@keyframes must not set backdrop-filter').not.toMatch(/backdrop-filter/i);
    }
  });

  it('scopes will-change to open/closed overlay state only', () => {
    const code = stripComments(glassCss);
    expect(code).not.toMatch(/will-change:\s*[^;]*backdrop-filter/i);
    expect(glassCss).toMatch(/\.glass-panel\[data-state='open'\]/);
  });

  it('pins frosted blur ladder production cap at 24px', () => {
    expect(tokensCss).toMatch(/--blur-glass-sm:\s*12px/);
    expect(tokensCss).toMatch(/--blur-glass:\s*16px/);
    expect(tokensCss).toMatch(/--blur-glass-md:\s*20px/);
    expect(tokensCss).toMatch(/--blur-glass-lg:\s*24px/);
  });

  it('ensures glass-scroll-edge-b has no backdrop-filter or will-change', () => {
    const code = stripComments(glassCss);
    const match = code.match(/@utility\s+glass-scroll-edge-b\s*\{([\s\S]*?)\n\}/);
    expect(match, 'glass-scroll-edge-b utility exists').not.toBeNull();
    const body = match![1];
    expect(body).not.toMatch(/backdrop-filter/i);
    expect(body).not.toMatch(/will-change/i);
  });
});

/** Extract the brace-balanced body of the first block opened by `opener`. */
function extractBalanced(css: string, opener: RegExp): string | null {
  const m = opener.exec(css);
  if (!m) return null;
  const start = css.indexOf('{', m.index);
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(start + 1, i);
  }
  return null;
}

describe('glass grain policy', () => {
  it('ships fractalNoise grain as a static ::after on glass-panel and glass-window only', () => {
    const code = stripComments(glassCss);

    for (const util of ['glass-panel', 'glass-window']) {
      const body = extractBalanced(code, new RegExp(`@utility\\s+${util}\\s*\\{`));
      expect(body, `${util} utility exists`).not.toBeNull();

      // The grain lives on the utility's own &::after (not the scroll-edge ::after).
      const after = extractBalanced(body!, /&::after\s*\{/);
      expect(after, `${util} has a grain ::after`).not.toBeNull();
      expect(after!, `${util} ::after paints fractalNoise grain`).toMatch(
        /feTurbulence|fractalNoise/,
      );

      // A static frost layer only — never a compositor-expensive property.
      expect(after!, `${util} grain ::after must not set backdrop-filter`).not.toMatch(
        /backdrop-filter/i,
      );
      expect(after!, `${util} grain ::after must not set will-change`).not.toMatch(/will-change/i);
      expect(after!, `${util} grain ::after must not set animation`).not.toMatch(/animation/i);
    }

    // Grain is tokenized so intensity and the fallback kill-switch stay centralized.
    expect(code, 'grain opacity is tokenized').toMatch(/opacity:\s*var\(--glass-grain-opacity\)/);
    expect(code, 'grain display is gated for fallbacks').toMatch(
      /display:\s*var\(--glass-grain-display/,
    );
  });
});

describe('glass stack budget static audit', () => {
  const overlayFiles = ['dialog.tsx', 'sheet.tsx', 'alert-dialog.tsx', 'command-palette.tsx'];

  it.each(overlayFiles)(
    'ensures %s overlay uses at most one scrim and one glass panel',
    (filename) => {
      const filePath = resolve(import.meta.dirname, '../components/overlay', filename);
      const content = readFileSync(filePath, 'utf8');

      // Count occurrences of overlay-scrim
      const scrimHits = (content.match(/overlay-scrim/g) || []).length;
      expect(scrimHits, `${filename} must have exactly 1 overlay-scrim`).toBe(1);

      // Count occurrences of glass utilities/panels
      const glassHits = (content.match(/glass-panel|glass-window/g) || []).length;
      expect(glassHits, `${filename} must have exactly 1 glass-panel/window`).toBe(1);

      // Ensure no third backdrop filter is nested within the component
      // (e.g. no nested glass-bar, glass-titlebar, glass-panel, glass-window)
      expect(content, `${filename} must not contain nested glass utilities`).not.toMatch(
        /glass-(?:bar|titlebar|panel-simple)/,
      );
    },
  );
});
