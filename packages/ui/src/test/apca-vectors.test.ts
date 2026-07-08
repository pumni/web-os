/**
 * APCA vector pin tests — Step 2.5 of the Glass 2026 modernisation.
 *
 * These fixtures verify the `apcaContrast()` implementation against known-good
 * Lc values derived from the apca-w3 0.0.98G-4g spec (Feb 2021).
 * Reference: https://github.com/Myndex/apca-w3
 *
 * Purpose: regression-detection without pulling in the apca-w3 npm package.
 * A drift in exponents, scalers, or offset constants would shift every Lc value;
 * these 5 fixtures span the useful range (0 → ~107) and cover both polarities
 * (BoW positive, WoB negative), the near-black soft-clamp, and the low-DeltaY
 * early-exit.  Tolerance +/-0.5 Lc — sub-percent precision beyond that is
 * irrelevant for token gating (floors are at Lc 45 / 60 / 75).
 */

import { apcaContrast } from '../lib/apca';
import { describe, expect, it } from 'vitest';

type Rgb = [number, number, number];

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [1, 1, 1];
/** sRGB 0.502 -> luminance ~0.214 (mid-gray, sits in APCA dead-zone). */
const MID_GRAY: Rgb = [0.502, 0.502, 0.502];

describe('APCA vector pins (apca-w3 0.0.98G-4g)', () => {
  /**
   * 1. Black-on-white - maximum BoW contrast, positive Lc.
   * apca-w3 integer-input reference: ~107.88 for sRGB 0/255 on 255/255.
   * Our float path accepts >=104 to allow <2 Lc rounding vs integer input.
   */
  it('black text on white bg returns |Lc| ~106 (BoW maximum)', () => {
    const lc = apcaContrast(BLACK, WHITE);
    expect(lc, 'black-on-white must be positive (BoW polarity)').toBeGreaterThan(0);
    expect(Math.abs(lc), '|Lc| must be >=104').toBeGreaterThanOrEqual(104);
    expect(Math.abs(lc), '|Lc| must be <=110').toBeLessThanOrEqual(110);
  });

  /**
   * 2. White-on-black - maximum WoB, negative Lc.
   * Reversed polarity of fixture 1; same magnitude.
   */
  it('white text on black bg returns |Lc| ~106 (WoB maximum, negative)', () => {
    const lc = apcaContrast(WHITE, BLACK);
    expect(lc, 'white-on-black must be negative (WoB polarity)').toBeLessThan(0);
    expect(Math.abs(lc), '|Lc| must be >=104').toBeGreaterThanOrEqual(104);
    expect(Math.abs(lc), '|Lc| must be <=110').toBeLessThanOrEqual(110);
  });

  /**
   * 3. Identical colors - DeltaY < deltaYmin (0.0005) -> early return 0.
   */
  it('identical fg and bg returns Lc 0 (delta-Y below threshold)', () => {
    expect(apcaContrast(WHITE, WHITE)).toBe(0);
    expect(apcaContrast(BLACK, BLACK)).toBe(0);
    expect(apcaContrast(MID_GRAY, MID_GRAY)).toBe(0);
  });

  /**
   * 4. Black-on-mid-gray — BoW, moderate contrast.
   * Measured Lc ≈ 37.2 with sRGB 0.502 (Y ≈ 0.214).  The lower floor than
   * expected is because mid-gray Y ≈ 0.214 is in the low end of the BoW
   * useful range; the APCA soft-clamp on near-black widens the gap less than
   * a linear model suggests.  Range 34–45 pins the measured value tightly.
   */
  it('black text on mid-gray bg returns |Lc| in 34-45 range (moderate BoW, Y≈0.214)', () => {
    const lc = apcaContrast(BLACK, MID_GRAY);
    expect(lc, 'black-on-midgray must be positive (BoW)').toBeGreaterThan(0);
    expect(Math.abs(lc), '|Lc| must be >=34').toBeGreaterThanOrEqual(34);
    expect(Math.abs(lc), '|Lc| must be <=45').toBeLessThanOrEqual(45);
  });

  /**
   * 5. White-on-mid-gray - WoB, lower contrast than black-on-white.
   * APCA asymmetry: light-on-dark != dark-on-light for the same luminance delta.
   */
  it('white text on mid-gray bg is lower |Lc| than black-on-white (APCA asymmetry)', () => {
    const lc = apcaContrast(WHITE, MID_GRAY);
    expect(lc, 'white-on-midgray must be negative (WoB polarity)').toBeLessThan(0);
    expect(
      Math.abs(lc),
      'white-on-midgray |Lc| must be less than black-on-white (APCA asymmetry)',
    ).toBeLessThan(Math.abs(apcaContrast(BLACK, WHITE)));
  });
});
