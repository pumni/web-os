import { describe, expect, it } from 'vitest';

import { apcaContrast } from '../lib/apca';
import { oklchToSrgb, type Oklch as Color } from '../lib/oklch';
import {
  buildTokenMap,
  resolveColor,
  type Mode,
} from '../../scripts/lib/token-resolver';

/**
 * WCAG 2.x legal-compliance bridge — NON-GATING report.
 * ------------------------------------------------------------------
 * APCA is the engineering target (ADR-0012 + design-system.md), and WCAG 3
 * is still a Working Draft at the W3C. In jurisdictions where WCAG 2.1 AA
 * (4.5:1 normal text, 3:1 large/UI) is the enforceable accessibility floor
 * (ADA, EAA, Section 508), automated audits that only run WCAG 2 contrasts
 * may flag the APCA-tuned surfaces as "failing" even though they read fine
 * — WCAG 2 systematically overstates dark-on-dark contrast (the APCA
 * Nutshell note), so the two systems are NOT directly equivalent.
 *
 * Myndex publishes `bridge-pca` (https://github.com/Myndex/bridge-pca) as the
 * backward-compatible APCA-perceptual bridge to WCAG 2 ratio reporting. We do
 * not gate on WCAG 2 here: the APCA `glass-contrast.test.ts` pipeline stays
 * the technical SSOT. This file is a compliance audit-print surface — a
 * report of the WCAG 2 ratio per gated pair, generated from the same token
 * pairs so that any accessibility audit can derive its WCAG 2 verdict from
 * from the same OKLCH source without re-running Math.
 *
 * If a real legal/contractual audit demands a WCAG 2 AA pass and an APCA-gated
 * pair falls below the WCAG 2 floor for that use case, raise the Lc target for
 * that surface (the APCA floor already exceeds the perceptually-correct need).
 */

/** WCAG 2.x relative luminance (IEC sRGB piecewise, 0.03928 cutoff). */
function wcag2Luminance(rgb: [number, number, number]): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

/** WCAG 2.x contrast ratio (1 .. 21). */
function wcag2Ratio(fg: [number, number, number], bg: [number, number, number]): number {
  const Lfg = wcag2Luminance(fg);
  const Lbg = wcag2Luminance(bg);
  const [lighter, darker] = Lfg >= Lbg ? [Lfg, Lbg] : [Lbg, Lfg];
  return (lighter + 0.05) / (darker + 0.05);
}

type Pair = {
  label: string;
  fg: string;
  bg: string;
  /** WCAG 2 AA floor this surface should hit for audit purposes. */
  aaFloor: number;
};

const PAIRS: Pair[] = [
  { label: 'foreground on background', fg: '--foreground', bg: '--background', aaFloor: 4.5 },
  { label: 'card-foreground on card', fg: '--card-foreground', bg: '--card', aaFloor: 4.5 },
  { label: 'muted-foreground on muted', fg: '--muted-foreground', bg: '--muted', aaFloor: 4.5 },
  { label: 'secondary-foreground on secondary', fg: '--secondary-foreground', bg: '--secondary', aaFloor: 4.5 },
  { label: 'popover-foreground on popover', fg: '--popover-foreground', bg: '--popover', aaFloor: 4.5 },
  { label: 'foreground on field', fg: '--foreground', bg: '--field', aaFloor: 4.5 },
];

describe('WCAG 2.x compliance audit (non-gating bridge report)', () => {
  // Use a single non-parametrized block so the audit logs ARE the test's
  // feedback — they print alongside the APCA gates in CI without ever gating
  // on the WCAG 2 verdict. The assertion only secures that a report was
  // produced for every pair (so the helper cannot silently regress).
  it.each(['light', 'dark'] as const)(
    'emits a WCAG 2 AA report for every gated surface pair in %s mode',
    (mode: Mode) => {
      const tokenMap = buildTokenMap(mode);
      const rows: Array<{
        pair: string;
        mode: Mode;
        apcaLc: number;
        wcag2Ratio: number;
        aaFloor: number;
        aaPass: boolean;
      }> = [];

      for (const { label, fg, bg, aaFloor } of PAIRS) {
        const fgColor: Color = resolveColor(fg, tokenMap);
        const bgColor: Color = resolveColor(bg, tokenMap);
        const fgRgb = oklchToSrgb(fgColor);
        const bgRgb = oklchToSrgb(bgColor);
        const apcaLc = Math.abs(apcaContrast(fgRgb, bgRgb));
        const ratio = wcag2Ratio(fgRgb, bgRgb);
        const aaPass = ratio >= aaFloor;
        rows.push({ pair: label, mode, apcaLc, wcag2Ratio: ratio, aaFloor, aaPass });
      }

      // Audit print (intentional): surfaces a WCAG 2.1 ratio report per gated
      // surface pair alongside the binding APCA Lc, in both modes. The bridge
      // never gates — the APCA Lc floor in glass-contrast.test.ts is the gate.
      console.info(
        `[WCAG 2.x bridge] mode=${mode}\n` +
          rows
            .map(
              (r) =>
                `  ${r.pair.padEnd(36)}  Lc=${r.apcaLc.toFixed(2).padStart(6)}  ` +
                `WCAG2=${r.wcag2Ratio.toFixed(2).padStart(5)}  AA≥${r.aaFloor}  ` +
                (r.aaPass ? 'PASS' : 'fail (APCA gate authoritative — see file header)'),
            )
            .join('\n'),
      );

      // The guard-against-regression: every pair produced a row. If
      // `resolveColor` ever throws on a renamed token, this fires.
      expect(rows.length, `${mode} produced a row per gated pair`).toBe(PAIRS.length);
      rows.forEach((r) => {
        expect(Number.isFinite(r.apcaLc), `${r.pair} APCA Lc finite`).toBe(true);
        expect(Number.isFinite(r.wcag2Ratio), `${r.pair} WCAG 2 ratio finite`).toBe(true);
      });
    },
  );
});
