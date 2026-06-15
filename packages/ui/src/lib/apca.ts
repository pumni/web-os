/* ✦ APCA - Advanced Perceptual Contrast Algorithm ✦ */
/* Reference: https://github.com/Myndex/SAPC-APCA               */
/* W3 implementation: https://github.com/Myndex/apca-w3         */
/* Version: 0.0.98G-4g (Feb 15, 2021)                          */

// ——— SAPC/APCA 0.0.98G-4g constants (W3 license) ———
const mainTRC = 2.4; // 2.4 exponent emulates actual monitor perception

const sRco = 0.2126729;
const sGco = 0.7151522;
const sBco = 0.072175; // matches official 0.072175 (not 0.0721750 which is same value)

// G-4g exponents
const normBG = 0.56;
const normTXT = 0.57;
const revTXT = 0.62; // reverse polarity: text exponent
const revBG = 0.65; // reverse polarity: bg exponent

// G-4g clamps & scalers
const blkThrs = 0.022;
const blkClmp = 1.414;
const scaleBoW = 1.14;
const scaleWoB = 1.14;
const loBoWoffset = 0.027;
const loWoBoffset = 0.027;
const deltaYmin = 0.0005;
const loClip = 0.1;

/**
 * sRGB → relative luminance Y (APCA method: simple 2.4 exponent).
 * Takes channel values in 0.0–1.0 range.
 * Per APCA spec, uses simple exponent (not IEC piecewise) to emulate
 * actual monitor perception.
 */
export function apcaLuminance(r: number, g: number, b: number): number {
  return sRco * r ** mainTRC + sGco * g ** mainTRC + sBco * b ** mainTRC;
}

/**
 * APCA contrast value (Lc). Returns signed float.
 *
 * Positive = dark text on light background (BoW).
 * Negative = light text on dark background (WoB).
 *
 * Perceptual scale: Lc 60 ≈ body text minimum, Lc 25 ≈ UI element minimum.
 * Range approximately −110 to +110.
 */
export function apcaContrast(fg: [number, number, number], bg: [number, number, number]): number {
  let txtY = apcaLuminance(...fg);
  let bgY = apcaLuminance(...bg);

  // Input range clamp
  if (
    Number.isNaN(txtY) ||
    Number.isNaN(bgY) ||
    Math.min(txtY, bgY) < 0 ||
    Math.max(txtY, bgY) > 1.1
  ) {
    return 0;
  }

  // Soft clamp near-black: prevents divide-by-zero & flare compensation
  txtY = txtY > blkThrs ? txtY : txtY + (blkThrs - txtY) ** blkClmp;
  bgY = bgY > blkThrs ? bgY : bgY + (blkThrs - bgY) ** blkClmp;

  // Return 0 for extremely low ∆Y
  if (Math.abs(bgY - txtY) < deltaYmin) return 0;

  let sapc: number;
  let output: number;

  if (bgY > txtY) {
    // Normal polarity: dark text on light background (BoW)
    sapc = (bgY ** normBG - txtY ** normTXT) * scaleBoW;
    output = sapc < loClip ? 0 : sapc - loBoWoffset;
  } else {
    // Reverse polarity: light text on dark background (WoB)
    sapc = (bgY ** revBG - txtY ** revTXT) * scaleWoB;
    output = sapc > -loClip ? 0 : sapc + loWoBoffset;
  }

  return output * 100;
}
