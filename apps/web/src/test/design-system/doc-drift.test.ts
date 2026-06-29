import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { repoRoot } from './token-test-utils';

/**
 * Guards the design-system *docs* against drifting from the *code* they describe.
 *
 * Two real drifts motivated this guard:
 *  - the accent list in `ui-styling` lagged `personalization.css` (3 vs 5 accents);
 *  - the skill/reference cited ADR numbers (0014–0020) that were consolidated
 *    into ADR-0012 and no longer exist as files.
 *
 * `bun run ai:check`'s `checkDocPathReferences` only validates backtick ADR
 * *paths*; inline `ADR-00NN` prose is invisible to it. This test closes that gap.
 */

const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

const DESIGN_DOCS = [
  'docs/conventions/design-system.md',
  '.agents/skills/ui-styling/SKILL.md',
  '.agents/skills/ui-styling/REFERENCE.md',
] as const;

describe('design-system doc drift', () => {
  it('every accent shipped in personalization.css is documented in the ui-styling skill', () => {
    const personalizationCss = read('packages/ui/src/styles/personalization.css');
    const accents = new Set(
      [...personalizationCss.matchAll(/\[data-accent=['"]([a-z]+)['"]\]/g)].map((m) => m[1]),
    );

    // Sanity: the file really does enumerate the 5-accent palette.
    expect(accents).toEqual(new Set(['coral', 'cyan', 'indigo', 'violet', 'rose']));

    for (const doc of [
      '.agents/skills/ui-styling/SKILL.md',
      '.agents/skills/ui-styling/REFERENCE.md',
    ]) {
      const text = read(doc);
      for (const accent of accents) {
        expect(text, `${doc} is missing accent "${accent}"`).toContain(accent);
      }
    }
  });

  it('every ADR-00NN cited in the design-system docs resolves to a real ADR file', () => {
    const adrNumbers = new Set(
      readdirSync(path.join(repoRoot, 'docs/adr'))
        .map((f) => /^(\d{4})-/.exec(f)?.[1])
        .filter((n): n is string => Boolean(n)),
    );

    for (const doc of DESIGN_DOCS) {
      const cited = [...read(doc).matchAll(/ADR-(\d{4})/g)].map((m) => m[1]);
      for (const num of cited) {
        expect(adrNumbers, `${doc} cites ADR-${num}, which has no file in docs/adr/`).toContain(
          num,
        );
      }
    }
  });
});
