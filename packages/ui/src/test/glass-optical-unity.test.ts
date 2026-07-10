import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cardVariants } from '../components/layout/card';
import { glassSurfaceVariants } from '../components/identity/glass-surface';

const glassCss = readFileSync(resolve(import.meta.dirname, '../styles/glass.css'), 'utf8');

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('glass optical unity target rules', () => {
  it('has no glass-panel-simple utility in production CSS', () => {
    const code = stripComments(glassCss);
    expect(code).not.toMatch(/@utility\s+glass-panel-simple/);
  });

  it('does not set full-face reflection overlay on glass-panel or glass-window ::after', () => {
    const code = stripComments(glassCss);
    // Find glass-panel ::after block
    const hasPanelAfterReflection = /\.glass-panel::after\s*\{[^}]*background:\s*var\(--glass-reflection\)/.test(code) ||
      /@utility\s+glass-panel\s*\{[\s\S]*?&::after\s*\{[^}]*background:\s*var\(--glass-reflection\)/.test(code);
    expect(hasPanelAfterReflection, 'glass-panel ::after should not set background reflection').toBe(false);

    // Find glass-window ::after block
    const hasWindowAfterReflection = /\.glass-window::after\s*\{[^}]*background:\s*var\(--glass-reflection\)/.test(code) ||
      /@utility\s+glass-window\s*\{[\s\S]*?&::after\s*\{[^}]*background:\s*var\(--glass-reflection\)/.test(code);
    expect(hasWindowAfterReflection, 'glass-window ::after should not set background reflection').toBe(false);
  });

  it('has no glass-titlebar utility in production CSS', () => {
    const code = stripComments(glassCss);
    expect(code).not.toMatch(/@utility\s+glass-titlebar/);
  });

  it('cardVariants has no glass or glassSimple keys', () => {
    const keys = Object.keys((cardVariants as any).variants?.variant || {});
    expect(keys).not.toContain('glass');
    expect(keys).not.toContain('glassSimple');
  });

  it('glassSurfaceVariants has no titlebar key', () => {
    const keys = Object.keys((glassSurfaceVariants as any).variants?.variant || {});
    expect(keys).not.toContain('titlebar');
  });
});
