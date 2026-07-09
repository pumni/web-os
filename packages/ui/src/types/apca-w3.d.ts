/**
 * Ambient declaration for the canonical `apca-w3` npm package (Myndex
 * Research, W3 license — the only code the SAPC-APCA repo endorses "for
 * any development purpose"). The package ships JS without types; this
 * declares the subset of the public API consumed by the design-system
 * tests:
 *   - `sRGBtoY([r,g,b])`            — expects 0..255 ints, returns Y.
 *   - `APCAcontrast(txtY, bgY)`     — returns APCA Lc (signed).
 *   - `fontLookupAPCA(Lc)`          — returns a 10-element array
 *                                     [Lc echo as string, px@100, px@200,
 *                                      ..., px@900]. Sentinel codes 999
 *                                     (prohibited) and 777 (non-text only)
 *                                     appear at low Lc; px for Lc ≥ 45.
 *
 * Source: `apca-w3@0.1.9` Public Beta 0.1.7 (G), mainTRC 2.4, sRco/sGco/sBco
 * sRGB coefficients — the same constants the hand-roll in
 * `src/lib/apca.ts` reproduces; `apca-canonical-drift.test.ts` guards
 * drift between the two.
 */
declare module 'apca-w3' {
  export type RgbTriplet = [number, number, number];

  /**
   * Linearize sRGB to relative luminance Y. Channels are 0..255 ints (the
   * function divides internally), NOT 0..1 floats.
   */
  export function sRGBtoY(rgb?: RgbTriplet): number;

  /**
   * APCA contrast (signed Lc) for two Y values. Negative = light text on
   * dark bg; positive = dark text on light bg. Polarity matters for the
   * sign but fontLookupAPCA takes |Lc| internally.
   */
  export function APCAcontrast(txtY: number, bgY: number): number;

  /**
   * Per-weight px minimum for a given Lc, per the APC-RC Bronze Simple
   * Mode font-LUT. Returns a 10-element array: index 0 is the Lc echo as
   * a toFixed(2) STRING; indices 1..9 are px floors for weights 100..900
   * (real numbers, or sentinel codes 999 / 777 / 120 outside the
   * body-text envelope).
   */
  export function fontLookupAPCA(contrast: number, places?: number): Array<string | number>;
}
