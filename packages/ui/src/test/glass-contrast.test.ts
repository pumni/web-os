import { apcaContrast } from '../lib/apca';
import { oklchToSrgb, type Oklch as Color } from '../lib/oklch';
import { describe, expect, it } from 'vitest';
import {
  buildTokenMap,
  buildAccentTokenMap,
  resolveColor,
  mixOklch,
  readBlock,
  css,
  type Mode,
} from '../../scripts/lib/token-resolver';

type Rgb = [number, number, number];

const ACCENTS = ['coral', 'cyan', 'indigo', 'violet', 'rose'] as const;

const desktopBlobTokens = [
  '--desktop-blob-primary',
  '--desktop-blob-secondary',
  '--desktop-blob-accent',
  '--desktop-blob-cyan',
];

function tokenColor(name: string, tokenMap: Map<string, string>) {
  return resolveColor(name, tokenMap);
}

function composite(foreground: Color, background: Color): Rgb {
  const fg = oklchToSrgb(foreground);
  const bg = oklchToSrgb(background);

  return [
    fg[0] * foreground.alpha + bg[0] * (1 - foreground.alpha),
    fg[1] * foreground.alpha + bg[1] * (1 - foreground.alpha),
    fg[2] * foreground.alpha + bg[2] * (1 - foreground.alpha),
  ];
}

function parsePercentFactor(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const match = value.match(/^([\d.]+)%$/);
  if (match) {
    return parseFloat(match[1]!) / 100;
  }
  const floatVal = parseFloat(value);
  return isNaN(floatVal) ? fallback : floatVal;
}

function compositeGlass(
  foreground: Color,
  background: Color,
  tokenMap: Map<string, string>,
): Rgb {
  const brightnessVal = tokenMap.get('--glass-brightness');
  const saturateVal = tokenMap.get('--glass-saturate');

  const brightness = parsePercentFactor(brightnessVal, 1.0);
  const saturate = parsePercentFactor(saturateVal, 1.0);

  const fg = oklchToSrgb(foreground);
  const bg = oklchToSrgb(background);

  let r = bg[0] * brightness;
  let g = bg[1] * brightness;
  let b = bg[2] * brightness;

  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  r = luma + (r - luma) * saturate;
  g = luma + (g - luma) * saturate;
  b = luma + (b - luma) * saturate;

  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));

  return [
    fg[0] * foreground.alpha + r * (1 - foreground.alpha),
    fg[1] * foreground.alpha + g * (1 - foreground.alpha),
    fg[2] * foreground.alpha + b * (1 - foreground.alpha),
  ];
}

/**
 * APCA role floors per APC-RC Bronze Simple Mode (readtech.org/ARC/tests/bronze-simple-mode):
 * — the SAPC-APCA repo's "APCA in a Nutshell" is *superseded* by APC-RC Bronze
 *   Simple Mode; the algorithm constants are unchanged but the use-case threshold
 *   definitions are owned by the ARC.
 * - Lc 90 = PREFERRED for body columns (18px/300, 14px/400, 12px non-body)
 * - Lc 75 = MINIMUM for body columns (24px/300, 18px/400, 16px/500, 14px/700)
 * - Lc 60 = MINIMUM for chrome / short content text (NOT body columns)
 *   — 48px/200, 24px/400, 16px/700, etc. AAA: add Lc 15 to each.
 * - Lc 45 = MINIMUM for large/heavy headlines (36px/400, 24px/700) + fine pictograms
 * Glass gates below use Lc 60 for short UI text over frosted fill composites; body
 * text stays on solid insets (DialogBody / CardWell), targeting Lc 75 minimum with
 * Lc 90 preferred for long-form columns (see `glass-wcag2-bridge.test.ts` for the
 * non-gating WCAG 2.x compliance audit printed alongside the APCA gates).
 */
