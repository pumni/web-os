import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../../../..');

const tokensPath = path.join(repoRoot, 'packages/ui/src/styles/tokens.css');
const themePath = path.join(repoRoot, 'packages/ui/src/styles/theme.css');

const tokensCss = readFileSync(tokensPath, 'utf-8');
const themeCss = readFileSync(themePath, 'utf-8');

function extractToken(name: string, css: string): string {
  const re = new RegExp(`${name}:\\s*(.+?)\\s*;`);
  const m = css.match(re);
  if (!m) throw new Error(`Token ${name} not found`);
  return m[1]!;
}

describe('dark-mode typographic compensation tokens', () => {
  it('dark body weight is lighter than light body weight', () => {
    const darkWeight = Number(extractToken('--font-weight-body-dark', tokensCss));
    // Light default is 400, dark should be less
    expect(darkWeight).toBeLessThan(400);
    expect(darkWeight).toBeGreaterThanOrEqual(300); // Don't go too thin
  });

  it('dark heading weight is lighter than light heading weight', () => {
    const darkWeight = Number(extractToken('--font-weight-heading-dark', tokensCss));
    expect(darkWeight).toBeLessThan(600);
    expect(darkWeight).toBeGreaterThanOrEqual(500);
  });

  it('dark tracking is wider than normal', () => {
    const darkTracking = extractToken('--tracking-body-dark', tokensCss);
    const value = parseFloat(darkTracking);
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThanOrEqual(0.02); // Subtle, not dramatic
  });

  it('theme.css defines --font-weight-body in both :root and .dark', () => {
    expect(themeCss).toMatch(/:root\s*\{[^}]*--font-weight-body:/s);
    expect(themeCss).toMatch(/\.dark\s*\{[^}]*--font-weight-body:/s);
  });
});
