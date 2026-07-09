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
const adr0012 = read('docs/adr/0012-engineered-glass-surface-language.md');

// A dated B6 amendment in ADR-0012 — anchored to a YYYY-MM-DD stamp + the two
// vendor source labels. Editing the amendment date triggers this guard.
const ADR_B6_DATE = /B6\s+Apple\s+HIG\s*\/\s*Material\s+3\s+primary-source\s+dating/;
const ADR_B6_STAMP = /\b2026-07-09\b/;
const ADR_B6_NEXT_RECHECK = /\b2026-08-15\b/;

// design-system.md must reference the ADR-0012 §B6 amendment at the "Apple HIG
// tier map" sentence + carry the same two vendor labels.
const DOC_HIG_POINTER = /Apple\s+HIG.*?Material\s+3.*?verification\s+dates?(?:\s|&\#0*32;|&nbsp;)*pinned(?:\s|&\#0*32;|&nbsp;)*in(?:\s|&\#0*32;|&nbsp;)*ADR-0012/i;

const VENDOR_LABELS = [
  { key: 'apple-hig', pattern: /Apple\s+HIG/i, label: 'Apple HIG' },
  { key: 'material-3', pattern: /Material\s*3/i, label: 'Material 3' },
] as const;

describe('Apple HIG / Material 3 primary-source dating (B6)', () => {
  it('ADR-0012 carries a dated B6 verification amendment', () => {
    expect(adr0012, 'ADR-0012 missing B6 amendment heading').toMatch(ADR_B6_DATE);
    expect(adr0012, 'ADR-0012 B6 amendment missing the 2026-07-09 stamp').toMatch(
      ADR_B6_STAMP,
    );
    expect(
      adr0012,
      'ADR-0012 B6 amendment missing the next-recheck date',
    ).toMatch(ADR_B6_NEXT_RECHECK);
  });

  it('design-system.md pins its Apple HIG / Material 3 references to the ADR-0012 B6 amendment', () => {
    expect(
      designSystem,
      'design-system.md Apple HIG tier map sentence must point at ADR-0012 §B6 dating',
    ).toMatch(DOC_HIG_POINTER);
  });

  it.each(VENDOR_LABELS)(
    'both ADR-0012 and design-system.md name the $label vendor source',
    ({ label, pattern }) => {
      expect(adr0012, `ADR-0012 missing ${label} reference`).toMatch(pattern);
      expect(designSystem, `design-system.md missing ${label} reference`).toMatch(
        pattern,
      );
    },
  );
});
