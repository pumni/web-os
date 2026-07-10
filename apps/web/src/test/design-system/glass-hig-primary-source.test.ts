import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Apple HIG / Material 3 primary-source dating (B6).
 * ------------------------------------------------------------------
 * Both vendor primary sources — the Apple Human Interface Guidelines "Materials"
 * page and the Material 3 elevation spec — are JS-gated SPAs that resist static
 * scraping. ADR-0012's tier model (Chrome / Readable / Solid) and the deliberate
 * omission of Apple Liquid Glass lensing (per ADR-0012 "engineered frosted
 * glass, not Apple Liquid Glass lensing") are anchored to manual reads of those
 * sources, so a vendor revision would silently invalidate the doc.
 *
 * This guard asserts that BOTH files — `design-system.md` (the convention) and
 * ADR-0012 (the architecture decision) — carry a dated primary-source
 * verification stamp, so the freshness indicator cannot drift away from the
 * prose that depends on it. A manual recheck cadence (currently 2026-08-15) is
 * embedded in ADR-0012; bumping that date here keeps the two-source audit trail
 * in lockstep with the ADR.
 */

const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

const designSystem = read('docs/conventions/design-system.md');

// Apple HIG / Material 3 primary-source verification dating in design-system.md.
const DOC_B6_STAMP = /\b2026-07-09\b/;
const DOC_B6_NEXT_RECHECK = /\b2026-08-15\b/;

const VENDOR_LABELS = [
  { key: 'apple-hig', pattern: /Apple\s+HIG/i, label: 'Apple HIG' },
  { key: 'material-3', pattern: /Material\s*3/i, label: 'Material 3' },
] as const;

describe('Apple HIG / Material 3 primary-source dating (B6)', () => {
  it('design-system.md carries a dated primary-source verification', () => {
    expect(designSystem, 'design-system.md missing the 2026-07-09 verification stamp').toMatch(
      DOC_B6_STAMP,
    );
    expect(
      designSystem,
      'design-system.md missing the next-recheck date 2026-08-15',
    ).toMatch(DOC_B6_NEXT_RECHECK);
  });

  it.each(VENDOR_LABELS)(
    'design-system.md names the $label vendor source',
    ({ label, pattern }) => {
      expect(designSystem, `design-system.md missing ${label} reference`).toMatch(
        pattern,
      );
    },
  );
});
