import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildDtcgJson, OUTPUT_PATH } from '../../scripts/export-dtcg';

/**
 * Keeps the committed DTCG export (`packages/ui/tokens.dtcg.json`) in lockstep
 * with the CSS token files it is generated from (ADR-0021). The CSS stays the
 * single source of truth; this guard fails if a token value changes without the
 * JSON being regenerated, so the machine-readable artifact can never silently
 * drift from the styles.
 */
describe('DTCG token export', () => {
  it('committed tokens.dtcg.json matches a fresh generation from the CSS', () => {
    const committed = readFileSync(OUTPUT_PATH, 'utf8');
    expect(
      committed.replace(/\r\n/g, '\n'),
      'tokens.dtcg.json is stale — regenerate with `bun run --filter @pumni/ui export-dtcg`',
    ).toBe(buildDtcgJson().replace(/\r\n/g, '\n'));
  });
});
