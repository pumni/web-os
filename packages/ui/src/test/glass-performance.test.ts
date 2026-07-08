/**
 * Static drift guards for glass performance + grain policy (ADR-0012).
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
