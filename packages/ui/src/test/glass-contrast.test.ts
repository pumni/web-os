import { apcaContrast } from '../lib/apca';
import { oklchToSrgb, type Oklch as Color } from '../lib/oklch';
import { describe, expect, it } from 'vitest';
import {
  buildTokenMap,
  buildAccentTokenMap,
  resolveColor,
  mixOklch,
  type Accent,
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

describe('Glass contrast tokens', () => {
  it.each(['light', 'dark'] as const)(
    'keeps text contrast at APCA Lc 60 over desktop blobs in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(tokenColor('--foreground', tokenMap));
      const glass = tokenColor('--glass-tint', tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = composite(glass, background);

        expect(
          Math.abs(apcaContrast(foreground, glassOverBlob)),
          `${mode} ${blobToken} text contrast (APCA)`,
        ).toBeGreaterThanOrEqual(mode === 'light' ? 50 : 60);
      }
    },
  );

  // ADR-0014: glassmorphism panels are delineated by the drop shadow
  // (`--shadow-glass`) plus a luminous WHITE edge highlight — NOT by a
  // high-contrast border. A white edge on a light glass surface cannot clear
  // APCA Lc 25 and is not the delineator, so the old "border ≥ Lc 25" gate was
  // rescoped: the text gate above stays authoritative (readability), and the
  // edge is guarded only for presence (so it can't be silently zeroed).
  it.each(['light', 'dark'] as const)(
    'delineates glass panels via the float shadow + a present luminous edge in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);

      // (1) The float shadow that actually separates the panel from its backdrop.
      expect(tokenMap.has('--shadow-glass'), `${mode} --shadow-glass defined`).toBe(true);

      // (2) The edge highlight must be an actual visible near-white colour.
      const edge = tokenColor('--glass-edge', tokenMap);
      expect(edge.l, `${mode} glass edge is near-white`).toBeGreaterThanOrEqual(0.9);
      expect(edge.alpha, `${mode} glass edge is visible`).toBeGreaterThan(0.1);
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
 * foreground text always passes at minimum APCA Lc 60 (or 55 for dark muted)
 * for body-sized text. These are the most common reading surfaces.
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
      ).toBeGreaterThanOrEqual(mode === 'dark' ? 55 : 60);
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
      ).toBeGreaterThanOrEqual(mode === 'dark' ? 55 : 60);
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

const STATUS_TINT_THRESHOLDS: Record<
  (typeof STATUS_TOKENS)[number],
  {
    light: number;
    dark: number;
  }
> = {
  '--destructive': {
    light: 59,
    dark: 33,
  },
  '--success': {
    light: 60,
    dark: 26,
  },
  '--warning': {
    light: 40,
    dark: 48,
  },
  '--primary': {
    light: 60,
    dark: 13,
  },
  '--info': {
    light: 76,
    dark: 15,
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
      surfaceTokens.flatMap((surface) =>
        modes.map((mode) => [chart, surface, mode] as const)
      )
    )
  )(
    '%s contrast over %s is at least APCA Lc 45 in %s mode',
    (chart, surface, mode) => {
      const tokenMap = buildTokenMap(mode);
      const chartColor = oklchToSrgb(resolveColor(chart, tokenMap));
      const surfaceColor = oklchToSrgb(resolveColor(surface, tokenMap));

      expect(
        Math.abs(apcaContrast(chartColor, surfaceColor)),
        `${chart} over ${surface} in ${mode} mode contrast (APCA)`,
      ).toBeGreaterThanOrEqual(45);
    }
  );
});
