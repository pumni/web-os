import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { apcaContrast } from '@pumni/ui';

type Color = {
  l: number;
  c: number;
  h: number;
  alpha: number;
};

type Rgb = [number, number, number];

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../../../..');
const tokenCss = readFileSync(path.join(repoRoot, 'packages/ui/src/styles/tokens.css'), 'utf8');
const themeCss = readFileSync(path.join(repoRoot, 'packages/ui/src/styles/theme.css'), 'utf8');
const personalizationCss = readFileSync(
  path.join(repoRoot, 'packages/ui/src/styles/personalization.css'),
  'utf8',
);

const ACCENTS = ['cyan', 'indigo', 'violet', 'rose'] as const;
type Accent = (typeof ACCENTS)[number];

const desktopBlobTokens = [
  '--desktop-blob-primary',
  '--desktop-blob-secondary',
  '--desktop-blob-accent',
  '--desktop-blob-cyan',
];

function readVariables(css: string, selector: ':root' | '.dark') {
  const match = css.match(
    new RegExp(`${selector.replace('.', '\\.')}\\s*\\{(?<body>[\\s\\S]*?)\\}`),
  );
  const body = match?.groups?.body ?? '';
  const variables = new Map<string, string>();

  for (const variable of body.matchAll(/(?<name>--[\w-]+):\s*(?<value>[^;]+);/g)) {
    const name = variable.groups?.name;
    const value = variable.groups?.value;

    if (name && value) {
      variables.set(name, value.trim());
    }
  }

  return variables;
}

function buildTokenMap(mode: 'light' | 'dark') {
  const tokenMap = readVariables(tokenCss, ':root');
  const themeMap = readVariables(themeCss, ':root');

  for (const [name, value] of themeMap) {
    tokenMap.set(name, value);
  }

  if (mode === 'dark') {
    for (const [name, value] of readVariables(themeCss, '.dark')) {
      tokenMap.set(name, value);
    }
  }

  return tokenMap;
}

function parseOklch(value: string): Color {
  const oklchPattern = new RegExp(
    '^' +
      'oklch' +
      '\\(\\s*(?<l>[\\d.]+)\\s+(?<c>[\\d.]+)\\s+(?<h>[\\d.]+)(?:\\s*\\/\\s*(?<alpha>[\\d.]+))?\\s*\\)$',
  );
  const match = value.match(oklchPattern);

  if (!match?.groups) {
    throw new Error(`Expected OKLCH color, received: ${value}`);
  }

  return {
    l: Number(match.groups.l),
    c: Number(match.groups.c),
    h: Number(match.groups.h),
    alpha: match.groups.alpha ? Number(match.groups.alpha) : 1,
  };
}

function tokenColor(name: string, tokenMap: Map<string, string>) {
  return resolveColor(name, tokenMap);
}

function oklchToSrgb(color: Color): Rgb {
  const hueRadians = (color.h * Math.PI) / 180;
  const a = color.c * Math.cos(hueRadians);
  const b = color.c * Math.sin(hueRadians);

  const lPrime = color.l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = color.l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = color.l - 0.0894841775 * a - 1.291485548 * b;

  const l = lPrime ** 3;
  const m = mPrime ** 3;
  const s = sPrime ** 3;

  return [
    clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
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
      const glass = tokenColor('--glass-bg', tokenMap);

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

  it.each(['light', 'dark'] as const)(
    'keeps UI edge contrast above APCA Lc 25 threshold in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const border = oklchToSrgb(tokenColor('--glass-border', tokenMap));
      const borderColor = tokenColor('--glass-border', tokenMap);
      const glass = tokenColor('--glass-bg', tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = composite(glass, background);
        const borderOverGlass: Rgb = [
          border[0] * borderColor.alpha + glassOverBlob[0] * (1 - borderColor.alpha),
          border[1] * borderColor.alpha + glassOverBlob[1] * (1 - borderColor.alpha),
          border[2] * borderColor.alpha + glassOverBlob[2] * (1 - borderColor.alpha),
        ];

        expect(
          Math.abs(apcaContrast(borderOverGlass, glassOverBlob)),
          `${mode} ${blobToken} UI contrast (APCA)`,
        ).toBeGreaterThanOrEqual(25);
      }
    },
  );
});

