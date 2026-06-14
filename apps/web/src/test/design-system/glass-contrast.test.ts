import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type Color = {
  l: number;
  c: number;
  h: number;
  alpha: number;
};

type Rgb = [number, number, number];

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../../..");
const tokenCss = readFileSync(path.join(repoRoot, "packages/ui/src/styles/tokens.css"), "utf8");
const themeCss = readFileSync(path.join(repoRoot, "packages/ui/src/styles/theme.css"), "utf8");
const personalizationCss = readFileSync(
  path.join(repoRoot, "packages/ui/src/styles/personalization.css"),
  "utf8",
);

const ACCENTS = ["indigo", "violet", "rose"] as const;
type Accent = (typeof ACCENTS)[number];

const desktopBlobTokens = [
  "--desktop-blob-primary",
  "--desktop-blob-secondary",
  "--desktop-blob-accent",
  "--desktop-blob-cyan",
];

function readVariables(css: string, selector: ":root" | ".dark") {
  const match = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{(?<body>[\\s\\S]*?)\\}`));
  const body = match?.groups?.body ?? "";
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

function buildTokenMap(mode: "light" | "dark") {
  const tokenMap = readVariables(tokenCss, ":root");
  const themeMap = readVariables(themeCss, ":root");

  for (const [name, value] of themeMap) {
    tokenMap.set(name, value);
  }

  if (mode === "dark") {
    for (const [name, value] of readVariables(themeCss, ".dark")) {
      tokenMap.set(name, value);
    }
  }

  return tokenMap;
}

function resolveToken(name: string, tokenMap: Map<string, string>, seen = new Set<string>()): string {
  if (seen.has(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(" -> ")}`);
  }

  const value = tokenMap.get(name);

  if (!value) {
    throw new Error(`Missing token: ${name}`);
  }

  const varMatch = value.match(/^var\((?<name>--[\w-]+)\)$/);

  if (varMatch?.groups?.name) {
    return resolveToken(varMatch.groups.name, tokenMap, new Set([...seen, name]));
  }

  return value;
}

function parseOklch(value: string): Color {
  const oklchPattern = new RegExp(
    "^" +
      "oklch" +
      "\\(\\s*(?<l>[\\d.]+)\\s+(?<c>[\\d.]+)\\s+(?<h>[\\d.]+)(?:\\s*\\/\\s*(?<alpha>[\\d.]+))?\\s*\\)$",
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
  return parseOklch(resolveToken(name, tokenMap));
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

function channelToLinear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: Rgb) {
  return (
    0.2126 * channelToLinear(rgb[0]) +
    0.7152 * channelToLinear(rgb[1]) +
    0.0722 * channelToLinear(rgb[2])
  );
}

function contrastRatio(foreground: Rgb, background: Rgb) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));

  return (lighter + 0.05) / (darker + 0.05);
}

