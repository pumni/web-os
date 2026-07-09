import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readToken, readUnitless, readZIndex, repoRoot } from './token-test-utils';

/**
 * Guards the design-system *docs* against drifting from the *token values* they
 * quote in prose/tables.
 *
 * `doc-drift.test.ts` already guards the accent LIST and ADR NUMBERS. This is the
 * sibling guard for the load-bearing NUMERIC constants the docs reproduce by hand
 * (z-index ladder, state-layer overlays, glass vibrancy, blur range, radius base).
 * Those numbers live for real in `packages/ui/src/styles/tokens.css`; the docs
 * merely transcribe them, so a token edit can silently leave the docs stale and
 * no existing gate would notice.
 *
 * Scope discipline: this asserts ONLY an explicit, curated set of constants that
 * the docs quote verbatim — never a free scan of every number in the prose (which
 * is full of non-token figures). Each entry binds one CSS token to the doc text
 * that must echo it. Add an entry when a doc starts quoting a new token value.
 */

const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

const designSystem = read('docs/conventions/design-system.md');
const reference = read('.agents/skills/ui-styling/REFERENCE.md');

/** A backtick-wrapped literal cell, e.g. `100` or `8%` — escaped for regex. */
const tick = (value: string | number) =>
  new RegExp('`' + String(value).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '`');

describe('doc ↔ tokens.css numeric drift', () => {
  // --- z-index ladder: REFERENCE.md tabulates every owned layer value. The
  //     ladder is load-bearing (a stale value reintroduces the topbar-vs-window
  //     leap-frog bug documented in tokens.css). ----------------------------
  const zTokens = [
    '--z-desktop',
    '--z-base',
    '--z-window',
    '--z-window-active',
    '--z-sidebar',
    '--z-dock',
    '--z-topbar',
    '--z-overlay',
    '--z-modal',
    '--z-popover',
    '--z-command',
    '--z-tooltip',
    '--z-toast',
  ] as const;

  for (const name of zTokens) {
    it(`REFERENCE.md z-index table matches ${name}`, () => {
      const value = readZIndex(name);
      expect(
        reference,
        `ui-styling/REFERENCE.md z-index table is stale for ${name} (tokens.css = ${value})`,
      ).toMatch(tick(value));
    });
  }

  // --- State-layer overlay strengths (Material-3 pattern). REFERENCE.md quotes
  //     each percentage in a backtick cell. ---------------------------------
  const stateTokens = ['--state-hover', '--state-pressed', '--state-selected'] as const;

  for (const name of stateTokens) {
    it(`REFERENCE.md state-layer table matches ${name}`, () => {
      const value = readToken(name); // e.g. '8%'
      expect(
        reference,
        `ui-styling/REFERENCE.md state-layer table is stale for ${name} (tokens.css = ${value})`,
      ).toMatch(tick(value));
    });
  }

  // --- Glass vibrancy knob: both the convention doc and the skill reference
  //     quote it as "≈1.3×" (the % value ÷ 100, expressed as a multiplier).
  //     The token itself is a percentage (`--glass-saturate: 130%`); the doc
  //     quotes a more human-friendly `≈1.3×` next to the literal `130%`.
  //     (`glass-saturate.test.ts` guards the tokenization; this guards the
  //     documented multiplier number.) -------------------------------------
  it('glass vibrancy "≈N×" in docs matches --glass-saturate', () => {
    const raw = readUnitless('--glass-saturate'); // e.g. 130 (parsed from "130%")
    expect(raw, 'sanity: --glass-saturate is a percentage ≥100').toBeGreaterThanOrEqual(100);
    const multiplier = (raw / 100).toFixed(1); // "1.3"
    const approx = new RegExp('≈\\s*' + multiplier.replace('.', '\\.'));
    expect(designSystem, 'design-system.md --glass-saturate note is stale').toMatch(approx);
    expect(reference, 'ui-styling/REFERENCE.md --glass-saturate note is stale').toMatch(approx);
  });

  // --- Frosted blur range: design-system.md states "--blur-glass 12–24px".
  //     Both endpoints are owned tokens; the strong cap (24px) literal also
  //     needs to appear in the doc. --------------------------------------
  it('blur range "S–Lpx" in design-system.md matches the blur tokens', () => {
    const small = Number.parseInt(readToken('--blur-glass-sm'), 10); // 12
    const large = Number.parseInt(readToken('--blur-glass-lg'), 10); // 24
    expect(designSystem, 'design-system.md blur range is stale').toMatch(
      new RegExp(`${small}[–-]${large}px`),
    );
    expect(designSystem, 'design-system.md strong-cap blur note is stale').toMatch(
      new RegExp(`${large}px`),
    );
  });

  // --- Radius base: REFERENCE.md's radius table is computed "at base Npx".
  //     --radius-base is authored in rem; the doc quotes the px equivalent. ---
  it('REFERENCE.md radius base px matches --radius-base', () => {
    const rem = Number.parseFloat(readToken('--radius-base')); // 0.625
    const px = Math.round(rem * 16); // 10
    expect(reference, 'ui-styling/REFERENCE.md radius base is stale').toMatch(
      new RegExp(`base ${px}px`),
    );
  });

  // --- REFERENCE.md documents the single `--chart` token (not the legacy
  //     chart-1...chart-5 expansion). -----------------------------------
  it('REFERENCE.md contains the chart token row', () => {
    expect(reference, 'ui-styling/REFERENCE.md missing chart token row').toMatch(
      tick('chart'),
    );
  });
});