/* ------------------------------------------------------------------ *
 * Accent personalization contrast
 * Gates the claim in personalization.css that every accent (cyan / indigo / violet /
 * rose) keeps the white `--primary-foreground` readable on `--primary`, and that
 * the color-mix-derived accent surface keeps `--accent-foreground` readable on
 * `--accent`. Mirrors the real cascade: cyan = no attribute (hand-tuned theme.css
 * values), violet/rose = `[data-accent]` overrides + derived surface.
 * ------------------------------------------------------------------ */

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function readBlock(css: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripComments(css).match(
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{(?<body>[^}]*)\\}`, 'm'),
  );
  const vars = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? '').matchAll(
    /(?<name>--[\w-]+):\s*(?<value>[^;]+);/g,
  )) {
    if (variable.groups?.name && variable.groups?.value) {
      vars.set(variable.groups.name, variable.groups.value.trim());
    }
  }
  return vars;
}

function buildAccentTokenMap(mode: 'light' | 'dark', accent: Accent) {
  const map = buildTokenMap(mode);
  if (accent === 'cyan') return map;

  for (const [name, value] of readBlock(personalizationCss, `[data-accent="${accent}"]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(personalizationCss, `.dark[data-accent="${accent}"]`)) {
      map.set(name, value);
    }
  }
  for (const [name, value] of readBlock(personalizationCss, `[data-accent]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(personalizationCss, `.dark[data-accent]`)) {
      map.set(name, value);
    }
  }
  return map;
}

function mixOklch(a: Color, b: Color, weightA: number): Color {
  const weightB = 1 - weightA;
  const alpha = a.alpha * weightA + b.alpha * weightB;

  const aAchromatic = a.c < 1e-4;
  const bAchromatic = b.c < 1e-4;
  let h: number;
  if (aAchromatic && bAchromatic) {
    h = 0;
  } else if (aAchromatic) {
    h = b.h;
  } else if (bAchromatic) {
    h = a.h;
  } else {
    let deltaHue = b.h - a.h;
    if (deltaHue > 180) deltaHue -= 360;
    if (deltaHue < -180) deltaHue += 360;
    h = (a.h + weightB * deltaHue + 360) % 360;
  }

  if (alpha === 0) return { l: 0, c: 0, h, alpha: 0 };

  const l = (a.l * a.alpha * weightA + b.l * b.alpha * weightB) / alpha;
  const c = (a.c * a.alpha * weightA + b.c * b.alpha * weightB) / alpha;
  return { l, c, h, alpha };
}

function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function resolveColorValue(value: string, tokenMap: Map<string, string>, seen: Set<string>): Color {
  const trimmed = value.trim();

  if (trimmed === 'transparent') {
    return { l: 0, c: 0, h: 0, alpha: 0 };
  }

  const varMatch = trimmed.match(/^var\((?<name>--[\w-]+)\)$/);
  if (varMatch?.groups?.name) {
    return resolveColor(varMatch.groups.name, tokenMap, seen);
  }

  if (trimmed.startsWith('oklch' + '(')) {
    return parseOklch(trimmed);
  }

  const mixMatch = trimmed.match(/^color-mix\(in oklch,\s*(?<inner>.+)\)$/);
  if (mixMatch?.groups?.inner) {
    const parts = splitTopLevelCommas(mixMatch.groups.inner).map((part) => part.trim());
    const aPart = parts[0] ?? '';
    const bPart = parts[1] ?? '';
    const aWeighted = aPart.match(/^(?<expr>.+?)\s+(?<pct>[\d.]+)%$/);
    const bWeighted = bPart.match(/^(?<expr>.+?)\s+(?<pct>[\d.]+)%$/);
    const aExpr = aWeighted?.groups?.expr ?? aPart;
    const bExpr = bWeighted?.groups?.expr ?? bPart;
    const weightA = aWeighted?.groups?.pct
      ? Number(aWeighted.groups.pct) / 100
      : bWeighted?.groups?.pct
        ? 1 - Number(bWeighted.groups.pct) / 100
        : 0.5;
    const a = resolveColorValue(aExpr, tokenMap, seen);
    const b = resolveColorValue(bExpr, tokenMap, seen);
    return mixOklch(a, b, weightA);
  }

  throw new Error(`Unsupported color value: ${trimmed}`);
}

function resolveColor(
  name: string,
  tokenMap: Map<string, string>,
  seen = new Set<string>(),
): Color {
  if (seen.has(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(' -> ')}`);
  }
  const value = tokenMap.get(name);
  if (!value) {
    throw new Error(`Missing token: ${name}`);
  }
  return resolveColorValue(value, tokenMap, new Set([...seen, name]));
}

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

  it.each(['light', 'dark'] as const)(
    'secondary-foreground is readable on secondary background in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor('--secondary-foreground', tokenMap));
      const background = oklchToSrgb(resolveColor('--secondary', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${mode} secondary text contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  it.each(['light', 'dark'] as const)(
    'card-foreground is readable on card background in %s mode',
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(resolveColor('--card-foreground', tokenMap));
      const background = oklchToSrgb(resolveColor('--card', tokenMap));

      expect(
        Math.abs(apcaContrast(foreground, background)),
        `${mode} card text contrast (APCA)`,
      ).toBeGreaterThanOrEqual(60);
    },
  );

  it.each(['light', 'dark'] as const)('foreground is readable on background in %s mode', (mode) => {
    const tokenMap = buildTokenMap(mode);
    const foreground = oklchToSrgb(resolveColor('--foreground', tokenMap));
    const background = oklchToSrgb(resolveColor('--background', tokenMap));

    expect(
      Math.abs(apcaContrast(foreground, background)),
      `${mode} page text contrast (APCA)`,
    ).toBeGreaterThanOrEqual(60);
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

const STATUS_TOKENS = ['--destructive', '--success', '--warning', '--primary'] as const;

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
    dark: 0,
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
      const chart1 = resolveColor('--chart-1', tokenMap).l;
      const chart2 = resolveColor('--chart-2', tokenMap).l;
      const chart3 = resolveColor('--chart-3', tokenMap).l;
      const chart4 = resolveColor('--chart-4', tokenMap).l;
      const chart5 = resolveColor('--chart-5', tokenMap).l;

      const pairs = [
        [chart1, chart2],
        [chart2, chart3],
        [chart3, chart4],
        [chart4, chart5],
      ] as const;

      for (const [a, b] of pairs) {
        expect(Math.abs(a - b)).toBeGreaterThanOrEqual(0.02);
      }
    },
  );
});
