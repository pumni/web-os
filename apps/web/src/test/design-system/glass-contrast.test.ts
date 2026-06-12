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

describe("Liquid Glass contrast tokens", () => {
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
