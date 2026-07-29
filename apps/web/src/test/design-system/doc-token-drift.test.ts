import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readToken, readUnitless, repoRoot } from './token-test-utils';

/**
 * Guards the design-system *docs* against drifting from the *token values* they quote.
 */

const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

const designSystem = read('docs/conventions/design-system.md');

describe('doc ↔ tokens.css numeric drift', () => {
  it('glass vibrancy "≈N×" in docs matches --glass-saturate', () => {
    const raw = readUnitless('--glass-saturate');
    expect(raw, 'sanity: --glass-saturate is a percentage ≥100').toBeGreaterThanOrEqual(100);
    const multiplier = (raw / 100).toFixed(1);
    const approx = new RegExp('≈\\s*' + multiplier.replace('.', '\\.'));
    expect(designSystem, 'design-system.md --glass-saturate note is stale').toMatch(approx);
  });

  it('blur range "S–Lpx" in design-system.md matches the blur tokens', () => {
    const small = Number.parseInt(readToken('--blur-glass-sm'), 10);
    const large = Number.parseInt(readToken('--blur-glass-lg'), 10);
    expect(designSystem, 'design-system.md blur range is stale').toMatch(
      new RegExp(`${small}[–-]${large}px`),
    );
    expect(designSystem, 'design-system.md strong-cap blur note is stale').toMatch(
      new RegExp(`${large}px`),
    );
  });
});