describe('Glass contrast tokens', () => {
  it.each(['light', 'dark'] as const)(
    'keeps chrome/short text at APCA Lc 60 over readable glass + desktop blobs in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint-readable', tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = compositeGlass(glass, background, tokenMap);

        expect(
          Math.abs(apcaContrast(foreground, glassOverBlob)),
          `${mode} ${blobToken} readable-glass text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(60);
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps chrome/short text at APCA Lc 60 over chrome glass + desktop blobs in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint-chrome', tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = compositeGlass(glass, background, tokenMap);

        expect(
          Math.abs(apcaContrast(foreground, glassOverBlob)),
          `${mode} ${blobToken} chrome-glass text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(60);
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps readable glass Lc 60 over high-chroma (valid glass backdrop) synthetics in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint-readable', tokenMap);

      // Glass placement: glass requires a colourful backdrop — pure near-black/near-white
      // are invalid glass contexts (use solid Card). Stress high-chroma media-like fills.
      const worstCases: Array<{ label: string; bg: Color }> = [
        { label: 'max-chroma-coral', bg: { l: 0.7, c: 0.18, h: 30, alpha: 1 } },
        { label: 'max-chroma-amber', bg: { l: 0.75, c: 0.16, h: 75, alpha: 1 } },
        { label: 'max-chroma-blue', bg: { l: 0.55, c: 0.18, h: 250, alpha: 1 } },
        { label: 'max-chroma-violet', bg: { l: 0.55, c: 0.18, h: 300, alpha: 1 } },
      ];

      for (const { label, bg } of worstCases) {
        const glassOverBg = compositeGlass(glass, bg, tokenMap);
        expect(
          Math.abs(apcaContrast(foreground, glassOverBg)),
          `${mode} ${label} readable-glass text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(60);
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'pins frosted blur ladder primitives in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      expect(tokenMap.get('--blur-glass-sm')).toBe('12px');
      expect(tokenMap.get('--blur-glass')).toBe('16px');
      expect(tokenMap.get('--blur-glass-md')).toBe('20px');
      expect(tokenMap.get('--blur-glass-lg')).toBe('24px');
      // Semantic blur points at the ladder (raw map keeps var() — no dimension resolver).
      expect(tokenMap.get('--glass-blur')).toBe(
        mode === 'dark' ? 'var(--blur-glass-md)' : 'var(--blur-glass)',
      );
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps chrome tint more translucent than readable in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const chrome = tokenColor('--glass-tint-chrome', tokenMap);
      const readable = tokenColor('--glass-tint-readable', tokenMap);
      expect(chrome.alpha, `${mode} chrome alpha`).toBeLessThan(readable.alpha);
      expect(readable.alpha, `${mode} readable alpha floor`).toBeGreaterThanOrEqual(0.4);
    },
  );

  // Glass edge doctrine (2026 border rescope — completes
  // glass-border-doctrine-and-grain-2026):
  // The glass edge is a SPECULAR LIGHT RIM, not a contrast boundary. It is a
  // thin translucent light stroke that catches light along the top-left and
  // fades to a faint shadow at the bottom-right (Apple Liquid Glass / 2026
  // glassmorphism consensus). It is deliberately low-contrast and is NOT
  // APCA-gated: no accessibility standard asks a container border to hit a
  // contrast ratio (WCAG 1.4.11 scopes contrast to interactive controls — that
  // duty lives on --input). The real delineator is the drop shadow
  // (--shadow-glass); the real a11y path is the prefers-contrast /
  // prefers-reduced-transparency fallbacks that recolour the edge to solid
  // --border. An earlier revision gated the "dominant" edge at APCA Lc 25,
  // which forced the light-mode rim to a dark navy stroke that read like a
  // solid-card outline — the opposite of glass. These guards pin the corrected
  // aesthetic so the edge can't drift back to that high-contrast stroke.
  it.each(['light', 'dark'] as const)(
    'keeps the glass top rim a light specular stroke (not a contrast outline) in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);

      for (const edgeToken of ['--glass-edge', '--glass-edge-top'] as const) {
        const edge = tokenColor(edgeToken, tokenMap);

        // A light-catching rim: high lightness (white in light mode, softened
        // light neutral-violet in dark). Never a dark high-contrast stroke.
        expect(edge.l, `${mode} ${edgeToken} must be a LIGHT rim`).toBeGreaterThanOrEqual(0.85);

        // Visible enough to define the shape...
        expect(edge.alpha, `${mode} ${edgeToken} stays visible`).toBeGreaterThan(0.1);
        // ...but restrained — never an opaque hard outline.
        expect(edge.alpha, `${mode} ${edgeToken} stays restrained`).toBeLessThanOrEqual(0.7);
      }
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps --glass-edge-bottom a shadow bevel subordinate to the top rim in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const bottomEdge = tokenColor('--glass-edge-bottom', tokenMap);
      const topEdge = tokenColor('--glass-edge-top', tokenMap);

      // Visible enough to contribute to the bevel...
      expect(bottomEdge.alpha, `${mode} bottom edge stays visible`).toBeGreaterThan(0.1);
      // ...but darker than the light-catching top rim: it is contact shading,
      // not a second rim. Guards against the "two bright rims" regression.
      expect(bottomEdge.l, `${mode} bottom edge is a shadow, darker than the top rim`).toBeLessThan(
        topEdge.l,
      );
    },
  );

  // The float shadow remains the primary delineator (per design-system.md).
  // Assert presence so it can't be silently zeroed.
  it.each(['light', 'dark'] as const)(
    'delineates glass panels via the float shadow in %s mode',
    // keep this test marker for context
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      expect(tokenMap.has('--shadow-glass'), `${mode} --shadow-glass defined`).toBe(true);
      const edge = tokenColor('--glass-edge', tokenMap);
      expect(edge.alpha, `${mode} glass edge is visible`).toBeGreaterThan(0.1);
    },
  );

  it('differs from raw composite for synthetic colorful backgrounds when filters are active', () => {
    const tokenMap = buildTokenMap('light');
    const tint: Color = { l: 0.96, c: 0.01, h: 250, alpha: 0.58 };
    const bg: Color = { l: 0.7, c: 0.18, h: 30, alpha: 1.0 }; // high-chroma coral

    const raw = composite(tint, bg);
    const proxy = compositeGlass(tint, bg, tokenMap);

    const diff = Math.max(
      Math.abs(raw[0] - proxy[0]),
      Math.abs(raw[1] - proxy[1]),
      Math.abs(raw[2] - proxy[2])
    );
    expect(diff).toBeGreaterThan(0.01);
  });
});

/* ------------------------------------------------------------------ *
 * Glass intensity personalization — soft + strong APCA gate (Step 1.1)
 * Mirrors how `[data-glass='soft']` and `[data-glass='strong']` CSS blocks
 * override chrome/readable tints in personalization.css. We inject those
 * overrides into the base map so token-resolver can resolve and APCA-gate
 * the composites.
 *
 * Keep this helper in sync with personalization.css selector names.
 * ------------------------------------------------------------------ */

function buildGlassIntensityMap(
  mode: Mode,
  intensity: 'soft' | 'strong',
): Map<string, string> {
  const map = buildTokenMap(mode);
  // Merge [data-glass='soft'|'strong'] block — simulate CSS attribute override
  for (const [name, value] of readBlock(css.personalization, `[data-glass='${intensity}']`)) {
    map.set(name, value);
  }
  return map;
}

describe('Glass intensity — soft/strong APCA gate', () => {
  const intensities = ['soft', 'strong'] as const;

  it.each(
    intensities.flatMap((intensity) =>
      (['light', 'dark'] as const).map((mode) => [intensity, mode] as const),
    ),
  )(
    'keeps chrome/short text at Lc 60 over readable glass + desktop blobs in %s %s',
    (intensity, mode) => {
      const tokenMap = buildGlassIntensityMap(mode, intensity);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint-readable', tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = compositeGlass(glass, background, tokenMap);

        expect(
          Math.abs(apcaContrast(foreground, glassOverBlob)),
          `${intensity} ${mode} ${blobToken} readable-glass text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(60);
      }
    },
  );

  it.each(
    intensities.flatMap((intensity) =>
      (['light', 'dark'] as const).map((mode) => [intensity, mode] as const),
    ),
  )(
    'keeps readable glass Lc 60 over high-chroma synthetics in %s %s',
    (intensity, mode) => {
      const tokenMap = buildGlassIntensityMap(mode, intensity);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint-readable', tokenMap);

      const worstCases: Array<{ label: string; bg: Color }> = [
        { label: 'max-chroma-coral', bg: { l: 0.7, c: 0.18, h: 30, alpha: 1 } },
        { label: 'max-chroma-amber', bg: { l: 0.75, c: 0.16, h: 75, alpha: 1 } },
        { label: 'max-chroma-blue', bg: { l: 0.55, c: 0.18, h: 250, alpha: 1 } },
        { label: 'max-chroma-violet', bg: { l: 0.55, c: 0.18, h: 300, alpha: 1 } },
      ];

      for (const { label, bg } of worstCases) {
        const glassOverBg = compositeGlass(glass, bg, tokenMap);
        expect(
          Math.abs(apcaContrast(foreground, glassOverBg)),
          `${intensity} ${mode} ${label} readable-glass text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(60);
      }
    },
  );

  it.each(
    intensities.flatMap((intensity) =>
      (['light', 'dark'] as const).map((mode) => [intensity, mode] as const),
    ),
  )(
    'keeps chrome tint more translucent than readable in %s %s',
    (intensity, mode) => {
      const tokenMap = buildGlassIntensityMap(mode, intensity);
      const chrome = tokenColor('--glass-tint-chrome', tokenMap);
      const readable = tokenColor('--glass-tint-readable', tokenMap);
      expect(chrome.alpha, `${intensity} ${mode} chrome alpha < readable alpha`).toBeLessThan(
        readable.alpha,
      );
    },
  );
});

/* ------------------------------------------------------------------ *
 * Glass fill relative derivation invariant (Step 1.1)
 * After Phase 1.2 migrates to --glass-fill + relative Color 5 alpha scale,
 * chrome and readable must share the same L/C/H (from the single fill source),
 * differing only in alpha. This pins the CSS Color 5 SSOT invariant.
 * ------------------------------------------------------------------ */
describe('Glass fill relative derivation invariant', () => {
  it.each(['light', 'dark'] as const)(
    'chrome and readable share L/C/H from the same fill source in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const chrome = tokenColor('--glass-tint-chrome', tokenMap);
      const readable = tokenColor('--glass-tint-readable', tokenMap);

      const TOLERANCE = 0.001;
      expect(
        Math.abs(chrome.l - readable.l),
        `${mode} chrome.l == readable.l (shared fill source)`,
      ).toBeLessThan(TOLERANCE);
      expect(
        Math.abs(chrome.c - readable.c),
        `${mode} chrome.c == readable.c (shared fill source)`,
      ).toBeLessThan(TOLERANCE);
      // Hue is achromatic-safe (c ≈ 0 makes h arbitrary) — only check when chroma > 0
      if (chrome.c > 0.001) {
        expect(
          Math.abs(chrome.h - readable.h),
          `${mode} chrome.h == readable.h (shared fill source)`,
        ).toBeLessThan(TOLERANCE);
      }
      // Alpha must differ: chrome is more translucent
      expect(chrome.alpha, `${mode} chrome alpha < readable alpha`).toBeLessThan(readable.alpha);
    },
  );
});

/* ------------------------------------------------------------------ *
 * Accent personalization contrast
 * Gates the claim in personalization.css that every accent (coral / cyan / indigo /
 * violet / rose) keeps the white `--primary-foreground` readable on `--primary`, and
 * that the color-mix-derived accent surface keeps `--accent-foreground` readable on
 * `--accent`. Mirrors the real cascade: coral = no attribute (default brand from
 * brand.css + hand-tuned theme.css values), cyan/violet/rose = `[data-accent]`
 * overrides + derived surface.
 * ------------------------------------------------------------------ */

describe('Accent personalization contrast', () => {
  const modes = ['light', 'dark'] as const;

  it.each(ACCENTS.flatMap((accent) => modes.map((mode) => [accent, mode] as const)))(
    '%s accent keeps primary-foreground readable on primary in %s mode',
    (accent, mode) => {
      const tokenMap = buildAccentTokenMap(mode, accent);
      const foreground = oklchToSrgb(resolveColor('--primary-foreground', tokenMap));
      const background = oklchToSrgb(resolveColor('--primary', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${accent} ${mode} primary text contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  it.each(ACCENTS.flatMap((accent) => modes.map((mode) => [accent, mode] as const)))(
    '%s accent keeps accent-foreground readable on the accent surface in %s mode',
    (accent, mode) => {
      const tokenMap = buildAccentTokenMap(mode, accent);
      const foreground = oklchToSrgb(resolveColor('--accent-foreground', tokenMap));
      const background = oklchToSrgb(resolveColor('--accent', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${accent} ${mode} accent surface contrast (APCA)`,
      ).toBeGreaterThanOrEqual(45);
    },
  );
});

/* ------------------------------------------------------------------ *
 * Semantic surface contrast (Phase 2)
 * Gates the core muted, secondary, and card surfaces so that their
 * foreground text always passes at minimum APCA Lc 60 (chrome / content-short
 * floor; solid surfaces also host body — prefer Lc 75+ for long columns).
 * ------------------------------------------------------------------ */

describe('Semantic surface contrast', () => {
  it.each(['light', 'dark'] as const)(
    'muted-foreground is readable on muted background in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor('--muted-foreground', tokenMap));
      const background = oklchToSrgb(resolveColor('--muted', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${mode} muted text contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  describe.each(['light', 'dark'] as const)('%s mode', (mode) => {
    it.each([
      {
        fg: '--secondary-foreground',
        bg: '--secondary',
        label: 'secondary-foreground on secondary',
      },
      { fg: '--card-foreground', bg: '--card', label: 'card-foreground on card' },
      { fg: '--foreground', bg: '--background', label: 'foreground on background' },
    ] as const)('$label is readable', ({ fg, bg, label }) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor(fg, tokenMap));
      const background = oklchToSrgb(resolveColor(bg, tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${mode} ${label} (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    });
  });

  it.each(['light', 'dark'] as const)(
    'muted-foreground is readable on muted hover background (80% opacity over page background) in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor('--muted-foreground', tokenMap));
      const mutedColor = oklchToSrgb(resolveColor('--muted', tokenMap));
      const pageBackground = oklchToSrgb(resolveColor('--background', tokenMap));

      const hoverBg = compositeAlpha(mutedColor, pageBackground, 0.8);

      expect(
        Math.abs(apcaContrast(foreground, hoverBg)),
        `${mode} muted hover text contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );
});

/* ------------------------------------------------------------------ *
 * Status tint readability (Phase 2)
 * Status chips use a /10 opacity tint of the semantic status token
 * blended over --background as the fill, with the full status token
 * as the text colour.
 * ------------------------------------------------------------------ */

function compositeAlpha(
  fg: [number, number, number],
  bg: [number, number, number],
  alpha: number,
): [number, number, number] {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ];
}

const STATUS_TOKENS = ['--destructive', '--success', '--warning', '--primary', '--info'] as const;

/*
 * Pinned floors, measured with the spec-correct APCA pipeline (gamma-encoded
 * sRGB input — see oklch.ts). Floors below the Lc 60 chrome/short-text target are the
 * documented cost of a single token serving BOTH solid-fill and text roles:
 * - light warning (48): amber has a hard readability ceiling on cream — the
 *   amber-600 stop is already the darkest value that still scans as amber.
 * - dark destructive (36) / dark primary (32): red-500 and coral-500 are
 *   anchored by their solid-fill role (white foreground must hold Lc >= 60 on
 *   the fill); a lighter text-friendly stop would break the button pair.
 *   Status-chip text is short/bold label copy, where Lc >= 30 is tolerable.
 * Everything else clears 53+.
 */
const STATUS_TINT_THRESHOLDS: Record<
  (typeof STATUS_TOKENS)[number],
  {
    light: number;
    dark: number;
  }
> = {
  '--destructive': {
    light: 55,
    dark: 36,
  },
  '--success': {
    light: 53,
    dark: 62,
  },
  '--warning': {
    light: 48,
    dark: 67,
  },
  '--primary': {
    light: 63,
    dark: 32,
  },
  '--info': {
    light: 59,
    dark: 59,
  },
};

describe('Status tint readability', () => {
  it.each(
    STATUS_TOKENS.flatMap((token) =>
      (['light', 'dark'] as const).map((mode) => [token, mode] as const),
    ),
  )('%s text on 10%%-tint chip is readable in %s mode', (token, mode) => {
    const tokenMap = buildTokenMap(mode);
    const statusColor = resolveColor(token, tokenMap);
    const pageBackground = oklchToSrgb(resolveColor('--background', tokenMap));

    const chipBg = compositeAlpha(oklchToSrgb(statusColor), pageBackground, 0.1);
    const chipFg = oklchToSrgb(statusColor);

    const threshold = STATUS_TINT_THRESHOLDS[token][mode];

    expect(
      Math.abs(apcaContrast(chipFg, chipBg)),
      `${token} ${mode} status tint contrast (APCA)`,
    ).toBeGreaterThanOrEqual(threshold);
  });
});

/* ------------------------------------------------------------------ *
 * Step-11 text role (Radix step-9 fill / step-11 text)
 * `--primary` / `--destructive` are anchored dark for their solid-FILL role
 * (white foreground must clear Lc 60 on the fill), which drops them to Lc ~34 /
 * ~37 when used AS text on --background in dark. `--primary-text` /
 * `--destructive-text` are the readable text stops the `link` button,
 * FormMessage, and inline brand/error text consume. Gate them at the Lc 60
 * body-text target on both reading surfaces (background + card), both modes.
 * ------------------------------------------------------------------ */
describe('Step-11 text role contrast', () => {
  const surfaces = ['--background', '--card'] as const;
  const modes = ['light', 'dark'] as const;

  // --primary-text derives from --primary, which EVERY personalization accent
  // overrides — so it must clear the text gate under all accents, not just the
  // default coral. rose (red-600, chroma 0.245) is the worst case: lifted to
  // L 0.80 it sRGB-clips to Lc ~48 unless the derivation caps chroma (0.13).
  it.each(
    ACCENTS.flatMap((accent) =>
      surfaces.flatMap((surface) => modes.map((mode) => [accent, surface, mode] as const)),
    ),
  )('primary-text (%s accent) is readable on %s in %s mode', (accent, surface, mode) => {
    const tokenMap = buildAccentTokenMap(mode, accent);
    const foreground = oklchToSrgb(resolveColor('--primary-text', tokenMap));
    const background = oklchToSrgb(resolveColor(surface, tokenMap));

    expect(
      Math.abs(apcaContrast(foreground, background)),
      `primary-text (${accent}) on ${surface} in ${mode} mode (APCA)`,
    ).toBeGreaterThanOrEqual(60);
  });

  // --destructive-text is accent-independent (destructive is not personalized).
  it.each(surfaces.flatMap((surface) => modes.map((mode) => [surface, mode] as const)))(
    'destructive-text is readable on %s in %s mode',
    (surface, mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor('--destructive-text', tokenMap));
      const background = oklchToSrgb(resolveColor(surface, tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `destructive-text on ${surface} in ${mode} mode (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );
});

describe('Field contrast readable', () => {
  it.each(['light', 'dark'] as const)(
    'keeps text contrast at APCA Lc 60 over field background in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const fieldBg = oklchToSrgb(resolveColor('--field', tokenMap));
      const foreground = oklchToSrgb(resolveColor('--foreground', tokenMap));
      const mutedForeground = oklchToSrgb(resolveColor('--muted-foreground', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, fieldBg)),
        `${mode} foreground on field contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);

      expect(
        Math.abs(apcaContrast(mutedForeground, fieldBg)),
        `${mode} placeholder/muted on field contrast (APCA)`,
      ).toBeGreaterThanOrEqual(45);
    },
  );
});

describe('Popover dark elevation contrast', () => {
  it('keeps popover foreground contrast at APCA Lc 60 in dark mode', () => {
    const tokenMap = buildTokenMap('dark');
    const popoverBg = oklchToSrgb(resolveColor('--popover', tokenMap));
    const popoverFg = oklchToSrgb(resolveColor('--popover-foreground', tokenMap));

    expect(
      Math.abs(apcaContrast(popoverFg, popoverBg)),
      'dark popover foreground contrast (APCA)',
    ).toBeGreaterThanOrEqual(60);
  });
});

describe('State-selected contrast', () => {
  it.each(['light', 'dark'] as const)(
    'keeps foreground text contrast above Lc 60 on state-selected overlay in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const baseBg = resolveColor('--background', tokenMap);
      const text = oklchToSrgb(resolveColor('--foreground', tokenMap));

      const fgToken = resolveColor('--foreground', tokenMap);
      const stateSelectedPct =
        Number(tokenMap.get('--state-selected')?.replace('%', '') ?? '10') / 100;

      const mixedBgColor = mixOklch(fgToken, baseBg, stateSelectedPct);
      const mixedBg = oklchToSrgb(mixedBgColor);

      expect(
        Math.abs(apcaContrast(text, mixedBg)),
        `${mode} text on state-selected background contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );
});

describe('Chart color CVD distinctness', () => {
  it.each(['light', 'dark'] as const)(
    'ensures chart color series have distinct lightness delta in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const primary = resolveColor('--primary', tokenMap).l;
      const chart2 = resolveColor('--chart', tokenMap).l;

      // primary (coral brand) and chart (indigo) are the only two data-vis
      // colours in active use (bento-simulator.tsx). They must be distinct
      // enough for colour-blind viewers (Lc delta ≥ 0.02 on the OKLCH L axis).
      expect(Math.abs(primary - chart2)).toBeGreaterThanOrEqual(0.02);
    },
  );
});

describe('Chart palette contrast', () => {
  const modes = ['light', 'dark'] as const;
  const chartTokens = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'] as const;
  const surfaceTokens = ['--background', '--card'] as const;

  it.each(
    chartTokens.flatMap((chart) =>
      surfaceTokens.flatMap((surface) => modes.map((mode) => [chart, surface, mode] as const)),
    ),
  )('%s contrast over %s is at least APCA Lc 45 in %s mode', (chart, surface, mode) => {
    const tokenMap = buildTokenMap(mode);
    const chartColor = oklchToSrgb(resolveColor(chart, tokenMap));
    const surfaceColor = oklchToSrgb(resolveColor(surface, tokenMap));

    expect(
      Math.abs(apcaContrast(chartColor, surfaceColor)),
      `${chart} over ${surface} in ${mode} mode contrast (APCA)`,
    ).toBeGreaterThanOrEqual(45);
  });
});
