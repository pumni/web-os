/* ✦ APCA - Advanced Perceptual Contrast Algorithm ✦ */
/* Reference: https://github.com/Myndex/SAPC-APCA               */

/**
 * Piecewise sRGB -> Y (APCA-adapted luminance)
 */
export function apcaLuminance(r: number, g: number, b: number): number {
  const rLin = r <= 0.022 ? r / 12.82 : ((r + 0.055) / 1.055) ** 2.4;
  const gLin = g <= 0.022 ? g / 12.82 : ((g + 0.055) / 1.055) ** 2.4;
  const bLin = b <= 0.022 ? b / 12.82 : ((b + 0.055) / 1.055) ** 2.4;
  return 0.2126729 * rLin + 0.7151522 * gLin + 0.072175 * bLin;
}

/**
 * APCA contrast value (Lc). Returns absolute value.
 */
export function apcaContrast(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const txtY = apcaLuminance(...fg);
  const bgY = apcaLuminance(...bg);

  // SAPC/APCA 0.0.98G-4g constants
  const normBG = 0.56;
  const normTXT = 0.57;
  const revBG = 0.62;
  const revTXT = 0.65;
  const scale = 1.14;

  let contrast: number;

  if (bgY >= txtY) {
    // Normal polarity: dark text on light bg
    contrast = (bgY ** normBG - txtY ** normTXT) * scale;
  } else {
    // Reverse polarity: light text on dark bg
    contrast = (bgY ** revBG - txtY ** revTXT) * scale;
  }

  return Math.abs(contrast) < 0.1 ? 0 : Math.abs(contrast) * 100;
}
