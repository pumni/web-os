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
});

describe('glass grain policy', () => {
  it('limits fractalNoise grain to glass-panel-simple only', () => {
    const noiseHits = [...glassCss.matchAll(/feTurbulence|fractalNoise/g)];
    expect(noiseHits.length).toBeGreaterThan(0);

    // The noise data-URI must appear only inside the glass-panel-simple utility.
    const simpleIdx = glassCss.indexOf('@utility glass-panel-simple');
    expect(simpleIdx).toBeGreaterThanOrEqual(0);
    const afterSimple = glassCss.slice(simpleIdx);
    const nextUtility = afterSimple.search(/\n@utility |\n\.glass-window/);
    const simpleBlock = nextUtility === -1 ? afterSimple : afterSimple.slice(0, nextUtility);
    expect(simpleBlock).toMatch(/fractalNoise/);

    const beforeSimple = glassCss.slice(0, simpleIdx);
    const afterBlock = nextUtility === -1 ? '' : afterSimple.slice(nextUtility);
    expect(beforeSimple).not.toMatch(/fractalNoise/);
    expect(afterBlock).not.toMatch(/fractalNoise/);
  });
});

describe('glass stack budget static audit', () => {
  const overlayFiles = ['dialog.tsx', 'sheet.tsx', 'alert-dialog.tsx', 'command-palette.tsx'];

  it.each(overlayFiles)('ensures %s overlay uses at most one scrim and one glass panel', (filename) => {
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
    expect(content, `${filename} must not contain nested glass utilities`).not.toMatch(/glass-(?:bar|titlebar|panel-simple)/);
  });
});