describe("Glass contrast tokens", () => {
  it.each(["light", "dark"] as const)(
    "keeps text contrast at WCAG AA over desktop blobs in %s mode",
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const foreground = oklchToSrgb(tokenColor("--foreground", tokenMap));
      const glass = tokenColor("--glass-bg", tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = composite(glass, background);

        expect(
          contrastRatio(foreground, glassOverBlob),
          `${mode} ${blobToken} text contrast`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(["light", "dark"] as const)(
    "keeps UI edge contrast above the non-text threshold in %s mode",
    (mode) => {
      const tokenMap = buildTokenMap(mode);
      const border = oklchToSrgb(tokenColor("--glass-border", tokenMap));
      const borderColor = tokenColor("--glass-border", tokenMap);
      const glass = tokenColor("--glass-bg", tokenMap);

      for (const blobToken of desktopBlobTokens) {
        const background = tokenColor(blobToken, tokenMap);
        const glassOverBlob = composite(glass, background);
        const borderOverGlass: Rgb = [
          border[0] * borderColor.alpha + glassOverBlob[0] * (1 - borderColor.alpha),
          border[1] * borderColor.alpha + glassOverBlob[1] * (1 - borderColor.alpha),
          border[2] * borderColor.alpha + glassOverBlob[2] * (1 - borderColor.alpha),
        ];

        expect(
          contrastRatio(borderOverGlass, glassOverBlob),
          `${mode} ${blobToken} UI contrast`,
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );
});

/* ------------------------------------------------------------------ *
 * Accent personalization contrast
 * Gates the claim in personalization.css that every accent (indigo / violet /
 * rose) keeps the white `--primary-foreground` readable on `--primary`, and that
 * the color-mix-derived accent surface keeps `--accent-foreground` readable on
 * `--accent`. Mirrors the real cascade: indigo = no attribute (hand-tuned theme.css
 * values), violet/rose = `[data-accent]` overrides + derived surface.
 * ------------------------------------------------------------------ */

function stripComments(css: string) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function readBlock(css: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Anchor on a block boundary (start or a preceding `}`) so `[data-accent="violet"]`
  // does not also match inside `.dark[data-accent="violet"]`.
  const match = stripComments(css).match(
    new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{(?<body>[^}]*)\\}`, "m"),
  );
  const vars = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? "").matchAll(/(?<name>--[\w-]+):\s*(?<value>[^;]+);/g)) {
    if (variable.groups?.name && variable.groups?.value) {
      vars.set(variable.groups.name, variable.groups.value.trim());
    }
  }
  return vars;
}

function buildAccentTokenMap(mode: "light" | "dark", accent: Accent) {
  const map = buildTokenMap(mode);
  // indigo is the default: the provider sets no attribute, so the hand-tuned
  // theme.css accent values apply unchanged — no personalization layer.
  if (accent === "indigo") return map;

  for (const [name, value] of readBlock(personalizationCss, `[data-accent="${accent}"]`)) {
    map.set(name, value);
  }
  if (mode === "dark") {
    for (const [name, value] of readBlock(personalizationCss, `.dark[data-accent="${accent}"]`)) {
      map.set(name, value);
    }
  }
  // Derived accent surface (`--accent` / `--accent-foreground`) applies to any
  // element carrying a `data-accent` attribute.
  for (const [name, value] of readBlock(personalizationCss, `[data-accent]`)) {
    map.set(name, value);
  }
  // Dark mode tightens the on-accent text (`.dark[data-accent]` outranks `[data-accent]`).
  if (mode === "dark") {
    for (const [name, value] of readBlock(personalizationCss, `.dark[data-accent]`)) {
      map.set(name, value);
    }
  }
  return map;
}

function mixOklch(a: Color, b: Color, weightA: number): Color {
  // Shortest-arc hue interpolation (matches CSS color-mix `in oklch`).
  let deltaHue = b.h - a.h;
  if (deltaHue > 180) deltaHue -= 360;
  if (deltaHue < -180) deltaHue += 360;

  return {
    l: a.l * weightA + b.l * (1 - weightA),
    c: a.c * weightA + b.c * (1 - weightA),
    h: (a.h + (1 - weightA) * deltaHue + 360) % 360,
    alpha: a.alpha * weightA + b.alpha * (1 - weightA),
  };
}

function resolveColorValue(value: string, tokenMap: Map<string, string>, seen: Set<string>): Color {
  const trimmed = value.trim();

  const varMatch = trimmed.match(/^var\((?<name>--[\w-]+)\)$/);
  if (varMatch?.groups?.name) {
    return resolveColor(varMatch.groups.name, tokenMap, seen);
  }

  if (trimmed.startsWith("oklch" + "(")) {
    return parseOklch(trimmed);
  }

  const mixMatch = trimmed.match(/^color-mix\(in oklch,\s*(?<inner>.+)\)$/);
  if (mixMatch?.groups?.inner) {
    const parts = mixMatch.groups.inner.split(",").map((part) => part.trim());
    const aPart = parts[0] ?? "";
    const bPart = parts[1] ?? "";
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

function resolveColor(name: string, tokenMap: Map<string, string>, seen = new Set<string>()): Color {
  if (seen.has(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(" -> ")}`);
  }
  const value = tokenMap.get(name);
  if (!value) {
    throw new Error(`Missing token: ${name}`);
  }
  return resolveColorValue(value, tokenMap, new Set([...seen, name]));
}

describe("Accent personalization contrast", () => {
  const modes = ["light", "dark"] as const;

  it.each(ACCENTS.flatMap((accent) => modes.map((mode) => [accent, mode] as const)))(
    "%s accent keeps primary-foreground readable on primary in %s mode",
    (accent, mode) => {
      const tokenMap = buildAccentTokenMap(mode, accent);
      const foreground = oklchToSrgb(resolveColor("--primary-foreground", tokenMap));
      const background = oklchToSrgb(resolveColor("--primary", tokenMap));

      expect(
        contrastRatio(foreground, background),
        `${accent} ${mode} primary text contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(ACCENTS.flatMap((accent) => modes.map((mode) => [accent, mode] as const)))(
    "%s accent keeps accent-foreground readable on the accent surface in %s mode",
    (accent, mode) => {
      const tokenMap = buildAccentTokenMap(mode, accent);
      const foreground = oklchToSrgb(resolveColor("--accent-foreground", tokenMap));
      const background = oklchToSrgb(resolveColor("--accent", tokenMap));

      expect(
        contrastRatio(foreground, background),
        `${accent} ${mode} accent surface contrast`,
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});
