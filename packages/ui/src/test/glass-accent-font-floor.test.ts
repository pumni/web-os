import { describe, expect, it } from 'vitest';
import { fontLookupAPCA } from 'apca-w3';

/**
 * Accent-fill font-size ↔ APCA Lc floor pairing (B5).
 * ------------------------------------------------------------------
 * APCA Lc 45 (the gate `glass-contrast.test.ts` pins for accent-foreground
 * on the accent surface) is the Bronze Simple Mode floor for *large/heavy*
 * text — 24px/700 or 36px/400 — NOT for normal-size body or chrome labels.
 * Pumni's accent fills (`--accent`, `Badge tone`, `IconBadge`, chart series)
 * are short label surfaces, not body. To keep an accent chip text in the
 * Bold/Lc-45 envelope (so a thin 14px/500 label does not push chroma into
 * the unreadable mid-L dead zone), the design-system requires the chip text
 * to use ≥ `text-sm font-semibold` (14px/600) on those surfaces. Tuning the
 * Lc floor above 45 in the future must drop the size floor commensurately.
 *
 * The `fontLookupAPCA(Lc)` helper returns APCA's own per-weight px-size
 * minimums for a given Lc (10-element array; index 0 is the Lc value, then
 * weights 100..900). It is the canonical Bronze-to-Silver font-LUT from
 * Myndex's `apca-w3` package. We use it here to surface, per accent Lc floor,
 * the LUT's stated minimum px at weight 700 so future Lc tuning does not
 * silently let an accent chip dip below APCA's stated font-size floor for
 * the bold weight.
 */

// All 9 APCA weight columns returned by fontLookupAPCA (index 0 is the Lc echo).
const WEIGHT_INDEXES = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
// Body-text weight envelope asserted for monotonicity. The APCA LUT inverts at
// display weights (800, 900) for high Lc — intentional, out of scope here.
const BODY_WEIGHTS = [100, 200, 300, 400, 500, 600, 700] as const;

const ACCENT_FLOORS = [45, 60, 75, 90] as const;

describe('APCA accent-fill font-size floor (B5 pairing)', () => {
  it.each(ACCENT_FLOORS)(
    'fontLookupAPCA(%i) reports per-weight px minimums, monotone over body weights 100..700',
    (lc) => {
      const arr = fontLookupAPCA(lc) as Array<number>;
      expect(Array.isArray(arr), `fontLookupAPCA(${lc}) returned an array`).toBe(true);
      expect(arr.length, `fontLookupAPCA(${lc}) returned 10 elements`).toBe(10);
      // Index 0 is the Lc echo as a fixed-place STRING (toFixed(places));
      // coerce to Number for the sanity check. The remaining 9 entries
      // (weights 100..900) are real px numbers or APCA sentinel codes
      // (999=prohibited, 777=non-text only) — none of which fire at Lc ≥ 45.
      const reportedLc = Number(arr[0]);
      expect(Number.isFinite(reportedLc), `Lc echo finite at Lc=${lc}`).toBe(true);

      // Audit print (intentional): surfaces APCA LUT per-weight px floors in
      // the test log so the design-system rule's stated numbers stay grounded
      // against canonical upstream data.
      console.info(
        `[APCA font-LUT] Lc=${lc}\n` +
          WEIGHT_INDEXES.map(
            (w, i) => `    weight ${w}: ${arr[i + 1]}px`,
          ).join('\n'),
      );

      // Bold weight (700) px floor reported by the LUT for this Lc — surfaced
      // as the design-system's binding floor at Lc 45. We do NOT assert the
      // value itself (Myndex updates the LUT); we assert the bold weight's
      // px floor is reported and finite, so the doc rule (≥ weight-700 px on
      // accent chips gated at that Lc) has a single SSOT for the number.
      const boldFloorPx = arr[1 + WEIGHT_INDEXES.indexOf(700)];
      expect(Number.isFinite(boldFloorPx), `bold px floor finite at Lc=${lc}`).toBe(true);
      expect(boldFloorPx, `bold px floor positive at Lc=${lc}`).toBeGreaterThan(0);

      // LUT invariant over the body-text weight range (100..700): heavier
      // weight ⇒ fewer px needed (per APCA weight compensation). The LUT
      // inverts at heavy weights for high Lc (e.g. Lc 90 / weight 800 →16,
      // weight 900 →18) — that inversion is intentional in Myndex's LUT
      // for display-only weights and outside the design-system's body rule,
      // so we only assert monotonicity over weights 100..700.
      let prev = Infinity;
      for (const w of BODY_WEIGHTS) {
        const idx = WEIGHT_INDEXES.indexOf(w);
        const px = arr[idx + 1] as number;
        if (Number.isFinite(px)) {
          expect(px, `weight ${w} px <= prev (monotone over body weights)`).toBeLessThanOrEqual(prev);
          prev = px;
        }
      }
    },
  );

  it('the Lc 45 bold px floor is the binding accent-chip minimum (surfaced for design-system.md)', () => {
    const arr = fontLookupAPCA(45) as Array<number>;
    const boldFloorPx = arr[1 + WEIGHT_INDEXES.indexOf(700)];
    // The doc rule says "accent fills pinned at Lc 45 must keep chip text at
    // ≥ text-sm font-semibold (14px/600)". Print the LUT's bold-weight floor
    // at Lc 45 so the number is in the test log; APCA's own statement at Lc
    // 45 (Bronze Simple Mode) reads "36px normal/400 or 24px bold/700" — the
    // LUT's value at weight 700 should sit in that neighbourhood. We do not
    // pin the precise number (the LUT is upstream data) but assert it is
    // larger than text-xs (12px) — confirming Lc 45 alone is NOT enough for
    // a 12px label on an accent chip.
    // Audit print (intentional): surfaces the LUT bold-weight px floor at Lc 45
    // so the design-system rule's number is in the test log alongside the test.
    console.info(
      `[APCA font-LUT] Lc=45 bold (700) minimum: ${boldFloorPx}px — accent fills gated at Lc 45 must keep chip label text at ≥ this px at weight 700 (see docs/conventions/design-system.md §Accent fills).`,
    );
    expect(boldFloorPx, 'Lc-45 bold floor stays above 12px').toBeGreaterThan(12);
  });
});
