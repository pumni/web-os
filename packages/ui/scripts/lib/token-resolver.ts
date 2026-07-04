/*
 * Shared token resolver for the `@pumni/ui` design system.
 * Created as part of the unified token resolver architecture.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOklch, type Oklch } from '../../src/lib/oklch';

const scriptsDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const uiRoot = path.dirname(scriptsDir);
const stylesDir = path.join(uiRoot, 'src/styles');

const readStyle = (name: string) => readFileSync(path.join(stylesDir, `${name}.css`), 'utf8');

export const css = {
  tokens: readStyle('tokens'),
  brand: readStyle('brand'),
  theme: readStyle('theme'),
  component: readStyle('component-tokens'),
  personalization: readStyle('personalization'),
} as const;

export type Mode = 'light' | 'dark';
export type Accent = 'coral' | 'cyan' | 'indigo' | 'violet' | 'rose';

export function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Extract `--name: value;` pairs from the first `selector { … }` block. */
export function readVariables(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripComments(source).match(new RegExp(`${escaped}\\s*\\{(?<body>[\\s\\S]*?)\\}`));
  const variables = new Map<string, string>();
  for (const variable of (match?.groups?.body ?? '').matchAll(
    /(?<name>--[\w-]+):\s*(?<value>[^;]+);/g,
  )) {
    const { name, value } = variable.groups ?? {};
    if (name && value) variables.set(name, value.trim());
  }
  return variables;
}

/** Extract variable declarations in specific CSS selectors (e.g. personalization blocks). */
export function readBlock(source: string, selector: string): Map<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = stripComments(source).match(
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

/**
 * Build the resolved token map for a theme mode: primitives (tokens.css) +
 * brand contract + semantic layer + component layers.
 */
export function buildTokenMap(mode: Mode): Map<string, string> {
  const map = readVariables(css.tokens, ':root');
  for (const [name, value] of readVariables(css.brand, ':root')) {
    map.set(name, value);
  }
  for (const [name, value] of readVariables(css.theme, ':root')) {
    map.set(name, value);
  }
  for (const [name, value] of readVariables(css.component, ':root')) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const layer of [css.tokens, css.brand, css.theme, css.component]) {
      for (const [name, value] of readVariables(layer, '.dark')) {
        map.set(name, value);
      }
    }
  }
  return map;
}

export function buildAccentTokenMap(mode: Mode, accent: Accent): Map<string, string> {
  const map = buildTokenMap(mode);
  if (accent === 'coral') return map;

  for (const [name, value] of readBlock(css.personalization, `[data-accent="${accent}"]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(css.personalization, `.dark[data-accent="${accent}"]`)) {
      map.set(name, value);
    }
  }
  for (const [name, value] of readBlock(css.personalization, `[data-accent]`)) {
    map.set(name, value);
  }
  if (mode === 'dark') {
    for (const [name, value] of readBlock(css.personalization, `.dark[data-accent]`)) {
      map.set(name, value);
    }
  }
  return map;
}

export function splitTopLevelCommas(str: string): string[] {
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

export function mixOklch(a: Oklch, b: Oklch, weightA: number): Oklch {
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

const VAR = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/;

export function resolveValue(value: string, map: Map<string, string>, seen: Set<string>): string {
  const match = value.trim().match(VAR);
  if (!match) return value.trim();
  const [, ref, fallback] = match;
  if (ref && map.has(ref) && !seen.has(ref)) {
    seen.add(ref);
    return resolveValue(map.get(ref)!, map, seen);
  }
  if (fallback) return resolveValue(fallback, map, seen);
  throw new Error(`Cannot resolve ${value} (missing ${ref}, no fallback)`);
}

export function resolveLiteral(name: string, map: Map<string, string>): string {
  if (!map.has(name)) throw new Error(`Unknown token: ${name}`);
  return resolveValue(map.get(name)!, map, new Set([name]));
}

export function resolveColorValue(value: string, tokenMap: Map<string, string>, seen: Set<string>): Oklch {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized === 'transparent') {
    return { l: 0, c: 0, h: 0, alpha: 0 };
  }

  const varMatch = normalized.match(/^var\((?<name>--[\w-]+)\)$/);
  if (varMatch?.groups?.name) {
    return resolveColor(varMatch.groups.name, tokenMap, seen);
  }

  if (normalized.startsWith('oklch(')) {
    return parseOklch(normalized);
  }

  const mixMatch = normalized.match(/^color-mix\(\s*in\s+oklch\s*,\s*(?<inner>.+)\)$/);
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

  throw new Error(`Unsupported color value: ${normalized}`);
}

export function resolveColor(
  name: string,
  tokenMap: Map<string, string>,
  seen = new Set<string>(),
): Oklch {
  if (seen.has(name)) {
    throw new Error(`Circular token reference: ${[...seen, name].join(' -> ')}`);
  }
  const value = tokenMap.get(name);
  if (!value) {
    throw new Error(`Missing token: ${name}`);
  }
  return resolveColorValue(value, tokenMap, new Set([...seen, name]));
}

export function resolveOklch(name: string, map: Map<string, string>): Oklch {
  const literal = resolveLiteral(name, map);
  if (!literal.startsWith('oklch(')) {
    throw new Error(`Token ${name} does not resolve to an oklch() literal (got: ${literal})`);
  }
  return parseOklch(literal);
}
